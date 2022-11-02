/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
// This sample shows how to render search results into a PDF file.
define(["N/render", "N/search"], function (render, search) {
  function onRequest(options) {
    var request = options.request;
    var response = options.response;

    var xmlStr = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"><html xmlns="http://www.w3.org/1999/xhtml"><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" /><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title></title>
<style type="text/css">.ReadMsgBody,.ExternalClass{
				width:100%;
			}
			.ExternalClass,.ExternalClass p,.ExternalClass span,.ExternalClass font,.ExternalClass td,.ExternalClass div{
				line-height:100%;
			}
			table,td{
				mso-table-lspace:0pt;
				mso-table-rspace:0pt;
			}
			body,table,td,p{
				-ms-text-size-adjust:100%;
				-webkit-text-size-adjust:100%;
			}
			@media only screen and (max-width: 480px){
				body,table,td,p{
					-webkit-text-size-adjust:none !important;
				}
				h1,h2,h3{
					line-height:125% !important;
				}
				h1{
					font-size:25px !important;
				}
				h2{
					font-size:19px !important;
				}
				h3{
					font-size:16px !important;
				}
				body{
					width:100% !important;
					min-width:100% !important;
				}
				table[id=template]{
					max-width:600px !important;
					width:100% !important;
				}
				table[id=templateHeader],table[id=templateFooter],table[id=templateBody]{
					max-width:600px !important;
					width:100% !important;
				}
				td[id=templateBodyContainer]{
					padding-right:20px !important;
					padding-left:20px !important;
				}
				table[id=templateBody]{
					font-size:18px !important;
					line-height:125% !important;
				}
				td[id=templateHeaderContainer],td[id=templateFooterContainer]{
					padding-right:10px !important;
					padding-left:10px !important;
				}
				table[class=templateColumn]{
					padding-right:0px !important;
					padding-left:0px !important;
				}
				table[id=templateHeader], table[id=templateFooter]{
					font-size:14px !important;
					line-height:115% !important;
				}
				table[id=templateHeader]{
					display:block !important;
				}
				table[class=templateHeaderRight], table[class=templateHeaderLeft],table[class=templateColumn]{
					width:100% !important;
				}
				table[class=templateHeaderLeft]{
					text-align:left !important;
				}
			}
</style>
</head><body style="background-color:#F0F0F0;">
<table align="center" border="0" cellpadding="0" cellspacing="0" id="bodyTable" style="margin:0; padding:0; height:100% !important; width:100% !important; background-color:#F0F0F0; border-collapse: collapse; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;" width="100%">
<tbody>
	<tr>
	<td align="center" style="border-top: 0; margin: 0; padding: 20px; height: 100% !important; width: 100% !important;" valign="top"><!-- template -->
	<table border="0" cellpadding="0" cellspacing="0" id="template" style="border:0; background-color:#FFFFFF; color:#666666; font-family:Helvetica; font-size:15px; line-height:150%; text-align:left; border-collapse: collapse; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;" width="600">
	<tbody>
		<tr><!-- header -->
		<td align="center" id="templateHeaderContainer" style="padding-top:10px; padding-right:20px; padding-left:20px; padding-bottom:10px; font-size:11px; line-height:125%; -ms-text-size-adjust:100%; -webkit-text-size-adjust:100%;" valign="top">
		<table border="0" cellpadding="0" cellspacing="0" id="templateHeader" style="border-top:0; border-bottom:0; border-collapse: collapse; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;" width="610">
		<tbody>
			<tr>
			<td valign="top">
			<table align="left" border="0" cellpadding="0" cellspacing="0" class="templateHeaderRight" width="400">
			<tbody>
				<tr>
				<td style="padding-top:15px" valign="top">Lorem ipsum dolor sit amet</td>
				</tr>
			</tbody>
			</table>

			<table border="0" cellpadding="0" cellspacing="0" class="templateHeaderLeft" style="text-align:right;" width="208">
			<tbody>
				<tr>
				<td style="padding-top:15px;" valign="top"><#--FM:BEGIN--><#if companyInformation.url?has_content><a href="${companyInformation.url}" style="word-wrap:break-word; color:#444444;">Visit our website</a></#if><#--FM:END--></td>
				</tr>
			</tbody>
			</table>
			</td>
			</tr>
		</tbody>
		</table>
		</td>
		<!-- /header --></tr>
		<tr><!-- body -->
		<td align="center" id="templateBodyContainer" style="padding-right:10px; padding-left:10px;" valign="top">
		<table border="0" cellpadding="0" cellspacing="0" id="templateBody" style="border-top: 0;border-bottom: 0;" width="600">
		<tbody>
			<tr>
			<td align="center" valign="top">
			<table align="left" border="0" cellpadding="0" cellspacing="0" class="templateColumn" style="padding-right:10px;" width="168">
			<tbody>
				<tr>
				<td valign="top">
				<p>Vestibulum at libero at urna feugiat feugiat. Fusce sodales metus non rhoncus viverra.</p>
				</td>
				</tr>
			</tbody>
			</table>

			<table align="left" border="0" cellpadding="0" cellspacing="0" class="templateColumn" style="padding-left:10px;" width="428">
			<tbody>
				<tr>
				<td valign="top">
				<h1 style="text-align:left; font-size:38px; letter-spacing:-1px; margin:0; padding:0; display:block; font-style:normal; font-weight:bold; line-height:125%;">Lorem ipsum dolor</h1>

				<h2 style="text-align:left; font-size:25px; letter-spacing:-.75px; margin:0; padding:0; display:block; font-style:normal; font-weight:bold; line-height:125%;">Lorem ipsum dolor sit amet, consectetur adipiscing.</h2>

				<p style="text-align:left;">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut nec nulla turpis. Praesent egestas condimentum dolor a venenatis. Quisque felis dolor, cursus at mauris vitae, dapibus rutrum velit. Cras vestibulum arcu urna. Etiam velit sapien, facilisis id aliquam commodo, commodo at elit.</p>

				<h3 style="text-align:left; font-size:18px; letter-spacing:-.5px; margin:0; padding:0; display:block; font-style:normal; font-weight:bold; line-height:125%;">Lorem ipsum dolor sit amet</h3>

				<p style="text-align:left;">Aenean elit justo, blandit nec interdum in, tristique et nisl. Cras libero erat, adipiscing non pretium sit amet, fringilla sed massa. Curabitur quis nisi molestie diam pellentesque varius. Integer lacus ipsum, molestie ut urna mollis, ornare vulputate felis.</p>
				</td>
				</tr>
			</tbody>
			</table>
			</td>
			</tr>
			<tr>
			<td valign="top">
			<p style="text-align:left;">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut nec nulla turpis.</p>
			</td>
			</tr>
		</tbody>
		</table>
		</td>
		<!-- /body --></tr>
		<tr><!-- footer -->
		<td align="center" id="templateFooterContainer" style="padding-top:10px; padding-right:20px; padding-bottom:20px; padding-left:20px; font-size:11px; line-height:125%; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;" valign="top">
		<table align="left" border="0" cellpadding="0" cellspacing="0" id="templateFooter" style="border-collapse: collapse; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;" width="610">
		<tbody>
			<tr>
			<td valign="top"><em>Copyright &copy; <#--FM:BEGIN--><#assign currentYear=.now?string("yyyy")>${currentYear} ${companyInformation.companyName}<#--FM:END-->, All rights reserved.</em><br />
			<#--FM:BEGIN--><#if companyInformation.logoUrl?has_content><img alt="${companyInformation.companyName}" src="${companyInformation.logoUrl}" title="${companyInformation.companyName} Email" /></#if><#--FM:END--></td>
			</tr>
		</tbody>
		</table>
		</td>
		<!-- /footer --></tr>
	</tbody>
	</table>
	<!-- /template --></td>
	</tr>
</tbody>
</table>
</body></html>`;

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
  }

  return {
    onRequest: onRequest,
  };
});

// from Tim Dietrich
function jsFunctionResponseGenerateTable() {
  return `
	
		function responseGenerateTable() {
		
			document.getElementById('nullFormatDiv').style.display = "block";
					
			if ( queryResponsePayload.records.length > 0 ) {
								
				var columnNames = Object.keys( queryResponsePayload.records[0] );
				
				var firstColumnIsRowNumber = false;
				var rowNumbersHidden = false;

				if ( document.getElementById('enablePagination').checked ) {
					firstColumnIsRowNumber = true;
					if ( document.getElementById('hideRowNumbers').checked ) {
						rowNumbersHidden = true;
					}
				}

				var thead = '<thead class="thead-light">';
				thead += '<tr>';
				for ( i = 0; i < columnNames.length; i++ ) {
					if ( ( i == 0 ) && ( firstColumnIsRowNumber ) && ( rowNumbersHidden === false) ) {
						thead += '<th style="text-align: center;">&nbsp;#&nbsp;</th>';
					} else if ( ( i == 0 ) && ( firstColumnIsRowNumber ) && ( rowNumbersHidden === true) ) {
						continue;
					} else {
						thead += '<th>' + columnNames[i] + '</th>';
					}
				}
				thead += '</tr>';
				thead += '</thead>';

				var tbody = '<tbody>';
				for ( r = 0; r < queryResponsePayload.records.length; r++ ) {		
					tbody += '<tr>';
					for ( i = 0; i < columnNames.length; i++ ) {
						var value = queryResponsePayload.records[r][ columnNames[i] ];
						if ( value === null ) {
							var nullFormat = radioFieldValueGet( 'nullFormat' );
							if ( nullFormat == 'dimmed' ) {
								value = '<span style="color: #ccc;">' + value + '</span>';
							} else if ( nullFormat == 'blank' ) {
								value = '';
							} else {
								value = 'null';
							}
						}
						if ( ( i == 0 ) && ( firstColumnIsRowNumber ) && ( rowNumbersHidden === false) ) {
							tbody += '<td style="text-align: center;">' + value + '</td>';
						} else if ( ( i == 0 ) && ( firstColumnIsRowNumber ) && ( rowNumbersHidden === true) ) {
							continue;							
						} else {
							tbody += '<td>' + value + '</td>';					
						}
					}				
					tbody += '</tr>';		
				}	
				tbody += '</tbody>';
			
				var content = '<h5 style="margin-bottom: 3px; color: #4d5f79; font-weight: 600;">Results</h5>';
				content += 'Retrieved ' + queryResponsePayload.records.length;
				if ( document.getElementById('returnTotals').checked ) {
					content += ' of ' + queryResponsePayload.totalRecordCount;
				}
				content += ' rows in ' + queryResponsePayload.elapsedTime + 'ms.<br>';	
				content += '<div class="table-responsive">';
				content += '<table class="table table-sm table-bordered table-hover table-responsive-sm" id="resultsTable">';
				content += thead;
				content += tbody;
				content += '</table>';
				content += '</div>';		

				document.getElementById('resultsDiv').innerHTML = content;
			
				if ( radioFieldValueGet( 'resultsFormat' ) == 'datatable' ) {
					$('#resultsTable').DataTable();
				}
			
			} else {
			
				document.getElementById('resultsDiv').innerHTML = '<h5 class="text-warning">No Records Were Found</h5>';
				
			}

		}	
			
	`;
}