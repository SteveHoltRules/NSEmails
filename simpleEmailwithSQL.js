define(["N/file", "N/render", "N/search"], function (render, search) {
  function onRequest(options) {
    var request = options.request;
    var response = options.response;

    var xmlStr = `'<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n' +
            '<!DOCTYPE pdf PUBLIC \"-//big.faceless.org//report\" \"report-1.1.dtd\">\n' +
            '<pdf lang=\"ru=RU\" xml:lang=\"ru-RU\">\n" + "<head>\n' +
            '<link name=\"russianfont\" type=\"font\" subtype=\"opentype\" ' +
            'src=\"NetSuiteFonts/verdana.ttf\" " + "src-bold=\"NetSuiteFonts/verdanab.ttf\"' +
            'src-italic=\"NetSuiteFonts/verdanai.ttf\" " + "src-bolditalic=\"NetSuiteFonts/verdanabi.ttf\"' +
            'bytes=\"2\"/>\n" + "</head>\n' +
            '<body font-family=\"russianfont\" font-size=\"18\">\n??????? ?????</body>\n" + "</pdf>'`;

    const getCustomerCases = (customerid) => {
      var sql = `SELECT
	SupportCase.ID,
	SupportCase.StartDate,
	SupportCase.CaseNumber,
	BUILTIN.DF( SupportCase.Status ) AS Status,
	Customer.EntityTitle,
	Customer,
	SupportCase.Title AS Subject,
	SupportCase.Issue,
	BUILTIN.DF( SupportCase.Category ) AS Category,
	BUILTIN.DF( SupportCase.Assigned ) AS AssignedTo,
	BUILTIN.DF( SupportCase.Origin ) AS Origin,
	BUILTIN.DF( SupportCase.Priority ) AS Priority,
	SupportCase.TimeElapsed,
	SupportCase.TimeOpen,
	SupportCase.TimeToAssign	
FROM
	SupportCase
	INNER JOIN Entity AS Customer ON
		( Customer.ID = SupportCase.Company )
WHERE
	-- Not Closed or Solved.
	( SupportCase.Status NOT IN ( 5, 6 ) ) 
	AND Customer = ${customerid}
ORDER BY
	Customer`;

      var confirmInfo = query.runSuiteQL({ query: sql }).asMappedResults();
      log.debug("Customer ID", customerid);
      log.debug("Customer ID", confirmInfo);
      return confirmInfo;
    };
    
    var results = getCustomerCases.getRange(0, 1000);
    var renderer = render.create();
    renderer.templateContent = xmlStr;
    renderer.addSearchResults({
      templateName: "exampleName",
      searchResult: results,
    });

    var htmlString = renderer.renderAsString();
    response.setHeader("Content-Type", "text/html");
    // should I change it from write to writefile?
    response.writeFile(htmlString, false);
  }

  return {
    onRequest: onRequest,
  };
});

/**
 * @NApiVersion 2.1
 */
// encode a CSV as text

require(["N/file"], (file) => {
  // Create a file containing text
  let fileObj = file.create({
    name: "testHelloWorld.txt",
    fileType: file.Type.PLAINTEXT,
    contents: "Hello World\nHello World",
  });

  // Set the folder for the file
  // Note that this value is hard-coded in this sample, and you should use
  // a valid folder ID from your account
  fileObj.folder = -15;

  // Save the file
  let id = fileObj.save();

  // Load the same file to ensure it was saved correctly
  fileObj = file.load({
    id: id,
  });
});

function documentSubmit(context, requestPayload) {
  try {
    var responsePayload;

    var sessionScope = runtime.getCurrentSession();

    sessionScope.set({
      name: "suiteQLDocumentInfo",
      value: JSON.stringify(requestPayload),
    });

    responsePayload = { submitted: true };
  } catch (e) {
    log.error({ title: "queryExecute Error", details: e });

    responsePayload = { error: e };
  }

  context.response.write(JSON.stringify(responsePayload, null, 5));
}
