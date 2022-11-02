/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 *
 * @author Gerald Gillespie <gerald.gillespie@inscio.com>
 * @description Connect to an FTP server and get or put all the files needed (e.g. HL7) files
 * 1. read deployment parameters
 * 1.1 ftp connection instructions
 * 1.2 download or uploading files
 * 1.3 file patterns to recognize
 * 2. managing governance for the script
 */
define(["N/runtime", "N/file", "./nco_mcm_lib_sftp", "N/task"], (
  runtime,
  file,
  FtpFiles,
  task
) => {
  const cfg = {
    processingParameters: {
      getFileGlob: "custscript_nco_mcm_ss_sftp_getglob",
      nsFolderId: "custscript_nco_mcm_ss_sftp_nsfolderid",
      getFileRegex: "custscript_nco_mcm_ss_sftp_getregex",
      directionIsPull: "custscript_nco_mcm_ss_sftp_isget",
      putQuery: "custscript_nco_mcm_ss_sftp_filequery",
      doSourceRemoval: "custscript_nco_mcm_ss_sftp_do_src_delete",
    },
    /**
     * @typedef {Object} connectionParameters
     * @property {string} ftpHost - hostname
     * @property {number} port - port number
     * @property {string} hostKeyType - encryption type e.g. `rsa`
     * @property {string} keyId - location (scriptId) in netsuite where key is securely stored
     * @property {string} secretId - netsuite scriptId where it is stored
     * @property {string} directory - relative location on remote ftp site
     * @property {string} username - username to login with
       * @example
       *      url        : '99.233.234.15',
       keyId      : 'custkey_mcm_sshtest1',
       hostKey    : 'ssh-rsa +6oqLf0TLB1u1WSI7k5WnmX9diuHY8B/mxy5uoeoZ+crZ1//HfnjfoaEbVC44Mue7Qw2hoWFxnb+CB7n',
       username   : 'mcmuser1',
       port       : 50022,
       directory  : 'ftp/hl7',
       timeout    : 20,
       hostKeyType: 'rsa',
       secret     : 'custsecret_mcm_integrations_ftp_test'
       */
    /**
     * @type connectionParameters
     */
    connectionParameters: {
      ftpHost: "custscript_nco_mcm_ss_sftp_host",
      keyId: "custscript_nco_mcm_ss_sftp_keyid", // 'custkey_mcm_sshtest1'
      publicHostKey: "custscript_nco_mcm_ss_sftp_hostkey", // ssh-rsa ....
      username: "custscript_nco_mcm_ss_sftp_username",
      port: "custscript_nco_mcm_ss_sftp_port", // 50022
      timeout: 20, // will be static on 20
      directory: "custscript_nco_mcm_ss_sftp_directory",
      hostKeyType: "custscript_nco_mcm_ss_sftp_keytype", // rsa
      secretId: "custscript_nco_mcm_ss_sftp_secretid", //  'custsecret_mcm_integrations_ftp_test'
    },
  }; // cfg

  const SS = {
    processingParameters: {},
    /**
     * @type connectionParameters
     */
    connectionInfo: {},
    Timer: {
      start: null,
      end: null,
      durationInSeconds: null,
    },
    // Governance: {}, //see definition
    Script: null,
  };
  SS.Governance = {};

  /**
   * -1 means no limit.
   * @type {number}
   */
  SS.LoopLimit = -1;

  Object.defineProperties(SS.Governance, {
    current: {
      get: () => {
        if (!SS.Script) SS.Script = runtime.getCurrentScript();

        return SS.Script.getRemainingUsage();
      },
      enumerable: true,
    },

    lowerLimit: {
      value: 100, // leave some governance room to update the last timestamp processed
      writable: false,
      enumerable: true,
    },

    exceeded: {
      value: false,
      writable: true,
      enumerable: true,
    },
  }); // governance

  /**
   * @description logs timer information to the log
   * @param start
   * @param end
   */
  const logTimer = ({ start, end, message }) => {
    try {
      // eslint-disable-next-line no-restricted-syntax
      for (const [key, value] of Object.entries({ start, end, message })) {
        // eslint-disable-next-line no-continue
        if (typeof value === "undefined") continue;

        SS.Timer[key] = value;
      }
      if (SS.Timer.end !== null && SS.Timer.start !== null)
        SS.Timer.durationInSeconds = (SS.Timer.end - SS.Timer.start) / 1000;
      log.audit("logTimer", SS.Timer);
    } catch (e) {
      log.audit("logTimer: error", e);
    }
  }; // function

  const hasGovernanceClearance = (downloadCost) => {
    if (!SS.Governance.exceeded)
      SS.Governance.exceeded =
        SS.Governance.current - downloadCost < SS.Governance.lowerLimit;

    log.audit("hasGovernanceClearance", {
      downloadCost,
      Governance: SS.Governance,
    });

    return !SS.Governance.exceeded;
  };

  // eslint-disable-next-line no-underscore-dangle
  const _setReschedule = () => {
    SS.Reschedule = task.create({
      taskType: task.TaskType.SCHEDULED_SCRIPT,
      scriptId: SS.Script.id,
      deploymentId: SS.Script.deploymentId,
    });
  };

  /**
   * @description either loops through the known connection parameters to get values from the deployment OR assigns static values from the config
   * @private
   */
  // eslint-disable-next-line no-underscore-dangle
  const _initializeConnectionParameters = () => {
    const connectionInfo = {};
    // eslint-disable-next-line no-restricted-syntax
    for (const [key, scriptid] of Object.entries(cfg.connectionParameters)) {
      if (/^custscript/.test(scriptid))
        connectionInfo[key] = SS.Script.getParameter(scriptid);
      else connectionInfo[key] = scriptid;
    }
    Object.assign(SS.connectionInfo, connectionInfo);
  };

  // eslint-disable-next-line no-underscore-dangle
  const _initializeProcessingParameters = () => {
    const processingParameters = {};
    // eslint-disable-next-line no-restricted-syntax
    for (const [key, scriptid] of Object.entries(cfg.processingParameters)) {
      if (/^custscript/.test(scriptid))
        processingParameters[key] = SS.Script.getParameter(scriptid);
      else processingParameters[key] = scriptid;
    }
    Object.assign(SS.processingParameters, processingParameters);
    log.debug({
      title: "SS.processingParameters",
      details: { processingParameters },
    });
  };

  /**
   * @description Defines the Scheduled script trigger point.
   * 0. initialize setup
   * 0.1 parameters from deployment
   * A Direction = Get / Pull
   * 1. connect to service and  get a list of files
   * 2. process each file
   * 2.1. download the file to file cabinet
   * 2.2. remove from source
   * 3. reschedule a task
   *   3.1 submit
   *
   * B Direction = Put / Push
   * 1. look at local folder and get a list of files
   * @param {Object} scriptContext
   * @param {String} scriptContext.type - Script execution context. Use values from the
   *   scriptContext.InvocationType enum.
   * @since 2015.2
   */
  // eslint-disable-next-line no-unused-vars
  const execute = ({ type }) => {
    // 0. set script
    SS.Script = runtime.getCurrentScript();
    // 0.1
    _initializeConnectionParameters();
    _initializeProcessingParameters();

    // 3.
    _setReschedule();
    log.debug({ title: "script to reschedule", details: SS });

    logTimer({
      start: new Date().getTime(),
      message: "begin execute",
    });

    let filesProcessedCount = 0;

    // initialize
    let estimatedLoopGovernanceCost;

    // 1. connecto to service
    const myFiles = FtpFiles.CreateInstance({
      url: SS.connectionInfo.ftpHost,
      keyId: SS.connectionInfo.keyId,
      hostKey: SS.connectionInfo.publicHostKey,
      username: SS.connectionInfo.username,
      port: SS.connectionInfo.port,
      hostKeyType: SS.connectionInfo.hostKeyType,
      directory: SS.connectionInfo.directory,
      timeout: SS.connectionInfo.timeout,
      secret: SS.connectionInfo.secretId,
    });

    // determine direction
    if (SS.processingParameters.directionIsPull) {
      estimatedLoopGovernanceCost = 120;

      // 1. get a list of files
      const candidateHL7s = myFiles.listRemoteFiles({
        directory: "",
        pattern: SS.processingParameters.getFileGlob,
        regex: new RegExp(SS.processingParameters.getFileRegex, "i"),
      });

      logTimer({
        start: new Date().getTime(),
        message: "begin loop",
      });

      // 2.
      for (let i = 0; i < candidateHL7s.length; i++) {
        filesProcessedCount = i;
        const hl7 = candidateHL7s[i];

        // do not process files if we are over governance expectations
        if (!hasGovernanceClearance(estimatedLoopGovernanceCost)) break;

        // escape clause
        if (SS.LoopLimit && SS.LoopLimit > 0 && i > SS.LoopLimit) break;

        // download the file
        try {
          // 2.1
          hl7.download();

          if (!hl7.nsFile) throw new Error("missing netsuite file");

          // 2.1
          const { name } = hl7.nsFile;
          let result;
          if (/hl7$/i.test(name)) {
            result = FtpFiles.ConvertAndSaveTextFile({
              name: hl7.nsFile.name,
              contents: hl7.nsFile.getContents(),

              folder: SS.processingParameters.nsFolderId,
            });
          } else if (/pdf$/i.test(name)) {
            // pdf
            try {
              result = FtpFiles.SaveBinaryFile({
                file: hl7.nsFile,
                name: hl7.nsFile.name,
                folder: SS.processingParameters.nsFolderId,
              });
            } catch (e) {
              log.error({
                title: "failed to save otherwise",
                details: { e },
              });
              result = FtpFiles.SaveBinaryFile({
                name: hl7.nsFile.name,
                contents: hl7.nsFile.getContents(),
                folder: SS.processingParameters.nsFolderId,
              });
            }
          }
          // have to do the remove in same step (for governance)

          // 2.2
          if (result) hl7.remove();
        } catch (error) {
          log.error({
            title: "error in processing hl7s",
            details: { error, hl7 },
          });
          // throw (e);
        } // try
      } // for
    }
    // put
    else {
      let doSourceRemoval = false;
      let doRename = false;
      let doMove = false;
      const candidatesForPush = myFiles.listLocalFiles({
        nsdirectory: SS.processingParameters.nsFolderId,
        regex: SS.processingParameters.getFileRegex,
        query: SS.processingParameters.putQuery,
      });

      for (let i = 0; i < candidatesForPush.length; i++) {
        estimatedLoopGovernanceCost = 120;
        filesProcessedCount = i;
        const candidate = candidatesForPush[i];

        // decide on removal & renaming
        doSourceRemoval =
          candidate.doremoval && SS.processingParameters.doSourceRemoval;
        doRename = typeof candidate.newlocalname !== "undefined";
        doMove = typeof candidate.newlocalfolder !== "undefined";

        if (doRename || doMove) {
          estimatedLoopGovernanceCost += 10;
        }

        // connect
        // download the file

        try {
          if (!hasGovernanceClearance(estimatedLoopGovernanceCost)) break;

          if (candidate.nsFile)
            // 2.1 //accn<accnid>labresults.<type>
            candidate.upload();

          /** @todo add removal as deployment option */
          if (candidate.isUploaded && doSourceRemoval) {
            candidate.remove();
          } else if (candidate.isUploaded) {
            candidate.moveAndRename({ doRename, doMove });
          }
        } catch (error) {
          log.error({
            title: "Error in uploading to ftp",
            details: { candidate, error },
          });
          // throw (error);
        } // try
      } // for
    } // if

    logTimer({
      start: new Date().getTime(),
      message: `loop finished`,
    });
    log.audit(`hl7 file ops completed. ${filesProcessedCount} processed `);
  }; // execute entry point

  return {
    execute: (...args) => {
      try {
        execute(...args);
      } catch (error) {
        log.error({
          title: "error in execute",
          details: { error },
        });
        // 3.1 reschedule
      } finally {
        try {
          SS.RescheduleId = SS.Reschedule.submit();
          log.debug({
            title: "script to reschedule",
            details: SS,
          });
        } catch (e) {
          log.error("reschedule", e);
        }
      }
    },
  };
}); // define cb
