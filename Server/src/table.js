import {getAnnotationResults} from "./network_functions.js"
const fs = require('fs');
const path = require('path');

var buffer_tables = {}

console.log("Loading Classifier")
import {attempt_predictions, classify, grouped_predictor} from "./classifier.js"

var readyTableData = async (docname , page, collection_id) => {
  try {
  const docid = docname+"_"+page+".html"
  var htmlFolder = path.join(global.tables_folder, collection_id) //global.tables_folder+"/",
  const htmlFile = docid


  //If an override file exists then use it!. Overrides are those produced by the editor.
  var file_exists = await fs.existsSync( path.join(global.tables_folder_override, collection_id, docid) )

  if ( file_exists ) {
    htmlFolder = path.join(global.tables_folder_override, collection_id) //"HTML_TABLES_OVERRIDE/"
  }

  console.log("Loading Table: "+docid+" "+(file_exists ? " [Override Folder]" : ""))

  var result = new Promise(function(resolve, reject) {

  if ( buffer_tables[docid] ){ // early exit if buffer already has it.
    resolve(buffer_tables[docid])
  }


  try {
    fs.readFile(path.join(htmlFolder,htmlFile), //already has collection_id in html_folder
                "utf8",
                function(err, data) {
                  fs.readFile(path.join(global.cssFolder,"stylesheet.css"),
                              "utf8",
                              async function(err2, data_ss) {

                                  var tablePage;

                                  try{
                                    // debugger
                                      tablePage = cheerio.load(data);


                                      var tableEdited = false;
                                      // tablePage("col").removeAttr('style');
                                      if ( !tablePage ){
                                            resolve({htmlHeader: "",formattedPage : "", title: "" })
                                            return;
                                      }


                                      // Remove all empty rows from the top.
                                      while ( tablePage('table tr:nth-child(1)').text().trim().length == 0 ) {
                                        tablePage('table tr:nth-child(1)').remove()
                                        tableEdited = true;
                                      }
                                      //
                                      // debugger

                                      // "remove NCT column on the fly"

                                      var firstColContent = tablePage('table tr td:nth-child(1)').text().trim()
                                      if ( firstColContent.indexOf("NCT") == 0 ){
                                          tablePage('table tr td:nth-child(1)').remove()
                                          tablePage('table tr td:nth-child(1)').remove()
                                          tableEdited = true;
                                      }

                                      // debugger

                                      if ( tablePage("strong").length > 0 || tablePage("b").length > 0 || tablePage("i").length > 0){

                                        // fixing strong, b and i tags on the fly. using "bold" and "italic" classes is preferred
                                        tablePage("strong").closest("td").addClass("bold")
                                        tablePage("strong").map( (i,el) => { var content = cheerio(el).html(); var parent = cheerio(el).parent(); cheerio(el).remove(); parent.append( content ) } )

                                        tablePage("b").closest("td").addClass("bold")
                                        tablePage("b").map( (i,el) => { var content = cheerio(el).html(); var parent = cheerio(el).parent(); cheerio(el).remove(); parent.append( content ) } )

                                        tablePage("i").closest("td").addClass("italic")
                                        tablePage("i").map( (i,el) => { var content = cheerio(el).html(); var parent = cheerio(el).parent(); cheerio(el).remove(); parent.append( content ) } )

                                        // debugger

                                        tableEdited = true
                                        // fs.writeFile(htmlFolder+htmlFile,  tablePage.html(), function (err) {
                                        //   if (err) throw err;
                                        //   console.log('Substituted strong tags by "bold" class for: '+htmlFolder+htmlFile);
                                        // });

                                      }

                                      if ( tableEdited ){
                                        console.log('Table corrected on the fly: '+path.join(htmlFolder,htmlFile));
                                        fs.writeFile(path.join(htmlFolder,htmlFile),  tablePage.html(), function (err) {
                                          if (err) throw err;
                                          console.log('Table corrected on the fly: '+path.join(htmlFolder,htmlFile));
                                        });
                                      }

                                      // debugger



                                  } catch (e){
                                    // console.log(JSON.stringify(e)+" -- " + JSON.stringify(data))
                                    resolve({htmlHeader: "",formattedPage : "", title: "" })
                                    return;
                                  }

                                  var spaceRow = -1;
                                  var htmlHeader = ""

                                  var findHeader = (tablePage, tag) => {
                                    var totalTextChars = 0

                                    var headerNodes = [cheerio(tablePage(tag)[0]).remove()]
                                    var htmlHeader = ""
                                    for ( var h in headerNodes){
                                        // cheerio(headerNodes[h]).css("font-size","20px");
                                        var headText = cheerio(headerNodes[h]).text().trim()
                                        var textLimit = 400
                                        var actualText = (headText.length > textLimit ? headText.slice(0,textLimit-1) +" [...] " : headText)
                                            totalTextChars += actualText.length
                                        htmlHeader = htmlHeader + '<tr ><td style="font-size:20px; font-weight:bold; white-space: normal;">' + encodeURI(actualText) + "</td></tr>"
                                    }

                                    return {htmlHeader, totalTextChars}
                                  }

                                  var possible_tags_for_title = [".headers",".caption",".captions",".article-table-caption"]

                                  for (var t in possible_tags_for_title){

                                    htmlHeader = findHeader(tablePage, possible_tags_for_title[t])
                                    if ( htmlHeader.totalTextChars > 0){
                                      break;
                                    }

                                  }

                                  htmlHeader = "<table>"+htmlHeader.htmlHeader+"</table>"

                                  var htmlHeaderText = cheerio(htmlHeader).find("td").text()

                                  var actual_table = tablePage("table").parent().html();
                                      actual_table = cheerio.load(actual_table);


                                  // The following lines remove, line numbers present in some tables, as well as positions in headings derived from the excel sheets  if present.
                                  var colum_with_numbers = actual_table("tr > td:nth-child(1), tr > td:nth-child(2), tr > th:nth-child(1), tr > th:nth-child(2)")

                                  if ( colum_with_numbers.text().replace( /[0-9]/gi, "").replace(/\s+/g,"").toLowerCase() === "row/col" ){
                                    colum_with_numbers.remove()
                                  }

                                  if ( actual_table("thead").text().trim().indexOf("1(A)") > -1 ){
                                      actual_table("thead").remove();
                                  }
                                  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

                                  // Correction here for bold

                                  actual_table = actual_table.html();

                                  // var ss = "<style>"+data_ss+" td {width: auto;} tr:hover {background: aliceblue} td:hover {background: #82c1f8} col{width:100pt} </style>"
                                  var styles = actual_table.indexOf('<style type="text/css">.indent0') > -1 ? "" : "<style>"+data_ss+"</style>"

                                  var formattedPage = actual_table.indexOf("tr:hover" < 0) ? "<div>"+styles+actual_table+"</div>" : actual_table

                                  var predictions = await attempt_predictions(actual_table)

                                  var terms_matrix = predictions.map(
                                    e => e.terms.map(
                                      term => term
                                    )
                                  )

                                  var preds_matrix = predictions.map(
                                    e => e.terms.map(
                                      term => e.pred_class[term]
                                    )
                                  )

                                  var format_matrix = predictions.map( e => e.cellClasses.map( cellClass => cellClass ))

                                  var feature_matrix = predictions.map(
                                    e => e.terms_features.map(
                                      term => term
                                    )
                                  )

                                  // values in this matrix represent the cell contents, and can be: "text", "numeric" or ""
                                  var content_type_matrix = predictions.map(
                                    e => e.terms.map(
                                      term => {
                                        var term = term.replace(/\$nmbr\$/g, 0)
                                        var numberless_size = term.replace(/([^A-z0-9 ])/g, "").replace(/[0-9]+/g, '').replace(/ +/g," ").trim().length
                                        var spaceless_size = term.replace(/([^A-z0-9 ])/g, "").replace(/ +/g," ").trim().length
                                        // debugger
                                        return spaceless_size == 0 ? "" : (numberless_size >= spaceless_size/2 ? "text" : "numeric")

                                      }
                                    )
                                  )


                                  var cleanModifier = (modifier) => {
                                    modifier = modifier ? modifier : ""; //prevent blow up
                                    return modifier.replace("firstCol","empty_row").replace("firstLastCol","empty_row_with_p_value")
                                                   .replace("indent0","indent").replace("indent1","indent")
                                                   .replace("indent2","indent").replace("indent3","indent")
                                                   .replace("indent4","indent").trim()
                                  }

                                  var isTermNumber = (term) => {

                                    term = term ? term : "" ; // Just in case term is undefined

                                    var statsRelated = ["nmbr", "mean", "median", "percent", "mode", "std","nan","na","nr"]
                                    var stats = term.toLowerCase().replace(/[^A-z0-9 ]/gi, " ")
                                                .replace(/ +/gi," ").trim().split(" ").filter( el => el.length > 1)
                                                .reduce( (acc, term) => {
                                                  if (statsRelated.indexOf(term) > -1){ acc.numbers++ };
                                                    acc.total++;
                                                  return acc }, {numbers: 0, total: 0} )
                                    return stats.numbers > stats.total/2
                                  }

                                  var getColumnAsArray = (matrix , c) => {
                                    return matrix.map( (row,r) => row[c] )
                                  }

                                  var getFreqs = (elements) => {
                                      return elements.reduce( (countMap, word) => {
                                              countMap.freqs[word] = ++countMap.freqs[word] || 1
                                              var max = (countMap["max"] || 0)
                                              countMap["max"] = max < countMap.freqs[word] ? countMap.freqs[word] : max
                                              countMap["total"] = ++countMap["total"] || 1
                                              return countMap
                                          },{total:0,freqs:{}})
                                  }

                                  var getMatchingIndices = (elements, items) => {
                                     return elements.reduce( (indices, el, i ) => { if ( items.indexOf(el) > -1 ){ indices.push(i) } return indices   },[] )
                                  }

                                  var getElementsByIndices = (elements, indices) =>{
                                    return elements.reduce( (res, el, i ) => { if ( indices.indexOf(i) > -1 ){ res.push(elements[i]) } return res },[] )
                                  }

                                  var getTopDescriptors = (freqs, rowFirstCellEmpty = false) => {

                                    if ( rowFirstCellEmpty ){
                                      delete freqs[""]
                                    }

                                    var sum = Object.values(freqs).reduce ( (total, i) => total+i, 0 )
                                    var avg = (sum / Object.values(freqs).length) * 0.85 // just a bit under the average

                                    return Object.keys(freqs).reduce( (acc, k, i) => {
                                      var exclude = ["undefined", undefined, ""]
                                      if ( freqs[k] >= avg && exclude.indexOf(k) < 0){
                                          acc.push(k)
                                      }
                                      return acc
                                    }, [])

                                  }
                                  /*
                                    Used to check if more than half elements in the column/row are just numbers.
                                    This is useful as they can be detected as characteristic_level by the classifier.
                                    We use this function to not accept predictions if most elements are just numbers, I.e very likely a results column/row
                                  */
                                  var isMostlyNumbers = (all_terms, equals=false) => {
                                      var numberTerms_number = all_terms.map( (term) => isTermNumber(term)).reduce( (sum,isNumber) => isNumber ? sum+1 : sum , 0 )
                                      return equals ? numberTerms_number >= all_terms.length/2 : numberTerms_number > all_terms.length/2
                                  }


                                  var max_col = preds_matrix.reduce( (acc,n) => n.length > acc ? n.length : acc, 0);
                                  var max_row = preds_matrix.length

                                  //Estimate column predictions.
                                  var col_top_descriptors = []
                                  var row_top_descriptors = []

                                  var format_units = Array.from(new Set(format_matrix.flat()))


                                  for ( var f in format_units){
                                    var format_key = format_units[f]

                                    var format_unit = {}

                                    for ( var col = 0 ; col < max_col; col++ ){

                                      var col_array = getColumnAsArray(format_matrix,col)

                                      var indices_w_format = getMatchingIndices( col_array, [format_key])
                                      // debugger
                                      // If the cells with this formatting are rare. then ignore.
                                      if ( format_key.indexOf("empty_row") < 0 && indices_w_format.length <= 2){ // Emptyrows are rare so, they are exempt
                                        continue
                                      }

                                      if ( isMostlyNumbers(getColumnAsArray(terms_matrix, col)) ){
                                        continue
                                      }

                                      var pred_array = getColumnAsArray(preds_matrix,col)
                                      var predictions_w_format = getElementsByIndices( pred_array, indices_w_format)

                                          predictions_w_format = predictions_w_format.join(";").split(";")

                                      var content_array = getColumnAsArray(content_type_matrix, col)


                                      // debugger
                                      if (getFreqs(content_array).freqs["text"] < (content_array.length/2) ){
                                        continue;
                                      }

                                      var descriptors = getTopDescriptors(getFreqs(predictions_w_format).freqs)

                                      if ( descriptors.length > 0 ){
                                        col_top_descriptors[col_top_descriptors.length] = {descriptors, c : col , unique_modifier: format_key.split(" ").join(";")}
                                      }
                                    }
                                  }



                                  // Rows are run once, and not dependant on format, unlike cols.
                                  for ( var row = 0 ; row < max_row; row++ ){


                                    if ( isMostlyNumbers(terms_matrix[row]) ){ // if the row contains mostly numbers, there is no reason to check it.
                                      continue;
                                    }


                                    var row_predictions = preds_matrix[row]
                                        row_predictions = row_predictions.join(";").split(";")

                                    var content_array = content_type_matrix[row]

                                    content_array = content_array.reduce( (acc,it) => { if (it.length > 0){ acc.push(it) }; return acc}, []);

                                    if (getFreqs(content_array).freqs["text"] < (content_array.length/2) ){
                                      continue;
                                    }


                                    var rowFirstCellEmpty = terms_matrix[row][0].trim() == "" // very likely to be a heading row, since the first empty cell indicates a indentation.


                                    var descriptors = getTopDescriptors(getFreqs(row_predictions).freqs, rowFirstCellEmpty )

                                    var is_empty_or_P = format_matrix[row][0].indexOf("empty_row") > -1

                                    if ( is_empty_or_P ){
                                      continue
                                    }

                                    if ( descriptors.length > 0 ){
                                        // debugger
                                      row_top_descriptors[row_top_descriptors.length] = {descriptors, c : row , unique_modifier: ""}
                                    }
                                  }


                                  // Estimate row predictions

                                  // NEed some sanitation here.

                                  // If many rows, or many columns, chose only top one.

                                  // col_top_descriptors[col_top_descriptors.length] = {descriptors, c , unique_modifier}
                                  // row_top_descriptors[row_top_descriptors.length] = {descriptors, c : r , unique_modifier:""}
                                  //debugger
                                  // Eliminates rows/cols given a descriptor set that exceeds the amount allowed by the threshold w.r.t. the total.
                                  var sanitiseItemRepetition = (top_descriptors, total, threshold = 0.40) => {
                                    var similarRowCounts = top_descriptors.reduce( (acc, row_item, r) => {
                                          var thekey = row_item.descriptors.join(";")
                                          var storedRow = acc[thekey]
                                          if ( storedRow ){
                                            storedRow.push(row_item.c)
                                          } else {
                                            storedRow = [row_item.c]
                                          }
                                          acc[thekey] = storedRow
                                          return acc
                                    }  , {})


                                    var clean_top_descriptors = []

                                    for ( var d in top_descriptors ){
                                        var thekey = top_descriptors[d].descriptors.join(";")

                                        for ( var r in similarRowCounts ){
                                            if (similarRowCounts[thekey].length < total * threshold){
                                              clean_top_descriptors.push(top_descriptors[d])
                                              break;
                                            }
                                        }
                                    }

                                    return clean_top_descriptors
                                  }


                                  row_top_descriptors = sanitiseItemRepetition( row_top_descriptors, max_row )

                                  var reduceFormatRedundancy = ( descriptors ) => {
                                    var references = {}

                                    var finalDescriptors = []

                                    for ( var c in descriptors){
                                      if ( descriptors[c].unique_modifier == "" ){
                                        references[descriptors[c].c] = descriptors[c].descriptors.join(";")
                                        finalDescriptors.push(descriptors[c])
                                      }
                                    }

                                    for ( var c in descriptors){
                                      if ( descriptors[c].descriptors.join(";") != references[descriptors[c].c] ){
                                        finalDescriptors.push(descriptors[c])
                                      }
                                    }

                                    return finalDescriptors
                                  }

                                  col_top_descriptors = reduceFormatRedundancy(col_top_descriptors)


                                  var predicted = {
                                                  cols: col_top_descriptors,
                                                  rows: row_top_descriptors,
                                                  predictions : predictions
                                                }

                                  resolve({status: "good", htmlHeader,formattedPage, title:  "", predicted })
                              });

                });
        } catch ( e ){
          console.log(e)
           debugger
            reject({status:"bad"})
        }
      });
      // buffer_tables = {}
      // buffer_tables[docid] = result
      return result
    } catch (e){
      console.log(e)
      debugger
      return {status:"bad"}
    }
}

var prepareAvailableDocuments = async (collection_id) => {

        var ftop = []
        var ftyp = []
        var fgroup = []
        var flgroup = []

        var hua = false

        var type_lookup = {
               "Baseline Characteristics" : "baseline_table",
               "Results with subgroups" : "result_table_subgroup",
               "Results without subgroups" : "result_table_without_subgroup",
               "Other" : "other_table",
               "Unassigned" : "NA"
             }

        for ( var i = 0; i < ftyp.length; i++){
            ftyp[i] = type_lookup[ftyp[i]]
        }

        var filtered_docs_ttype = []

        var allAnnotations = await getAnnotationResults()

        var all_annotated_docids = Array.from(new Set(allAnnotations.rows.reduce( (acc,ann) => {
            acc = acc ? acc : []

            acc.push(ann.docid+"_"+ann.page);

            return acc
          }, [] )))


        if( ftop.length+ftyp.length > 0 ){

            filtered_docs_ttype = allAnnotations.rows.reduce( (acc,ann) => {
          			acc = acc ? acc : []

          			if ( ann.tableType != "" && ftyp.indexOf(ann.tableType) > -1 ){
                  	acc.push(ann.docid+"_"+ann.page);
                }

          			return acc
          		}, [] )

              filtered_docs_ttype = Array.from(new Set(filtered_docs_ttype));
        }

        var ordered_Splits = []
        var ordered_docs_to_label = []


        var allLabelled = []
        allLabelled = allLabelled.map( d => d+".html")

        var selected_group_docs = []

        if (fgroup == "all" || (fgroup.indexOf("all") > -1)){
          selected_group_docs = ordered_Splits.flat()
        } else {
          for ( i in fgroup ) {
            var group_index = parseInt(fgroup[i])-1;
            selected_group_docs = [...selected_group_docs, ...ordered_Splits[group_index]]
          }
        }


        var selected_label_docs = []

        if (flgroup == "all" || (flgroup.indexOf("all") > -1)){
          selected_label_docs = ordered_docs_to_label.flat()
        } else {
          for ( i in flgroup ) {
            var label_index = parseInt(flgroup[i])-1;
            selected_label_docs = [...selected_label_docs, ...ordered_docs_to_label[label_index]]
          }
        }

        selected_group_docs = selected_group_docs.flat();

        var results = new Promise(function(resolve, reject) {

                var available_documents = {}
                var abs_index = []
                var DOCS = []

                var fixVersionOrder = (a) => {
                	var i = a.indexOf("v");
                	if ( i > -1 ){
                		return a.slice(0,i)+a.slice(i+2,a.length)+a.slice(i,i+2)
                    } else {
                		return a;
                    }

                }

                fs.readdir( path.join(tables_folder,collection_id) , function(err, items) {

                    var label_filters = flgroup;

                    var unannotated = ordered_Splits;

                    if ( selected_group_docs.length > 0 ){
                      DOCS = selected_group_docs
                    }

                    if ( selected_label_docs.length > 0 ){
                      DOCS = selected_label_docs
                    }


                    if ( DOCS.length < 1) {
                      if ( !items ){
                        items = []
                      }
                      items = items.reduce ( (acc,filename) => {
                              var doc_path = path.join(tables_folder,collection_id,filename)
                              if ( fs.existsSync(doc_path) && (!fs.lstatSync(doc_path).isDirectory()) ) {
                                acc.push(filename)
                              }
                              return acc
                              },[])

                      DOCS = items.sort(  (a,b) => {return fixVersionOrder(a).localeCompare(fixVersionOrder(b))} );
                    }


                    DOCS = DOCS.sort(  (a,b) => {

                        a = a.match(/([\w\W]*)_([0-9]*).html/)
                        b = b.match(/([\w\W]*)_([0-9]*).html/)
                        var st_a = {docid: a[1], page:a[2]}
                        var st_b = {docid: b[1], page:b[2]}
                        // debugger
                        var dd = st_a.docid.localeCompare(st_b.docid);
                        return dd == 0 ? parseInt(st_a.page) - parseInt(st_b.page) : dd

                    });

                    DOCS = DOCS.reduce( (acc,docfile) => {

                        var file_parts = docfile.match(/([\w\W]*)_([0-9]*).html/)

                        var docid = file_parts[1]
                        var docid_V = file_parts[1]
                        var page = file_parts[2]

                        if( (ftop.length+ftyp.length > 0) && msh_categories && msh_categories.catIndex ){

                          var topic_enabled = ftop.length > 0

                          var topic_intersection = ftop.reduce( (acc, cat) => { return acc || (msh_categories.catIndex[cat].indexOf(docid) > -1) }, false );

                          if ( ftop.indexOf("NA") > -1 ){
                            if ( msh_categories.pmids_w_cat.indexOf(docid) < 0 ){
                                topic_intersection = true
                            }
                          }

                          var type_enabled = ftyp.length > 0
                          var type_intersection = (type_enabled && (filtered_docs_ttype.length > 0) && (filtered_docs_ttype.indexOf(docid_V+"_"+page) > -1))

                          var isAnnotated = all_annotated_docids.indexOf(docid_V+"_"+page) > -1

                          var show_not_annotated = !hua

                          var accept_docid = false

                          // Logic to control the filter. It depends in many variables with many controlled outcomes, so it looks a bit complicated
                          if ( topic_enabled && type_enabled ){

                            accept_docid = topic_intersection ? true : accept_docid
                            accept_docid = type_intersection || (show_not_annotated && !isAnnotated) ? accept_docid : false

                          } else if (topic_enabled && !type_enabled){

                            accept_docid = topic_intersection ? true : accept_docid
                            accept_docid = !show_not_annotated ? ( isAnnotated && topic_intersection ) : accept_docid

                          } else if (!topic_enabled && type_enabled){

                            accept_docid = type_intersection || (show_not_annotated && !isAnnotated) ? true : false

                          } else if ( (!topic_enabled) && (!type_enabled) ){
                            accept_docid = !show_not_annotated ? ( isAnnotated ) : true
                          }
                          // End of filter logic.

                          if ( accept_docid ) {
                            acc.push(docfile)
                          }

                        } else { // Default path when no filters are enabled

                          if ( !hua ){ // The document is not annotated, so always add.
                            acc.push(docfile)
                          } else {
                            if ( all_annotated_docids.indexOf(docid_V+"_"+page) > -1 ){
                              acc.push(docfile)
                            }
                          }
                        }

                        return acc
                    },[])

                    DOCS = Array.from(new Set(DOCS))

                    try{
                      for ( var d in DOCS ){

                        var docfile = DOCS[d]

                        var fileElements = docfile.match(/([\w\W]*)_([0-9]*).html/);
                        var docid = fileElements[1]
                        var page = fileElements[2] //.split(".")[0]
                        var extension = ".html" //fileElements[1].split(".")[1]

                        if ( available_documents[docid] ){
                          var prev_data = available_documents[docid]
                              prev_data.pages[prev_data.pages.length] = page
                              prev_data.abs_pos[prev_data.abs_pos.length] = abs_index.length
                              prev_data.maxPage = page > prev_data.maxPage ? page : prev_data.maxPage
                              available_documents[docid] = prev_data
                        } else {
                              available_documents[docid] = {abs_pos: [ abs_index.length ], pages : [ page ] , extension, maxPage : page}
                        }

                        abs_index[abs_index.length] = {docid, page, extension, docfile}

                      }

                      // console.log("YAY")
                      resolve({available_documents, abs_index, DOCS})
                    } catch (e){

                      console.log("FAILED: "+JSON.stringify(e))

                      reject(e)
                    }
                });

          });



          return await results
}

module.exports = {
  readyTableData,
  prepareAvailableDocuments,
}
