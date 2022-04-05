// Load config
const GENERAL_CONFIG = require('./config.json')

const express = require('express');

const bodyParser = require('body-parser');
const html = require("html");

const axios = require('axios');

const multer = require('multer');

const fs = require('fs/promises');
const path = require('path');

const { Pool, Client, Query } = require('pg')
// DB driver
const dbDriver = require('./db/postgres-driver')({...GENERAL_CONFIG.db})


const csv = require('csv-parser');
const CsvReadableStream = require('csv-reader');

const cors = require('cors');

// Import routes
import usersRoutes from './routes/users'

// I want to access cheerio from everywhere.
global.cheerio = require('cheerio');

global.CONFIG = GENERAL_CONFIG
global.available_documents = {}
global.abs_index = []
// Moved to config.json file
// global.tables_folder = "HTML_TABLES"
// global.tables_folder_override = "HTML_TABLES_OVERRIDE"
// global.tables_folder_deleted = "HTML_TABLES_DELETED"
global.cssFolder = "HTML_STYLES"
global.DOCS = [];
global.msh_categories = {catIndex: {}, allcats: [], pmids_w_cat: []}
global.PRED_METHOD = "grouped_predictor"

global.umls_data_buffer = {};

// TTidier subsystems load.
console.log("Loading Files Management")

console.log("Loading Security")
import passport, {initialiseUsers, createUser, getUserHash}  from "./security.js"

console.log("Loading Table Libs")
import {
  tableDBDriverSet,
  readyTable,
  prepareAvailableDocuments,
  refreshDocuments,
} from "./table.js"
// configure table with dbDriver
tableDBDriverSet(dbDriver)

console.log("Loading MetaMap Docker Comms Module")
import { metamap } from "./metamap.js"

console.log("Loading Tabuliser Module")
import { getFileResults } from "./tabuliser.js"

console.log("Loading Extra Functions")
import ef from "./extra_functions.js"

console.log("Loading Search Module")
var easysearch = require('@sephir/easy-search')

console.log("Configuring DB client: Postgres")
// Postgres configuration.
global.pool = new Pool({
    user: CONFIG.db.user,
    password: CONFIG.db.password,
    host: CONFIG.db.host,
    port: CONFIG.db.port,
    database: CONFIG.db.database,
})

//Network functions
import { getAnnotationResults } from "./network_functions.js"


console.log("Configuring Server")
var app = express();

app.use(cors("*"));
app.options('*', cors())

app.use(bodyParser.json({
  limit: '50mb'
}));

app.use(bodyParser.urlencoded({
  limit: '50mb',
  parameterLimit: 100000,
  extended: true
}));

app.use(passport.initialize());

// Add routes:
//  /login
//  /createUser
app.use(usersRoutes);


// const storage = multer.memoryStorage();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname )
  }
})

app.get(CONFIG.api_base_url+'/',function(req,res){
  res.send("TTidier Server running.")
});

app.get("/api/test", function(req,res){
  res.send("here we are")
})

var tableSplitter = async ( tablePath ) => {
  try {
    const data = await fs.readFile(tablePath, {encoding: "utf8"})
    const tablePage = cheerio.load(data);
    const tables  = tablePage("table")

    const tablesHTML = []

    // If only one table in the file, just return the whole file. Let the user clean up
    if ( tables.length <= 1 ){
      tablesHTML.push(data)
    } else {
      // we attempt automatic splitting here.
      for ( var t = 0; t < tables.length; t++){
        tablesHTML.push("<table>"+tablePage(tables[t]).html()+"</table>")
      }
    }
    return tablesHTML
  } catch (err) {
    console.log(err)
  }
}

app.post(CONFIG.api_base_url+'/tableUploader', async function(req, res) {

  let upload = multer({ storage: storage }).array('fileNames');

  upload(req, res, async function(err) {
    // Path to tables
    const {
      tables_folder,
    } = global.CONFIG

    const files = req.files;
    let index, len;

    var results = []

    // Loop through all the uploaded files and return names to frontend
    for (index = 0, len = files.length; index < len; ++index) {
      try {
        var tables_html = await tableSplitter(files[index].path)
        var cleanFilename = files[index].originalname.replaceAll("_", "-")
        var file_elements = cleanFilename.split(".")
        var extension = file_elements.pop()
        var baseFilename = file_elements.join(".")

        await fs.mkdir(path.join(tables_folder, req.body.collection_id), { recursive: true })

        tables_html.map( async (table,t) => {

          var page = t+1
          var docid = baseFilename

          var newTableFilename = docid+"_"+page+"."+extension

          await fs.writeFile(path.join(tables_folder, req.body.collection_id, newTableFilename), table)

          await tableCreate(docid, page, req.body.username_uploader, req.body.collection_id, newTableFilename)
          results.push({filename: newTableFilename, status:"success"})
        })
      } catch(err) {
        console.log(err)
        console.log("file: " + files[index].originalname + " failed to process")
        results.push({filename: files[index].originalname, status:"failed"})
      }
    }

    res.send(results);
  });
});

async function UMLSData() {

    let semtypes = new Promise( async (resolve,reject) => {
        const fd = await fs.open(CONFIG.system_path+ "Tools/metamap_api/"+'cui_def.csv', 'r');
        let inputStream = fd.createReadStream({encoding: 'utf8'});

        var result = {};

        inputStream
            .pipe(new CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true, skipHeader: true }))
            .on('data', function (row) {
                //console.log('A row arrived: ', row);
                row[4].split(";").map( st => {
                    result[st] = result[st] ? result[st]+1 : 1
                })

            })
            .on('end', function (data) {
                resolve(result);
            });
    })

    let cui_def = new Promise( async (resolve,reject) => {

      const fd = await fs.open(CONFIG.system_path+ "Tools/metamap_api/"+'cui_def.csv', 'r');
      let inputStream = fd.createReadStream({encoding: 'utf8'});

      var result = {};

      inputStream
        .pipe(new CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true, skipHeader: true }))
        .on('data', function (row) {
            //console.log('A row arrived: ', row);
            result[row[0]] = {"matchedText": row[1], "preferred": row[2], "hasMSH":row[3], "semTypes":row[4]}
        })
        .on('end', function (data) {
            resolve(result);
        });
    })

    let cui_concept = new Promise( async (resolve,reject) =>{

        const fd = await fs.open(CONFIG.system_path+ "Tools/metamap_api/"+'cui_concept.csv', 'r');
        let inputStream = fd.createReadStream({encoding: 'utf8'});

        var result = {};

        inputStream
            .pipe(new CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true, skipHeader: true }))
            .on('data', function (row) {
                //console.log('A row arrived: ', row);
                result[row[0]] = row[1]
            })
            .on('end', function (data) {
                resolve(result);
            });
    })

    semtypes = await semtypes
    cui_def = await cui_def
    cui_concept = await cui_concept

    return {semtypes, cui_def, cui_concept}
}

async function CUIData () {
    var umlsData = await UMLSData();

    var results = await dbDriver.annotationResultsGet()

    var rres = results.rows.reduce(
            (acc,ann,i) => {

              var annots = ann.annotation.annotations

              annots = annots.reduce ( (acc,ann) => {
                var loc = ann.location;
                var n = ann.number;
                var descriptors = Object.keys(ann.content).join(";");
                var modifier = Object.keys(ann.qualifiers).join(";");
                acc[loc][n] = {descriptors,modifier};
                return acc;

              } ,{ Col:{}, Row:{} } )

              acc[ann.docid+"_"+ann.page] = {
                user: ann.user,
                minPos: 1,
                Col: annots.Col,
                Row : annots.Row
              };
              return acc
            } , {} )

    return { cui_def: umlsData.cui_def, cui_concept: umlsData.cui_concept, actual_results: rres, semtypes: umlsData.semtypes }
}

const rebuildSearchIndex = async () => {
  // Path to tables
  const {
    tables_folder,
    tables_folder_override,
  } = global.CONFIG
  let tablesInFolder = fs.readdir(path.join(tables_folder))
  let tablesInFolderOverride = fs.readdir(path.join(tables_folder_override))
  // Join path
  tablesInFolder = (await tablesInFolder).map( (dir) => path.join(tables_folder, dir))
  tablesInFolderOverride = (await tablesInFolderOverride).map( (dir) => path.join(tables_folder_override, dir))
  global.searchIndex = await easysearch.indexFolder([
    ...tablesInFolder,
    ...tablesInFolderOverride
  ])
}

const tabularFromAnnotation = async ( annotation ) => {
  // Path to tables
  const {
    tables_folder,
    tables_folder_override,
  } = global.CONFIG

  if ( annotation.rows.length < 1 ){ // annotation not there
    return
  }
  annotation = annotation.rows[0]
  const htmlFile = annotation.file_path

  //If an override file exists then use it!. Overrides are those produced by the editor.
  let file_exists = true
  try {
    const fd = await fs.open(path.join(tables_folder_override, annotation.collection_id, htmlFile))
    fd.close()
  } catch (err) {
    file_exists = false
  }

  let htmlFolder = path.join(tables_folder, annotation.collection_id)
  if ( file_exists ) {
    htmlFolder = path.join(tables_folder_override, annotation.collection_id) //"HTML_TABLES_OVERRIDE/"
  }

  try {
    const data = await fs.readFile(path.join(htmlFolder,htmlFile), {encoding: 'utf8'})
    const ann = annotation
    const tablePage = cheerio.load(data);

    const tableData = tablePage("tr").get().map( (row) => {
      const rowValues = cheerio(row).children().get().map(
        (i,e) => ({
          text : cheerio(i).text(),
          isIndent : (cheerio(i).find('.indent1').length +
                      cheerio(i).find('.indent2').length +
                      cheerio(i).find('.indent3').length +
                      cheerio(i).find('.indent').length) > 0,
          isBold : (cheerio(i).find('.bold').length + cheerio(i).find('strong').length) > 0,
          isItalic : (cheerio(i).find('em').length) > 0,
        })
      )
      return rowValues
    });
  } catch (e){
    console.log(e)
  }
}

// preinitialisation of components if needed.
async function main(){

  // search index rebuild/initialisation
  await rebuildSearchIndex()

  // UMLS Data buffer
  umls_data_buffer = await UMLSData();

  // await refreshDocuments()

  await initialiseUsers()

  // var annotation = await dbDriver.annotationByIDGet("11442551", 1, 1);
  // // var tableData = await readyTable("11442551", 1, 1, false)
  // await tabularFromAnnotation(annotation)
}

// app.get(CONFIG.api_base_url+'/deleteTable', async function(req,res){
//
//   if ( req.query && req.query.docid && req.query.page ){
//
//     var filename = req.query.docid+"_"+req.query.page+".html"
//
//     var delprom = new Promise(function(resolve, reject) {
//         fs.rename( tables_folder+'/'+ filename , tables_folder_deleted+'/'+ filename , (err) => {
//           if (err) { reject("failed")} ;
//           console.log('Move complete : '+filename);
//           resolve("done");
//         });
//     });
//
//     await delprom;
//     // await refreshDocuments();
//
//     res.send("table deleted")
//   } else {
//     res.send("table not deleted")
//   }
//
// });
//
// app.get(CONFIG.api_base_url+'/recoverTable', async function(req,res){
//     if ( req.query && req.query.docid && req.query.page ){
//
//       var filename = req.query.docid+"_"+req.query.page+".html"
//
//       fs.rename( tables_folder_deleted+'/'+ filename , tables_folder+'/'+ filename , (err) => {
//         if (err) throw err;
//           console.log('Move complete : '+filename);
//       });
//     }
//
//     res.send("table recovered")
// });

app.get(CONFIG.api_base_url+'/listDeletedTables', async (req,res) => {
  try {
    const items = await fs.readdir( tables_folder_deleted )
    res.send(items)
  } catch (err) {
    res.status(500).send('failed listing deleted tables:' + err)
  }
});

app.get(CONFIG.api_base_url+'/modifyCUIData', async (req, res) => {
  if ( !req.query ) {
    res.status(400).send('UPDATE failed. No query');
  }

  const {
    cui,
    preferred,
    adminApproved,
    prevcui
  } = req.query

  if ( !(cui && preferred && adminApproved && prevcui) ) {
    res.status(400).send('UPDATE failed. Check parameters');
  }

  try {
    const result = await dbDriver.cuiDataModify(
      cui,
      preferred,
      adminApproved,
      prevcui,
    )
    res.send(result)
  } catch (err) {
    res.status(500).send('Failing updating cui data.')
  }
});

// * :-) Use html DELETE verb
app.get(CONFIG.api_base_url+'/cuiDeleteIndex', async (req, res) => {
  if ( !req.query ) {
    res.status(400).send('CUI delete index failed. No query');
  }

  const {
    cui,
  } = req.query

  if ( !cui ) {
    res.status(400).send('CUI delete index failed. Check parameters');
  }

  try {
    await dbDriver.cuiDeleteIndex( cui )
    console.log("deleted: "+ new Date())
    res.send('done')
  } catch (err) {
    res.status(500).send('CUI delete index Failed.')
  }
});

app.get(CONFIG.api_base_url+'/getMetadataForCUI', async function(req,res){
  if ( !req.query ) {
    res.status(400).send('CUI getMetadata failed. No query');
  }

  const {
    cui,
  } = req.query

  if ( !cui ) {
    res.status(400).send('CUI getMetadata failed. Check parameters');
  }

  try {
    const meta = await dbDriver.cuiMetadataGet( cui )
    res.send(meta)
  } catch (err) {
    res.status(500).send('CUI getMetadata Failed.')
  }
});

const setMetadata = async ( metadata ) => {

  if ( Object.keys(metadata).length > 0 ){
      const tidDelete = metadata[Object.keys(metadata)[0]].tid
      console.log("HERE DELETE: "+tidDelete)
      await dbDriver.metadataClear(tidDelete)
      console.log("deleted: "+ new Date())
  }

  const results = []

  for ( let m = 0; m < Object.keys(metadata).length; m++){

    const key = Object.keys(metadata)[m]

    const {
      concept_source,
      concept_root,
      concept,
      cuis,
      cuis_selected,
      qualifiers,
      qualifiers_selected,
      istitle,
      labeller,
      tid,
    } = metadata[key]
    try {
      const done = await dbDriver.metadataSet(
        concept_source,
        concept_root,
        concept,
        cuis.join(";"),
        cuis_selected.join(";"),
        qualifiers.join(";"),
        qualifiers_selected.join(";"),
        istitle,
        labeller,
        tid
      )
      results.push(done);
      console.log("insert: "+key+" -- "+ new Date())
    } catch (err) {
      console.error(concept+" -- "+"insert failed: "+key+" -- " + new Date() + ' ' + err)
    }
  }

  return results
}

app.post(CONFIG.api_base_url+'/metadata', async function(req,res){

  if ( req.body && ( ! req.body.action ) ){
    res.json({status: "undefined", received : req.body})
    return
  }

  const {
    username=undefined,
    hash=undefined,

    action,

    docid,
    page,
    collId,

    payload,
    tids,
  } = req.body

  // * :-) User validation...
  var validate_user = validateUser(username, hash);

  var collectionPermissions = await dbDriver.permissionsResourceGet('collections', validate_user ? username : "")

  if ( collectionPermissions.read.indexOf(collId) <= -1 ) {
    return res.json({status:"unauthorised", payload: null})
  }

  let tid = req.body.tid

  if ( tid == "undefined" ) {
    tid = await dbDriver.tidGet(
      docid,
      page,
      collId,
    )
  }

  let result = {};

  switch (action) {
    case "clear":
      if ( collectionPermissions.write.indexOf(collId) > -1 ){
        result = await dbDriver.metadataClear(tid)
        console.log("deleted: "+ new Date())
      }
      break;
    case "save":
      if ( collectionPermissions.write.indexOf(collId) > -1 ){
        const metadata = JSON.parse(payload).metadata
        result = await setMetadata(metadata)
      }
      break;
    case "get":
      result = (await dbDriver.metadataGet([tid])).rows //req.body.docid, req.body.page, req.body.collId,
      break;
    case "get_multiple":
      result = (await dbDriver.metadataGet(tids)).rows //req.body.docid, req.body.page, req.body.collId,
      break;
    default:
  }
  // Always return the updated collection details
  // result = await dbDriver.collectionGet(req.body.collection_id);
  res.json({status: "success", data: result})
});

app.post(CONFIG.api_base_url+'/cuis', async function(req,res){

  if ( req.body && ( ! req.body.action ) ){
    res.json({status: "undefined", received : req.body})
    return
  }

  var validate_user = true //validateUser(req.body.username, req.body.hash);
  // var collectionPermissions = await dbDriver.permissionsResourceGet('collections', req.body.username)

  if ( validate_user ){

    var result = {};

    switch (req.body.action) {
      case "get":
        result = await dbDriver.cuisIndexGet() //req.body.docid, req.body.page, req.body.collId,
      default:
    }
    res.json({status: "success", data: result})
  } else {
    res.json({status: "unauthorised", payload: null})
  }

});

// :-) move to JWT
// Simple validation
function validateUser (username, hash){
    var validate_user;
    for ( var u in global.records ) {
      if ( global.records[u].username == username ){
         var user = global.records[u]
         var db_hash = getUserHash(user)
         validate_user = hash == db_hash.hash ? user : false
      }
    }
    return validate_user;
}

const getResultsRefreshed = async ( tids ) => {
   // Path to tables
   const {
    tables_folder,
    tables_folder_override,
  } = global.CONFIG
  const annotation_data = await dbDriver.annotationDataGet(tids)
  var table_results = []

  for ( var ann in annotation_data.rows ) {

    console.log(`Preparing Table: ${ann} / ` + annotation_data.rows.length )
    try{
      const entry = annotation_data.rows[ann]

      let override_exists = true
      try {
        const fd = await fs.open(path.join(tables_folder_override, entry.collection_id, entry.file_path))
        fd.close()
      } catch (err) {
        override_exists = false
      }

      var table_res = await getFileResults( entry.annotation,
            path.join(override_exists ? tables_folder_override : tables_folder, entry.collection_id,
            entry.file_path) )

      table_results = [...table_results, table_res]

    } catch( err ){
      console.log( "Failed: "+ path.join(entry.collection_id, entry.file_path) )
      console.log(err)
    }
  }
  return table_results
}

// Collections
app.post(CONFIG.api_base_url+'/collections', async (req, res) => {

  if ( req.body && ( ! req.body.action ) ){
    res.json({status: "undefined", received : req.query})
    return
  }

  const {
    username=undefined,
    hash=undefined,

    action,

    collection_id,
    collectionData,

    tid,
    target,
  } = req.body
  var validate_user = validateUser(
    username,
    hash,
  );

  const collectionPermissions = await dbDriver.permissionsResourceGet('collections', validate_user ? username : '')

  let response = {status: "failed"}

  var result;

  switch (action) {
    case "list":
      result = await dbDriver.collectionsList();
      result = result.filter( (elm) => collectionPermissions.read.includes(elm.collection_id) )
      response = {status: "success", data: result}
      break;

    case "get":
      if ( collectionPermissions.read.includes(collection_id) ){
        result = await dbDriver.collectionGet(collection_id);

        result.permissions = {
          read: collectionPermissions.read.includes(collection_id),
          write: collectionPermissions.write.includes(collection_id)
        }

        response = {status: "success", data: result}
      } else {
        response = {status:"unauthorised operation", payload: req.body}
      }
      break;

    case "delete":
      if ( collectionPermissions.write.includes(collection_id) ){
        await dbDriver.collectionDelete(collection_id);
        response = {status: "success", data: {}}
      } else {
        response = {status:"unauthorised operation", payload: req.body}
      }
      break;

    case "create":
      if ( validate_user ){
        result = await dbDriver.collectionCreate("new collection", '', username);
        response = {status:"success", data: result}
      } else {
        response = {status:"login to create collection", payload: req.body}
      }
      break;

    // Well use edit to create Collection on the fly
    case "edit":
      if ( collectionPermissions.write.indexOf(collection_id) > -1 ){
        var allCollectionData = JSON.parse( collectionData )
        result = await dbDriver.collectionEdit(allCollectionData);
        result = await dbDriver.collectionGet(collection_id);
        response = {status: "success", data: result}
      } else {
        response = {status:"unauthorised operation", payload: req.body}
      }
      break;

    case "download":  //

      var tids = JSON.parse(tid);

      // Download file
      if ( target.includes("results") ){
        // data csv
        result = await dbDriver.resultsDataGet( tids );
      } else if( target.includes("metadata") ) {
        // metadata csv
        result = await dbDriver.metadataGet( tids );
      } else {
        // data & metadata json
        // Default Action.
        var result_res = await getResultsRefreshed( tids )
        var result_met = await dbDriver.metadataGet( tids );
        // var result =

        result = {data: result_res, metadata: result_met?.rows}
      }

      response = {status: "success", data: result}
      break;
  }
  //
  // } else {
  //   response = {status:"unauthorised", payload: null}
  // }

  res.json(response)
});

app.post(CONFIG.api_base_url+'/tables', async (req, res) => {

  if ( req.body && ( ! req.body.action ) ){
    return res.json({status: "undefined", received : req.query})
  }

  const {
    username=undefined,
    hash=undefined,

    action,

    collection_id,
    tablesList,
    targetCollectionID,
  } = req.body

  var validate_user = validateUser(username, hash);
  var collectionPermissions = await dbDriver.permissionsResourceGet('collections', validate_user ? username : "")

  if ( validate_user ) {
    var result = {};

    switch (action) {
      case "remove":
        if ( collectionPermissions.write.includes(collection_id) ) {
          result = await dbDriver.tablesRemove(JSON.parse(tablesList), collection_id);
        }
        break;
      case "move":
        if ( collectionPermissions.write.includes(collection_id) ) {
          result = await dbDriver.tablesMove(JSON.parse(tablesList), collection_id, targetCollectionID);
        }
        break;
      case "list":  // This is the same as not doing anything and returning the collection and its tables.
      default:
    }
    // Always return the updated collection details
    result = await dbDriver.collectionGet(collection_id);
    res.json({status: "success", data: result})
  } else {
    res.json({status:"unauthorised", payload: null})
  }
});

app.post(CONFIG.api_base_url+'/search', async (req,res) => {

  const {
    username=undefined,
    hash=undefined,
    searchContent,
  } = req.body
  var type = JSON.parse(req.body.searchType)

  var validate_user = validateUser(username, hash);
  var collectionPermissions = await dbDriver.permissionsResourceGet('collections', validate_user ? username : '')
  // if ( collectionPermissions.write.indexOf(req.body.collection_id) > -1 ){

  //if ( validate_user ){

  let search_results = easysearch.search( global.searchIndex, searchContent)

  search_results = search_results.filter( (elm) => collectionPermissions.read.includes( elm.doc.split("/")[0] ) )

  console.log(`SEARCH: ${search_results.length} for ${searchContent}`)

  // if ( search_results.length > 100){
  //   search_results = search_results.slice(0,100)
  // }

  res.json(search_results)
  // } else {
  //   res.json([])
  // }
});

app.post(CONFIG.api_base_url+'/getTableContent',async (req,res) => {

  const {
    username=undefined,
    hash=undefined,

    enablePrediction,

    docid,
    page,
    collId,
  } = req.body

  const validate_user = validateUser(username, hash);
  const collectionPermissions = await dbDriver.permissionsResourceGet('collections', validate_user ? username : "")

  if ( collectionPermissions.read.includes(collId) == false ){
    return res.json({status: "unauthorised", body : req.body})
  }

  try {
    if ((docid && page && collId) == false) {
      return res.json({status: "wrong parameters", body : req.body})
    }
    
    const collection_data = await dbDriver.collectionGet(collId)

    const predictionEnabled = JSON.parse(enablePrediction)

    const tableData = await readyTable(
      docid,
      page,
      collId,
      // false, predictions are disabled.
      predictionEnabled
    )

    let annotation = await dbDriver.annotationByIDGet(
      docid,
      page,
      collId,
    )

    tableData.collectionData = collection_data

    tableData.annotationData = annotation && annotation.rows.length > 0 ? annotation.rows[0] : {}

    if ( predictionEnabled ) {
      const rows = tableData.predictedAnnotation.rows.map( ann  => {
        return {
          location: "Row",
          content: ann.descriptors.reduce( (acc,d) => { acc[d] = true; return acc }, {}),
          number: (ann.c+1)+'',
          qualifiers: ann.unique_modifier == "" ?
            {} 
            : ann.unique_modifier.split(";")
              .filter( a => a.length > 1)
              .reduce( (acc,d) => { acc[d] = true; return acc }, {}),
          subannotation: false
        }
      })

      const cols = tableData.predictedAnnotation.cols.map( ann  => {
        return {
          location: "Col",
          content: ann.descriptors.reduce( (acc,d) => { acc[d] = true; return acc }, {}),
          number: (ann.c+1)+'',
          qualifiers: ann.unique_modifier == "" ?
            {}
            : ann.unique_modifier.split(";")
              .filter( a => a.length > 1)
              .reduce( (acc,d) => { acc[d] = true; return acc }, {}),
          subannotation: false 
        }
      })

      const predAnnotationData = (tableData.annotationData && tableData.annotationData.annotation) ? 
        tableData.annotationData
        : {
          annotation: {
            collection_id: collId,
            completion: '',
            docid,
            file_path: `${docid}_${page}.html`,
            notes: '',
            page,
            tableType: '',
            tid: tableData.collectionData.tables.filter( table => table.docid == docid && table.page == page )[0].tid,
            user: username,
          }
        }

      // var tData = tableData.collectionData.tables.filter( ( table ) => { return table.docid == req.body.docid && table.page == req.body.page } )
      predAnnotationData.annotation.annotations = [...rows, ...cols]

      tableData.annotationData = predAnnotationData
    }
    tableData.permissions = {
      read: collectionPermissions.read.includes(collId),
      write: collectionPermissions.write.includes(collId)
    }

    res.json( tableData )
  } catch (err) {
    console.log(err)

    res.json({
      status: "getTableContent: probably page out of bounds, or document does not exist",
      body : req.body
    })
  }
});

// Extracts all recommended CUIs from the DB and formats them as per the "recommend_cuis" variable a the bottom of the function.
 const getRecommendedCUIS = async () => {
  const recommend_cuis = {}

  let rec_cuis = await dbDriver.cuiRecommend()

  const splitConcepts = ( c ) => {
    if ( c == null ) {
      return []
    }
    // remove trailing ;
    var ret = c[0] == ";" ? c.slice(1) : c

    return ret.length > 0 ? ret.split(";") : []
  }

  if (!rec_cuis) {
    return recommend_cuis
  }

  rec_cuis.forEach( item => {
    const cuis = splitConcepts(item.cuis)
    const rep_cuis = splitConcepts(item.rep_cuis)
    const excluded_cuis = splitConcepts(item.excluded_cuis)

    const rec_cuisInner = []

    cuis.forEach((cui) => {
    	if ( excluded_cuis.includes(cui) == false ) {
        if ( rep_cuis.includes(cui) == false ) {
          rec_cuisInner.push(cui)
        }
      }
    });

    recommend_cuis[item.concept] = {
      cuis: rep_cuis.concat(rec_cuisInner),
      cc: item.cc
    }
  })
  return recommend_cuis
}

app.get(CONFIG.api_base_url+'/cuiRecommend', async function(req,res){
  const cuiRecommend = await getRecommendedCUIS()
  res.send( cuiRecommend )
});

const prepareAnnotationPreview = async (docid, page, collId, cachedOnly) => {
   // Path to tables
   const {
    tables_folder,
    tables_folder_override,
  } = global.CONFIG

  const annotations = await dbDriver.annotationByIDGet(docid, page, collId)
  if ( annotations.rows.length <= 0 ) {
    return {"state" : "fail", result : []}
  }
  const entry = annotations.rows[0]

  // Check if file exist
  let override_exists = true
  try {
    const fd = await fs.open(path.join(tables_folder_override, entry.collection_id, entry.file_path))
    fd.close()
  } catch (err) {
    override_exists = false
  }

  const tableResults = await getFileResults(
    entry.annotation,
    path.join(
      override_exists ? tables_folder_override : tables_folder,
      entry.collection_id,
      entry.file_path
    )
  )
  tableResults.forEach( item => { item.docid_page = entry.docid+"_"+entry.page })

  return {"state" : "good", result : tableResults}
}

// Generates the results table live preview, connecting to the R API.
app.post(CONFIG.api_base_url+'/annotationPreview',async function(req,res){

  const {
    username=undefined,
    hash=undefined,

    docid,
    page,
    collId,

    cachedOnly,
  } = req.body

  const validate_user = validateUser(username, hash);
  const collectionPermissions = await dbDriver.permissionsResourceGet('collections', validate_user ? username : '')

  if ( collectionPermissions.read.includes(collId) == false ) {
    return res.json([])
  }

  try{
    if (
      (
        docid &&
        page &&
        collId
      ) == false
    ) {
      return res.json({status: "wrong parameters", body : req.body})
    }

    res.json(await prepareAnnotationPreview(docid , page, collId, cachedOnly))
  } catch (err) {
    console.log(err)
    res.json({status: "annotationPreview : probably page out of bounds, or document does not exist", body : req.body})
  }
  // res.json( {"state" : "reached end", result : []} )
});

// Returns all annotations for all document/tables.
app.get(CONFIG.api_base_url+'/formattedResults', async function (req,res){
  const results = await dbDriver.annotationResultsGet()

  if ( !results || !results.rows ) {
    return res.send('No Rows')
  }
  const finalResults = {}

  /**
  * There are multiple versions of the annotations. 
  * When calling reading the results from the database,
  * here we will return only the latest/ most complete version of the annotation.
  * Independently from the author of it. 
  * Completeness here measured as the result with 
  * the highest number of annotations and the highest index number
  * (I.e. Newest, but only if it has more information/annotations).
  * May not be the best in some cases.
  */

  for ( const r in results.rows){
    const ann = results.rows[r]
    const existing = finalResults[ann.docid+"_"+ann.page]
    if ( existing ){
      if ( ann.N > existing.N && ann.annotation.annotations.length >= existing.annotation.annotations.length ) {
        finalResults[ann.docid+"_"+ann.page] = ann
      }
    } else { // Didn't exist so add it.
      finalResults[ann.docid+"_"+ann.page] = ann
    }
  }

  let finalResults_array = []
  for (  const r in finalResults ){
    const ann = finalResults[r]
    finalResults_array[finalResults_array.length] = ann
  }

  let formattedRes = '"user","docid","page","corrupted_text","tableType","location","number","content","qualifiers"\n';

  finalResults_array.forEach( (value, i) => {
    value.annotation.annotations.forEach( (ann , j ) => {
      try {
        formattedRes = formattedRes+ '"'+value.user
                                  +'","'+value.docid
                                  +'","'+value.page
                                  // +'","'+value.corrupted
                                  +'","'+ (value.corrupted_text == "undefined" ? "" : value.corrupted_text  ).replace(/\"/g,"'")
                                  +'","'+value.tableType
                                  +'","'+ann.location
                                  +'","'+ann.number
                                  +'","'+(Object.keys(ann.content).join(';'))
                                  +'","'+(Object.keys(ann.qualifiers).join(';'))+'"'+"\n"
      } catch (err) {
        console.log("an empty annotation, no worries: "+JSON.stringify(ann))
      }
    })
  })

  res.send(formattedRes)
})

// ! :-)
// app.get('/api/abs_index',function(req,res){
//
//   var output = "";
//   for (var i in abs_index){
//
//     output = output + i
//               +","+abs_index[i].docid
//               +","+abs_index[i].page
//               +"\n";
//
//   }
//
//   res.send(output)
// });

// app.get('/api/totalTables',function(req,res){
//   res.send({total : DOCS.length})
// });

const getMMatch = async (phrase) => {
  phrase = phrase.trim().replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '') //.replace(/[\W_]+/g," ");

  console.log("Asking MM for: "+ phrase)

  let result
  let mm_match
  try {
    result = await axios.post({
      headers: {'content-type' : 'application/x-www-form-urlencoded'},
      url:     'http://'+CONFIG.metamapper_url+'/form',
      // body
      data:    "input="+phrase+" &args=-AsI+ --JSONn -E"
    })

    const start = result.indexOf('{"AllDocuments"')
    const end = result.indexOf("'EOT'.")

    mm_match = result.slice(start, end)
  } catch(err) {
    return err
  }

  try{
    let r = JSON.parse(mm_match).AllDocuments[0].Document.Utterances.map(
                    utterances => utterances.Phrases.map(
                      phrases => phrases.Mappings.map(
                        mappings => mappings.MappingCandidates.map(
                          candidate => ({
                                    CUI:candidate.CandidateCUI,
                                    score: candidate.CandidateScore,
                                    matchedText: candidate.CandidateMatched,
                                    preferred: candidate.CandidatePreferred,
                                    hasMSH: candidate.Sources.indexOf("MSH") > -1
                                 })
                               )
                             )
                           )
                         )
    // ! :-)
    // // This removes duplicate cuis
    // r = r.reduce( (acc,el) => {if ( acc.cuis.indexOf(el.CUI) < 0 ){acc.cuis.push(el.CUI); acc.data.push(el)}; return acc }, {cuis: [], data: []} ).data
    r = r
      .flat()
      .flat()
      .flat()
      .reduce( (acc,el) => {
        if ( acc.cuis.indexOf(el.CUI) < 0 ) {
          acc.cuis.push(el.CUI);
          acc.data.push(el)
        };
        return acc
      }, {cuis: [], data: []} ).data
    r = r.sort( (a,b) => a.score - b.score)

    return r
  } catch (err) {
    return []
  }
  // return result
}

const processHeaders = async (headers) => {
  // ! :-)
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat
  // flat deep 4
  // debugger
  const all_concepts = Array.from(new Set(Object.values(headers).flat().flat().flat().flat()))

  let results = await Promise.all(
    // extract mm_match
    all_concepts.map( concept => getMMatch(concept.toLowerCase()) )
  )

  const cuis_index = await dbDriver.cuisIndexGet()

  try {
    await Promise.all(results.flat().flat().map( async (cuiData,i) => {
      if ( cuis_index[cuiData.CUI] ){
          return
      }
      console.log("insert: "+ new Date())
      return dbDriver.cuiInsert(cuiData.CUI, cuiData.preferred, cuiData.hasMSH)
    }))
  } catch (err) {
    throw new Error(err)
  }

  results = all_concepts.reduce( (acc,con,i) => {
    acc[con.toLowerCase().trim()] = { concept: con.trim(), labels: results[i] };
    return acc
  }, {})

  const allConceptPairs = Object.keys(headers).reduce ( (acc,concepts) => {acc.push(headers[concepts]); return acc} , [] ).flat()

  const final = allConceptPairs.reduce ( (acc,con,i) => {
    const concept = con[con.length-1].toLowerCase().trim()
    const root = con.slice(0,con.length-1).join(" ").toLowerCase().trim()
    const rootWCase = con.slice(0,con.length-1).join(" ").trim()
    const key = root + concept

    acc[key] = {
      concept: con[con.length-1].trim(),
      root: rootWCase,
      labels: results[concept].labels
    };
    return acc
  }, {})

  return final
}

/** 
* auto
*/
// :-) auto what?
app.post(CONFIG.api_base_url+'/auto', async function(req,res) {
  try{
    if( (req.body && req.body.headers) == false ) {
      return res.send({status: "wrong parameters", query : req.query})
    }
    const headers = JSON.parse(req.body.headers)

    res.send({autoLabels : await processHeaders(headers) })
  } catch(err){
    console.log(e)
    res.send({status: "error", query : err})
  }
});

app.get(CONFIG.api_base_url+'/getMMatch',async function(req,res){
  try{
    if(req.query && req.query.phrase ){
      const mm_match = await getMMatch(req.query.phrase)
      return res.send( mm_match )
    }
    res.send({status: "wrong parameters", query : req.query})
  } catch(err){
    console.log(err)
  }
});

app.post(CONFIG.api_base_url+'/notes', async function (req, res) {

    if ( req.body && ( ! req.body.action ) ){
      res.json({status: "undefined", received : req.query})
      return
    }

    var validate_user = validateUser(req.body.username, req.body.hash);

    if ( validate_user ){

      var notesData = JSON.parse(req.body.payload)

      var updateNotes = async (docid,page,collid,notes,tableType,completion) => {
            var client = await pool.connect()
            var done = await client.query('UPDATE public."table" SET notes=$4, "tableType"=$5, completion=$6 WHERE docid=$1 AND page=$2 AND collection_id=$3', [docid,page,collid,notes,tableType,completion])
              .then(result => console.log("Updated records for "+req.body.docid + "_" +req.body.page + "_" + req.body.collId+" result: "+ new Date()))
              .catch(e => console.error(e.stack))
              .then(() => client.release())
      }

      await updateNotes(req.body.docid, req.body.page, req.body.collId, notesData.textNotes, notesData.tableType, notesData.tableStatus)
      res.json({status:"Successful", payload: null})
    } else {
      res.json({status:"unauthorised", payload: null})
    }

})

app.post(CONFIG.api_base_url+'/text', async function (req, res) {
    // Path to tables
    const {
    tables_folder,
    tables_folder_override,
  } = global.CONFIG

  if ( req.body && ( ! req.body.action ) ){
    res.json({status: "undefined", received : req.query})
    return
  }

  var validate_user = validateUser(req.body.username, req.body.hash);

  if ( validate_user ){

    var result;

    var folder_exists = await fs.existsSync( path.join(tables_folder_override, req.body.collId ) )

    if ( !folder_exists ){
        fs.mkdirSync( path.join(tables_folder_override, req.body.collId), { recursive: true })
    }

    var titleText = '<div class="headers"><div style="font-size:20px; font-weight:bold; white-space: normal;">'+cheerio(JSON.parse(req.body.payload).tableTitle).text()+'</div></div>'

    var bodyText = JSON.parse(req.body.payload).tableBody

    var start_body_index = bodyText.indexOf("<table")
    var last_body_index = bodyText.lastIndexOf("</table>");

    var body;
    if ( (start_body_index > -1) && (last_body_index > -1) ){
      body = bodyText.substring(start_body_index, last_body_index)+"</table>";
    } else {
      body = bodyText
    }

    var completeFile = '<html><body>'+titleText+body+'</body></html>'

    fs.writeFile( path.join(tables_folder_override, req.body.collId, (req.body.docid+"_"+req.body.page+'.html') ),  completeFile, function (err) {
      if (err) throw err;

      console.log('Written replacement for: '+ req.body.collId+ " // " +req.body.docid+"_"+req.body.page+'.html');
      res.json({status: "success", data: 'Written replacement for: '+ req.body.collId+ " // " +req.body.docid+"_"+req.body.page+'.html' })
    });

  } else {
    res.json({status:"unauthorised", payload: null})
  }
})

app.get(CONFIG.api_base_url+'/removeOverrideTable', async function(req,res){
   // Path to tables
   const {
    tables_folder_override,
  } = global.CONFIG

  if(req.query && req.query.docid && req.query.page  ){
    let file_exists = true
    try {
      const fd = await fs.open(tables_folder_override+"/"+req.query.docid+"_"+req.query.page+".html")
      fd.close()
    } catch (err) {
      file_exists = false
    }

    if ( file_exists ) {
      try {
        await fs.unlink(tables_folder_override+"/"+req.query.docid+"_"+req.query.page+".html")
      } catch (err) {
        console.log(`REMOVED : ${tables_folder_override}/${req.query.docid}_${req.query.page}.html`);
        throw err;
      }
    }

    res.send({status: "override removed"})
  } else {
    res.send({status: "no changes"})
  }
});

app.get(CONFIG.api_base_url+'/classify', async function(req,res){
  if(req.query && req.query.terms){
    console.log(req.query.terms)

    res.send({results : await classify(req.query.terms.split(","))})
  }
});

app.get(CONFIG.api_base_url+'/getTable',async function(req,res){

   try{
    if(req.query && req.query.docid && req.query.page && req.query.collId ){

      var tableData = await readyTable(req.query.docid, req.query.page, req.query.collId, false)

      res.send( tableData  )
    } else {
      res.send({status: "wrong parameters", query : req.query})
    }
  } catch (e){
    console.log(e)
    res.send({status: "getTable: probably page out of bounds, or document does not exist", query : req.query})
  }

});

app.post(CONFIG.api_base_url+'/getTable',async function(req,res){

   try{
    if(req.body && req.body.docid && req.body.page && req.body.collId ){

      var tableData = await readyTable(req.body.docid, req.body.page, req.body.collId, false)

      res.json( tableData  )
    } else {
      res.json({status: "wrong parameters", query : req.body})
    }
  } catch (e){
    console.log(e)
    res.json({status: "getTable: probably page out of bounds, or document does not exist", query : req.body})
  }

});

app.post(CONFIG.api_base_url+'/saveAnnotation',async function(req,res) {


  if ( req.body && ( ! req.body.action ) ){
    res.json({status: "undefined", received : req.query})
    return
  }

  const {
    username=undefined,
    hash=undefined,

    docid,
    page,
    collId,

    payload,
  } = req.body

  var validate_user = validateUser(username, hash);

  if ( validate_user ){

      console.log(`Recording Annotation: ${docid}_${page}_${collId}`)

      var tid = await dbDriver.tidGet ( docid, page, collId )

      var insertAnnotation = async (tid, annotation) => {

        var client = await pool.connect()

        var done = await client.query('INSERT INTO annotations VALUES($2,$1) ON CONFLICT (tid) DO UPDATE SET annotation = $2;', [tid, annotation])
          .then(result => console.log("Updated Annotations for "+tid+" : "+ new Date()))
          .catch(e => console.error(e.stack))
          .then(() => client.release())

      }

      var annotationData = JSON.parse(payload)

      annotationData.annotations.map( (row) => {

        row.content = Array.isArray(row.content) ? row.content.reduce ( (acc,item) => { acc[item] = true; return acc}, {}) : row.content
        row.qualifiers = Array.isArray(row.qualifiers) ? row.qualifiers.reduce ( (acc,item) => { acc[item] = true; return acc}, {}) : row.qualifiers

        return row
      })

      await insertAnnotation( tid, {annotations: annotationData.annotations} )

      res.json({status:"success", payload:""})

  } else {
      res.json({status:"unauthorised", payload: null})
  }
});

const prepareMetadata = (headerData, tableResults) => {

    if(!headerData.headers || headerData.headers.length < 1 || (!tableResults) ){
      return {}
    }

    tableResults = tableResults.sort( (a,b) => a.row-b.row)

    var headerDataCopy = JSON.parse(JSON.stringify(headerData))

    headerDataCopy.headers.reverse()
    headerDataCopy.subs.reverse()

    var annotation_groups = headerDataCopy.headers.reduce(
        (acc,item,i) => {
          if ( headerDataCopy.subs[i]) {
            acc.temp.push(item)
          } else {
            acc.groups.push([...acc.temp,item].reverse());
            acc.temp = []
          };
          return acc
        }, {groups:[], temp: []})

      annotation_groups.groups[annotation_groups.groups.length-1] = [...annotation_groups.groups[annotation_groups.groups.length-1], ...annotation_groups.temp ]
      annotation_groups = annotation_groups.groups.reverse()

    var grouped_headers = annotation_groups.reduce( (acc,group,i) => {
      var concepts = tableResults.reduce( (cons,res,j)  => {
        cons.push (
          group.map( (head) => {
            if ( res[head] )
            return res[head]
          })
        )
        return cons
      },[]);

      acc[group.join()] = concepts;
      return acc;
    },{})


    var meta_concepts = Object.keys(grouped_headers).reduce( (mcon, group) => {
      var alreadyshown = []
      var lastConcept = ""

      mcon[group] = grouped_headers[group].reduce(
          (acc, concepts) => {
              var key = concepts.join()
              if ( !alreadyshown[key] ){
                alreadyshown[key] = true
                concepts = concepts.filter( b => b != undefined )

                if ( concepts[concepts.length-1] == lastConcept ){

                  concepts = concepts.slice(concepts.length-2,1)
                }

                acc.push( concepts )
              }

              return acc
          }, [])

      return mcon
    },{})

    const unfoldConcepts = (concepts) => {
      var unfolded = concepts.reduce ( (stor, elm, i) => {

            for ( var e = 1; e <= elm.length; e++ ){

                var partial_elm = elm.slice(0,e)
                var key = partial_elm.join()

                if ( stor.alreadyThere.indexOf(key) < 0 ){
                  stor.unfolded.push(partial_elm)
                  stor.alreadyThere.push(key)
                }

            }

            return stor;
      }, { unfolded:[], alreadyThere:[] })

      return unfolded.unfolded
    }

  meta_concepts = Object.keys(meta_concepts).reduce(
    (acc,mcon,j) => {
      acc[mcon] = unfoldConcepts(meta_concepts[mcon]);
      return acc
    },{} )

  return meta_concepts
}

const processAnnotationAndMetadata = async (docid,page,collId) => {

    var tabularData = await prepareAnnotationPreview(docid, page, collId, false)

    if (tabularData.backAnnotation && tabularData.backAnnotation.rows.length > 0 && tabularData.backAnnotation.rows[0].annotation ){

      // .annotations.map( ann => { return {head: Object.keys(ann.content).join(";"), sub: ann.subAnnotation } })

      var tid = tabularData.backAnnotation.rows[0].tid

      var header_data = tabularData.backAnnotation.rows[0].annotation.map( ann => { return {head: [ann.content.split("@")[0]].join(";"), sub: ann.subAnnotation } })

      header_data = header_data.reduce( (acc, header,i) => {
                              acc.count[header.head] = acc.count[header.head] ? acc.count[header.head]+1 : 1;
                              acc.headers.push(header.head+"@"+acc.count[header.head]);
                              acc.subs.push(header.sub);
                              return acc;
                            }, {count:{},headers:[],subs:[]} )



      var headerData = tabularData.result.reduce( (acc, item) => {

        Object.keys(item).map( (head) => {
          if ( ["col","row","docid_page","value"].indexOf(head) < 0 ){
            var currentItem = acc[head]

            if( !currentItem ){
              currentItem = []
            }

            currentItem.push(item[head])

            acc[head] = [...new Set(currentItem)]
          }
        })

        return acc

      }, {})


      var headDATA = prepareMetadata(header_data, tabularData.result)

      var hedDatra = await processHeaders(headDATA)

      var metadata = Object.keys(hedDatra).map( (key) => {
        var cuis = hedDatra[key].labels.map( (label) => {return label.CUI} )

        return {
          concept: hedDatra[key].concept,
          concept_root: hedDatra[key].root,
          concept_source: "",
          cuis: cuis,
          cuis_selected: cuis.slice(0,2),
          istitle: false,
          labeller: "suso",
          qualifiers: [""],
          qualifiers_selected: [""],
          tid: tid
        }
      })

      var result = await setMetadata(metadata)
    }

}

// api_host
// ui_port
// ui_host

const exec = require('child_process').exec;

const myShellScript = exec('fuser -k '+CONFIG.api_port+'/tcp');

app.listen(CONFIG.api_port, '0.0.0.0', () => {
  console.log(`Table Tidier Server running on port ${CONFIG.api_port} with base: ${CONFIG.api_base_url}  :: ${new Date().toISOString()}`);
});

main();
