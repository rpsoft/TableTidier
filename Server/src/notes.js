//
// // Produces the data required to teach classifiers. Traverses all existing tables, extracting cell values and associating it with the human annotations.
// async function trainingData(){
//
//   var cui_data =  await CUIData ()
//
//   var header = [
//       {id: 'docid', title: 'docid'},
//       {id: 'page', title: 'page'},
//       {id: 'clean_concept', title: 'clean_concept'},
//       {id: 'is_bold', title: 'is_bold'},
//       {id: 'is_italic', title: 'is_italic'},
//       {id: 'is_indent', title: 'is_indent'},
//       {id: 'is_empty_row', title: 'is_empty_row'},
//       {id: 'is_empty_row_p', title: 'is_empty_row_p'},
//       {id: 'cuis', title: 'cuis'},
//       {id: 'semanticTypes', title: 'semanticTypes'},
//       {id: 'label', title: 'label'}
//   ]
//
//   // Object.keys(cui_data.cui_def).map( c => {header.push({id: c, title: c})})
//   // Object.keys(cui_data.semtypes).map( s => {header.push({id: s, title: s})})
//
//   const createCsvWriter = require('csv-writer').createObjectCsvWriter;
//
//   const csvWriter = createCsvWriter({
//       path: 'training_data.csv',
//       header: header
//   });
//
//   const csvWriter_unique = createCsvWriter({
//       path: 'training_data_unique.csv',
//       header: header
//   });
//
//
//   var count = 1;
//
//   var cuirec = await getRecommendedCUIS()
//
//   for ( var docid in available_documents){
//     for ( var page in available_documents[docid].pages ) {
//       console.log(docid+"  --  "+page+"  --  "+count+" / "+DOCS.length)
//
//       //
//       // count = count + 1;
//       //
//       // if ( count < 1800 ){
//       //   continue
//       // }
//
//
//       var page = available_documents[docid].pages[page]
//       var data = await readyTableData(docid,page)
//
//       var ac_res = cui_data.actual_results
//
//       if ( !ac_res[docid+"_"+page] ) { // table could not be annotated yet, so we skip it.
//         continue
//       }
//
//       // The manual annotations for each col/row
//       var cols; //= data.predicted.cols.reduce( (acc,e) => {acc[e.c] = {descriptors : e.descriptors.join(";"), modifier: e.unique_modifier}; return acc},{} )
//       var rows; //= data.predicted.rows.reduce( (acc,e) => {acc[e.c] = {descriptors : e.descriptors.join(";"), modifier: e.unique_modifier}; return acc},{} )
//
//       try{
//       // These are manually annotated
//         cols = Object.keys(ac_res[docid+"_"+page].Col).reduce( (acc,e) => {  acc[e-1] = ac_res[docid+"_"+page].Col[e]; return acc }, {} )
//         rows = Object.keys(ac_res[docid+"_"+page].Row).reduce( (acc,e) => {  acc[e-1] = ac_res[docid+"_"+page].Row[e]; return acc }, {} )
//       } catch (e) {
//         console.log( "skipping: "+ docid+"_"+page)
//         continue
//       }
//
//
//       var getSemanticTypes = (cuis, cui_data) => {
//
//         if ( ! cuis ){
//           return []
//         }
//
//         var semType = []
//
//         cuis.split(";").map( (cui) => {
//
//             semType.push(cui_data.cui_def[cui].semTypes.split(";"))
//
//         });
//
//         return semType.flat()
//       }
//
//       count = count + 1;
//
//       var csvData = data.predicted.predictions.map(
//         (row_el,row) => {
//           return row_el.terms.map( ( term, col ) => {
//
//               var row_terms = data.predicted.predictions[row].terms
//
//               var term_features = data.predicted.predictions[row].terms_features[col]
//
//               var toReturn = {
//                 docid: docid,
//                 page: page,
//                 clean_concept : term_features[0],
//                 is_bold : term_features[1],
//                 is_italic : term_features[2],
//                 is_indent : term_features[3],
//                 is_empty_row : term_features[4],
//                 is_empty_row_p : term_features[5],  // this one is a crude estimation of P values structure. Assume the row has P value if multiple columns are detected but only first and last are populated.
//                 cuis: term_features[6],
//                 semanticTypes: term_features[7],
//                 label : cols[col] ? cols[col].descriptors : (rows[row] ? rows[row].descriptors : ""), // This is the label selected by the annotating person : "subgroup_name; level etc. "
//               }
//
//               return toReturn
//             })
//           }
//         )
//
//          csvData = csvData.flat();
//
//
//          var csvDataUnique = []
//
//          var allkeys = {}
//
//          for ( var i = 0; i < csvData.length; i++ ) {
//            var key = Object.values(csvData[i]).join("")
//
//            if ( !allkeys[key] ){
//              allkeys[key] = true;
//              csvDataUnique.push(csvData[i]);
//            }
//
//          }
//
//       await csvWriter.writeRecords(csvData)
//           .then(() => {
//               console.log('...Done');
//           });
//       await csvWriter_unique.writeRecords(csvDataUnique)
//           .then(() => {
//               console.log('...Done');
//           });
//     }
//   }
//
//   return {}
// }
//
// app.get('/api/trainingData', async function(req,res){
//   console.log("getting all training data")
//
//   var allP = await trainingData()
//
//   res.send(allP)
// });

// 
// app.get('/api/modelEval', async (req,res) => {
//
//   var testingDocs = new Promise( (resolve,reject) =>{
//       let inputStream = fs.createReadStream(CONFIG.system_path+ "testing_tables_list.csv", 'utf8');
//
//         var testingDocs = [];
//
//         inputStream.pipe(new CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true, skipHeader: true }))
//           .on('data', function (row) {
//
//               testingDocs.push(row[0]+"_"+row[1])
//
//           })
//           .on('end', function (data) {
//               console.log("read testing docs list")
//               resolve(testingDocs)
//           });
//
//     });
//
//     testingDocs = await testingDocs;
//     // debugger
//
//     var createCsvWriter = require('csv-writer').createObjectCsvWriter;
//       var csvWriter = createCsvWriter({
//         path: CONFIG.system_path+'predictor_results.csv',
//         header: [
//             {id: 'user', title: 'user'},
//             {id: 'docid', title: 'docid'},
//             {id: 'page', title: 'page'},
//             {id: 'corrupted', title: 'corrupted'},
//             {id: 'tableType', title: 'tableType'},
//             {id: 'location', title: 'location'},
//             {id: 'number', title: 'number'},
//             {id: 'content', title: 'content'},
//             {id: 'qualifiers', title: 'qualifiers'}
//         ]
//       });
//
//       var records = [
//       ];
//
//       var transferAnnotations = (records, items, type ) => {
//
//           items.map( (p,i) =>
//             records.push( {
//               user : "auto",
//               docid : docid,
//               page : page,
//               corrupted : "false",
//               tableType : "na",
//               location : type == "Col" ? "Col" : "Row",
//               number : parseInt(p.c)+1,
//               content : p.descriptors.join(";"),
//               qualifiers : p.unique_modifier.split(" ").join(";")
//             })
//            );
//
//            return records
//       }
//
//
//
//
//       var counter = 0;
//       for (var doc in available_documents) {
//
//           // if ( counter > 10 ){
//           //   break;
//           // }
//
//           for (var p in available_documents[doc].pages ){
//             var page = available_documents[doc].pages[p]
//             var docid = doc
//
//             console.log( (counter) + " / " + (testingDocs.length > 0 ? testingDocs.length : Object.keys(available_documents).length) )
//
//             if ( testingDocs.indexOf(docid+"_"+page) < 0 ) {
//               continue
//             } else {
//               counter++
//             }
//
//
//             var tableData
//             try{
//               tableData = await readyTableData(docid,page)
//             } catch (e){
//               console.log(docid+"_"+page+ " :: Failed");
//               continue;
//             }
//
//             if ( tableData.predicted ){
//               records = transferAnnotations( records, tableData.predicted.cols, "Col")
//               records = transferAnnotations( records, tableData.predicted.rows, "Row")
//             } else {
//               console.log("no predicted data found")
//               // debugger
//             }
//           }
//
//       }
//
//       // debugger
//
//       csvWriter.writeRecords(records)       // returns a promise
//           .then(() => {
//               res.send("Done experiments")
//           });
//
//
//
// });
