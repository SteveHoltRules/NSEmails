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

    var rs = search
      .create({
        type: search.Type.TRANSACTION,
        columns: ["trandate", "amount", "entity"],
        filters: [],
      })
      .run();

    var results = rs.getRange(0, 1000);
    var renderer = render.create();
    renderer.templateContent = xmlStr;
    renderer.addSearchResults({
      templateName: "exampleName",
      searchResult: results,
    });

    var newfile = renderer.renderAsPdf();
    response.writeFile(newfile, false);

    var htmlString = renderer.renderAsString();							
    context.response.setHeader('Content-Type', 'text/html');
    // should I change it from write to writefile?
		context.response.writeFile( htmlString, false );		

  }

  return {
    onRequest: onRequest,
  };
});


/**
 * @NApiVersion 2.1
 */
// encode a CSV as text


require(['N/file'], file => {
    // Create a file containing text
    let fileObj = file.create({
        name: 'testHelloWorld.txt',
        fileType: file.Type.PLAINTEXT,
        contents: 'Hello World\nHello World'
    });
 
    // Set the folder for the file
    // Note that this value is hard-coded in this sample, and you should use
    // a valid folder ID from your account
    fileObj.folder = -15;
 
    // Save the file
    let id = fileObj.save();
 
    // Load the same file to ensure it was saved correctly
    fileObj = file.load({
        id: id
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

function documentGenerate(context) {
  try {
    var sessionScope = runtime.getCurrentSession();

    var docInfo = JSON.parse(sessionScope.get({ name: "suiteQLDocumentInfo" }));

    var moreRecords = true;

    var paginatedRowBegin = docInfo.rowBegin;

    var paginatedRowEnd = docInfo.rowEnd;

    var queryParams = new Array();

    var records = new Array();

    do {
      var paginatedSQL =
        "SELECT * FROM ( SELECT ROWNUM AS ROWNUMBER, * FROM (" +
        docInfo.query +
        " ) ) WHERE ( ROWNUMBER BETWEEN " +
        paginatedRowBegin +
        " AND " +
        paginatedRowEnd +
        ")";

      var queryResults = query
        .runSuiteQL({ query: paginatedSQL, params: queryParams })
        .asMappedResults();

      records = records.concat(queryResults);

      if (queryResults.length < 5000) {
        moreRecords = false;
      }

      paginatedRowBegin = paginatedRowBegin + 5000;
    } while (moreRecords);

    var recordsDataSource = { records: records };

    var renderer = render.create();
    renderer.addCustomDataSource({
      alias: "results",
      format: render.DataSource.OBJECT,
      data: recordsDataSource,
    });
    
    renderer.templateContent = docInfo.template;

    if (docInfo.docType == "pdf") {
      let renderObj = renderer.renderAsPdf();
      let pdfString = renderObj.getContents();
      context.response.setHeader("Content-Type", "application/pdf");
      context.response.write(pdfString);
    }
    // this is what I need.
    else {
      let htmlString = renderer.renderAsString();
      context.response.setHeader("Content-Type", "text/html");
      context.response.write(htmlString);
    }
  } catch (e) {
    log.error({ title: "documentGenerate Error", details: e });

    context.response.write("Error: " + e);
  }
}

function getRequestHandle(context) {
  if (context.request.parameters.hasOwnProperty("function")) {
    if (context.request.parameters["function"] == "tablesReference") {
      htmlGenerateTablesReference(context);
    }

    if (context.request.parameters["function"] == "documentGenerate") {
      documentGenerate(context);
    }
  } else {
    var form = serverWidget.createForm({
      title: `SuiteQL Query Tool`,
      hideNavBar: false,
    });

    var htmlField = form.addField({
      id: "custpage_field_html",
      type: serverWidget.FieldType.INLINEHTML,
      label: "HTML",
    });

    htmlField.defaultValue = htmlGenerateTool();

    context.response.writePage(form);
  }
}