/**
 * @description This schedule script associates pdfs to relevant patient record via orderguid. features:
 *
 * - relies upon pdf in the todo folder
 * 
 * - will only associate one-time -- moving file from `todo` to `archive` queue when done
 * 
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @author Gerald Gillespie <gerald.gillespie@inscio.com>
 * @file SuiteScripts/integration/nco_mcm_ss_attachfiles.js
 */
define(["N/task", "N/runtime", "N/file", "N/query", "N/record"], (
  task,
  runtime,
  file,
  query,
  record
) => {
  /**
   *
   * @type {{scriptParameters: {candidateFileRegex: string, folders: {todo: string, archive: string, error: string}}, candidateSql: string}}
   */
  const CFG = {
    scriptParameters: {
      candidateFileRegex: `custscript_nco_mcm_ss_fileregex` /* @todo put this param on deployment */,
      targetRecordQuery: `custscript_nco_mcm_ss_filetargetrec`,
      folders: {
        todo: `custscript_nco_mcm_ss_sftp_nsfolderid`,
        error: `custscript_nco_mcm_ss_folderid_error`,
        archive: `custscript_nco_mcm_ss_folderid_archive`,
      }, // company pref
    },
  };

  const SS = {
    // Script,
    // Reschedule
    governance: {
      allowed: 10000,
      current: undefined,
      lowerLimit: 200,
    },
    candidateRegex: "[.]pdf$", // default /[.]csv$/,
    folders: {
      todo: 3851,
      error: 3852,
      archive: 3853,
    },
  };

  // eslint-disable-next-line no-underscore-dangle
  const _f = {
    /**
     * @description query the file record of netsuite.  does not load any files
     * @example
     * // returns an iterator based on files in folder  for matching pdf files
     * _listFiles({ folder : 3577, fileSearchRegex : '[.]pdf$'}
     * @param {Number} folder
     * @param {RegExp|String} fileSearchRegex
     * @returns {Object<function>}
     * @private
     */
    listFiles({ folder, fileSearchRegex, sql }) {
      let iterator = {
        each() {},
      };
      // convert regex to a string
      if (fileSearchRegex instanceof RegExp)
        fileSearchRegex = fileSearchRegex.source; // eslint-disable-line no-param-reassign

      // look at the  folder by query
      const candidatePageResults = query.runSuiteQLPaged({
        query: sql,
        params: [folder, fileSearchRegex],
        pageSize: 250,
      });

      // build a list to work on (oldest first)
      candidatePageResults.iterator().each((page) => {
        iterator = page.value.data.iterator();
        return false;
      });

      return iterator;
    }, // private function
    /**
     *
     * @param recType
     * @param recId
     * @param recTypeTo
     * @param recIdTo
     */
    attachFileToRecord({ recType, recId, recTypeTo, recIdTo }) {
      let outcome;
      try {
        record.attach({
          record: { type: recType, id: recId },
          to: { type: recTypeTo, id: recIdTo },
        });
        outcome = true;
      } catch (e) {
        outcome = false;
      }
      return outcome;
    },
    governanceCheck(deduction = 0) {
      if (typeof SS.governance.current === "undefined")
        SS.governance.current =
          SS.governance.allowed - SS.governance.lowerLimit;
      SS.governance.current -= deduction;

      return SS.governance.current > SS.governance.lowerLimit;
    },

    /**
     * @description modifies the file record  about any failures.
     * @param {file.File} candidateFile netsuite File record
     * @returns {Number} id of the file being worked on
     * @private
     */
    tagFailures({ candidateFile }) {
      candidateFile.description += `\nAttachment of file Failed at ${new Date().getTime()}`;
      return candidateFile.save();
    },
  }; // _f

  /**
   * @description Defines the Scheduled script trigger point.
   * 1. set parameters
   * @param {Object} scriptContext
   * @since 2015.2
   */
  const execute = (/* {type }*/) => {
    // check if a script param has been supplied
    // 1.
    const fileSearchRegex = new RegExp(
      SS.Script.getParameter(CFG.scriptParameters.candidateFileRegex)
    );

    SS.folders.todo = parseInt(
      SS.Script.getParameter(CFG.scriptParameters.folders.todo),
      10
    );
    SS.folders.archive = parseInt(
      SS.Script.getParameter(CFG.scriptParameters.folders.archive),
      10
    );
    SS.folders.error = parseInt(
      SS.Script.getParameter(CFG.scriptParameters.folders.error),
      10
    );
    const targetQuery = SS.Script.getParameter(
      CFG.scriptParameters.targetRecordQuery
    );

    const folders = { ...SS.folders }; // CFG.hl7Folder;
    // eslint-disable-next-line no-unused-vars
    let doFileSave = false;

    _f.governanceCheck(0);

    const iterator = _f.listFiles({
      folder: folders.todo,
      fileSearchRegex,
      sql: targetQuery,
    });

    let counter = 0;
    iterator.each((result) => {
      counter++;
      let abort;
      const candidateFileInfo = result.value.asMap();

      log.audit({
        title: `processing file${candidateFileInfo.id}`,
        details: { candidateFileInfo, counter },
      });

      try {
        const {
          id,
          rectype,
          recid,
          rectypeto,
          recidto,
          overridefolder,
          currentfolder,
        } = candidateFileInfo;

        // determine new folder
        const newfolder = overridefolder || folders.archive;

        doFileSave = newfolder !== currentfolder;

        // associate/attach
        if (rectypeto && recidto)
          _f.attachFileToRecord({
            recType: rectype,
            recId: recid,
            recTypeTo: rectypeto,
            recIdTo: recidto,
          });

        log.debug({
          title: "attached file",
          details: {
            recType: rectype,
            recId: recid,
            recTypeTo: rectypeto,
            recIdTo: recidto,
          },
        });

        [newfolder]
          .filter((folder) => folder && doFileSave)
          .flatMap(function (destination) {
            this.folder = destination;
            this.save();
            return [this];
          }, file.load({ id }))
          // eslint-disable-next-line no-shadow
          .forEach(({ id, name, description, folder }) => {
            log.audit({
              title: "Changed File",
              details: { id, description, folder, name },
            });
          });
      } catch (error) {
        log.error({ title: "Error procssing file", details: { error } });
      }
      if (abort) return false;

      return _f.governanceCheck(20);
    }); // each
  }; // execute

  return {
    execute: (...args) => {
      SS.Script = runtime.getCurrentScript();
      try {
        execute(...args);
      } catch (e) {
        log.error({ title: "error in attachfiles", details: { args, e } });
      } finally {
        // reschedule
        try {
          SS.Reschedule = task.create({
            taskType: task.TaskType.SCHEDULED_SCRIPT,
            scriptId: SS.Script.id,
            deploymentId: SS.Script.deploymentId,
          });
          SS.Reschedule.submit();
        } catch (error) {
          /**
           * @todo email someone?
           */
        }
      }
    },
  };
});
