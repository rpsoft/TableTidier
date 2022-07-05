// Load config
import 'dotenv/config'
const CONFIG_PATH = process.env.CONFIG_PATH || process.cwd()
const GENERAL_CONFIG = require(CONFIG_PATH + '/config.json')

const fsClassic = require('fs');
const fs = require('fs/promises');
const path = require('path');
const exec = require('child_process').exec;
const axios = require('axios');

const express = require('express');
// morgan, HTTP request logger middleware for node.js
const logger = require('morgan')
// multer, middleware for handling multipart/form-data
const multer = require('multer');
const bodyParser = require('body-parser');
const cors = require('cors');
const html = require("html");
// JWT Authentication
// https://github.com/MichielDeMey/express-jwt-permissions
// https://github.com/auth0/express-jwt
const experessJwt = require('express-jwt');
const jwt = require('jsonwebtoken');
const guard = require('express-jwt-permissions')()

// DB driver
const pgDriver = require('./db/postgres-driver')({...GENERAL_CONFIG.db})
const dbDriver = require('./db/sniffer-driver')
dbDriver.addDriver(pgDriver)

const csv = require('csv-parser');
const CsvReadableStream = require('csv-reader');

// Import routes
import usersRoutes from './routes/users'
usersRoutes.addDriver(dbDriver)

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

// :-)
global.pool = pgDriver.pool

// JWT, Key used to sign and encrypt
// Generate new key
// https://wiki.openssl.org/index.php/Command_Line_Elliptic_Curve_Operations
// openssl ecparam -name secp256k1 -genkey -noout -out secp256k1-key.pem
// openssl ecparam -name secp256k1 -genkey -noout -out certificates/private.pem
// generate public key:
// openssl ec -in private.pem -pubout -out public.pem

const privatekey = fsClassic.readFileSync('./certificates/private.pem')
const publickey = fsClassic.readFileSync('./certificates/public.pem')

// const SESSION_TOKEN_EXPIRATION_TIME = '24h'
const SESSION_TOKEN_EXPIRATION_TIME = '1m'
// In miliseconds
const SESSION_TOKEN_REFRESH_TIME = 20*1e3

// TTidier subsystems load.
console.log("Loading Files Management")

console.log("Loading Security")
import
  passport,
  {
    passportAddDriver
  }
from "./security.js"
// User config use dbDriver
passportAddDriver(dbDriver)

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
const easysearch = require('@sephir/easy-search')

console.log("Configuring Server")
var app = express();
app.use(logger('tiny'))

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
app.use('/api/', usersRoutes);


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
  res.send('TTidier Server running.')
});

app.get('/api/test', function(req,res){
  res.send('here we are')
})

const tableSplitter = async ( tablePath ) => {
  try {
    const data = await fs.readFile(tablePath, {encoding: 'utf8'})
    const tablePage = cheerio.load(data);
    const tables  = tablePage('table')

    const tablesHTML = []

    // If only one table in the file, just return the whole file. Let the user clean up
    if ( tables.length <= 1 ){
      tablesHTML.push(data)
    } else {
      // we attempt automatic splitting here.
      for ( let t = 0; t < tables.length; t++){
        tablesHTML.push('<table>'+tablePage(tables[t]).html()+'</table>')
      }
    }
    return tablesHTML
  } catch (err) {
    console.log(err)
  }
}

app.post(CONFIG.api_base_url+'/tableUploader',
  experessJwt({
    secret: publickey,
    algorithms: ['ES256'],
    credentialsRequired: true,
  }),
  async (req, res) => {

  let upload = multer({ storage: storage }).array('fileNames');

  upload(req, res, async (err) => {
    if (err) {
      console.log(err)
      res.json({status: 'FAIL', payload: 'Server error'});
      return
    }
    // Path to tables
    const {
      tables_folder,
    } = global.CONFIG

    const files = req.files;
    let index, len;

    const results = []
    const {
      collection_id,
      username_uploader,
    } = req.body

    // check if table exist at collection

    const docids = files.map((file) => {
      // docid
      return file.filename.replace(/\.[^/.]+$/, '').replaceAll('_', '-')+'_1'
    })

    const checkdFiles = await docidListCheckIfInTargetCollection(docids, collection_id);
    const filteredFiles = checkdFiles.reduce(function (prev, table, index) {
      typeof table == 'string' && table == 'not found'?
        prev.upload.push(files[index])
        : prev.existAtCollection.push(files[index]);
      return prev;
    }, {upload:[], existAtCollection:[]});

    filteredFiles.existAtCollection.forEach(file => 
      results.push({
        filename: file.filename,
        status: 'failed',
        detail: 'already present in collection'
      }))
    // Loop through all the uploaded files and return names to frontend
    await Promise.all(filteredFiles.upload.map( async (file) => {
      try {
        const tables_html = await tableSplitter(file.path)
        // Format file name. all '_' to '-'
        const cleanFilename = file.originalname.replaceAll('_', '-')
        const file_elements = cleanFilename.split('.')
        const extension = file_elements.pop()
        const baseFilename = file_elements.join('.')

        await fs.mkdir(path.join(tables_folder, collection_id), { recursive: true })

        await Promise.all(tables_html.map( async (table, t) => {
          const page = t+1
          const docid = baseFilename

          const newTableFilename = `${docid}_${page}.${extension}`

          await fs.writeFile(path.join(tables_folder, collection_id, newTableFilename), table)

          await dbDriver.tableCreate(docid, page, username_uploader, collection_id, newTableFilename)
          results.push({filename: newTableFilename, status: 'success'})
        }))
      } catch(err) {
        console.log(err)
        console.log(`file: ${file.originalname} failed to process`)
        results.push({filename: file.originalname, status: 'failed'})
      }
    }))

    res.send(results);
  });
});

async function UMLSData() {
  let semtypes = new Promise( async (resolve,reject) => {
    const fd = await fs.open(CONFIG.system_path+ 'Tools/metamap_api/cui_def.csv', 'r');
    let inputStream = fd.createReadStream({encoding: 'utf8'});

    const result = {};

    inputStream
      .pipe(new CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true, skipHeader: true }))
      .on('data', (row) => {
        //console.log('A row arrived: ', row);
        row[4].split(';').map( st => {
          result[st] = result[st] ? result[st]+1 : 1
        })
      })
      .on('end', (data) => resolve(result));
  })

  let cui_def = new Promise( async (resolve,reject) => {
    const fd = await fs.open(CONFIG.system_path + 'Tools/metamap_api/cui_def.csv', 'r');
    let inputStream = fd.createReadStream({encoding: 'utf8'});

    const result = {};

    inputStream
      .pipe(new CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true, skipHeader: true }))
      .on('data', (row) => {
        //console.log('A row arrived: ', row);
        const [
          key,
          matchedText,
          preferred,
          hasMSH,
          semTypes,
        ] = row
        result[key] = {matchedText, preferred, hasMSH, semTypes}
      })
      .on('end', (data) => resolve(result));
  })

  let cui_concept = new Promise( async (resolve,reject) =>{
    const fd = await fs.open(CONFIG.system_path+ 'Tools/metamap_api/cui_concept.csv', 'r');
    let inputStream = fd.createReadStream({encoding: 'utf8'});

    const result = {};

    inputStream
      .pipe(new CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true, skipHeader: true }))
      .on('data', (row) => {
        //console.log('A row arrived: ', row);
        result[row[0]] = row[1]
      })
      .on('end', (data) => resolve(result));
  })

  semtypes = await semtypes
  cui_def = await cui_def
  cui_concept = await cui_concept

  return {semtypes, cui_def, cui_concept}
}

async function CUIData () {
  const umlsData = await UMLSData();

  const results = await dbDriver.annotationResultsGet()

  const rres = results.reduce(
    (acc, ann, i) => {

      let annots = ann.annotation.annotations

      annots = annots.reduce ( (acc, ann) => {
        const loc = ann.location;
        const n = ann.number;
        const descriptors = Object.keys(ann.content).join(";");
        const modifier = Object.keys(ann.qualifiers).join(";");
        acc[loc][n] = {descriptors, modifier};
        return acc;
      } ,{ Col:{}, Row:{} } )

      acc[ann.docid+'_'+ann.page] = {
        user: ann.user,
        minPos: 1,
        Col: annots.Col,
        Row : annots.Row
      };
      return acc
    }, {}
  )

  return {
    cui_def: umlsData.cui_def,
    cui_concept: umlsData.cui_concept,
    actual_results: rres,
    semtypes: umlsData.semtypes
  }
}

const rebuildSearchIndex = async () => {
  // Path to tables
  const {
    tables_folder,
    tables_folder_override,
  } = global.CONFIG
  let [
    tablesInFolder, 
    tablesInFolderOverride,
  ] = await Promise.all([
    fs.readdir(path.join(tables_folder)),
    fs.readdir(path.join(tables_folder_override)),
  ])
  // Join path
  tablesInFolder = tablesInFolder.map( (dir) => path.join(tables_folder, dir))
  tablesInFolderOverride = tablesInFolderOverride.map(
    (dir) => path.join(tables_folder_override, dir)
  )
  global.searchIndex = await easysearch.indexFolder(
    [
      ...tablesInFolder,
      ...tablesInFolderOverride
    ],
    true
  )
}

const tabularFromAnnotation = async ( annotation ) => {
  // Path to tables
  const {
    tables_folder,
    tables_folder_override,
  } = global.CONFIG

  if ( annotation.length < 1 ){ // annotation not there
    return
  }

  annotation = annotation[0]
  const htmlFile = annotation.file_path

  //If an override file exists then use it!. Overrides are those produced by the editor.
  const file_exists = await fs.stat(path.join(
    tables_folder_override,
    annotation.collection_id,
    htmlFile
  ))
  .then(() => true, () => false)

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
  } catch (err) {
    console.log(err)
  }
}

// preinitialisation of components if needed.
async function main() {

  // search index rebuild/initialisation
  console.time('easySearch')
  await rebuildSearchIndex()
  console.timeEnd('easySearch')

  // UMLS Data buffer
  console.time('UMLSData')
  umls_data_buffer = await UMLSData();
  console.timeEnd('UMLSData')

  // await refreshDocuments()

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

// * :-) check calls from ui
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
      console.log('HERE DELETE: '+tidDelete)
      await dbDriver.metadataClear(tidDelete)
      console.log('deleted: '+ new Date())
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
        cuis.join(';'),
        cuis_selected.join(';'),
        qualifiers.join(';'),
        qualifiers_selected.join(';'),
        istitle,
        labeller,
        tid
      )
      results.push(done);
      console.log('insert: '+key+' -- '+ new Date())
    } catch (err) {
      console.log(concept+' -- '+'insert failed: '+key+' -- ' + new Date() + ' ' + err)
    }
  }

  return results
}

app.post(CONFIG.api_base_url+'/metadata',
  experessJwt({
    secret: publickey,
    algorithms: ['ES256'],
    credentialsRequired: false,
  }),
  async (req, res) => {

  if ( req.body && ( ! req.body.action ) ){
    res.json({status: 'undefined', received: req.body})
    return
  }

  const {
    action,

    docid,
    // page,
    // collId,

    payload,
    tids,
  } = req.body

  // vars as number
  // collection_id
  let collId = parseInt(req.body.collId)
  // page
  const page = parseInt(req.body.page)

  // req.user added by experessJwt
  const user = req?.user
  // username in user subject
  const username = user?.sub
  let tid = req.body.tid

  const collectionPermissions = await dbDriver.permissionsResourceGet('collections', user ? username : '')

  if (tid && !collId) {
    // get collId from tid
    const table = await dbDriver.tableGetByTid(tid)
    collId = parseInt(table.collection_id)
  }

  if ( collectionPermissions.read.includes(collId) == false ) {
    return res.json({status: 'unauthorised', payload: null})
  }


  if (
    tid === 'undefined' ||
    tid === 'null'
  ) {
    tid = await dbDriver.tidGet(
      docid,
      page,
      collId,
    )
  
    if (!tid || tid == 'not found') {
      return res.json({status: 'fail', data: 'table not found'})
    }
  }

  let result = {};

  switch (action) {
    case 'clear':
      if ( collectionPermissions.write.includes(collId) ){
        result = await dbDriver.metadataClear(tid)
        console.log('deleted: '+ new Date())
      }
      break;
    case 'save':
      if ( collectionPermissions.write.includes(collId) ){
        const metadata = JSON.parse(payload).metadata
        result = await setMetadata(metadata)
      }
      break;
    case 'get':
      //req.body.docid, req.body.page, req.body.collId,
      result = await dbDriver.metadataGet([tid])
      break;
    case 'get_multiple':
      //req.body.docid, req.body.page, req.body.collId,
      result = await dbDriver.metadataGet(tids)
      break;
    default:
  }
  // Always return the updated collection details
  // result = await dbDriver.collectionGet(req.body.collection_id);
  res.json({status: 'success', data: result})
});

app.post(CONFIG.api_base_url+'/cuis', async (req, res) => {

  if ( req.body && ( ! req.body.action ) ){
    res.json({status: 'undefined', received : req.body})
    return
  }

  const validate_user = true //validateUser(req.body.username, req.body.hash);
  // var collectionPermissions = await dbDriver.permissionsResourceGet('collections', req.body.username)

  if ( validate_user ) {
    let result = {};

    switch (req.body.action) {
      case 'get':
        result = await dbDriver.cuisIndexGet() //req.body.docid, req.body.page, req.body.collId,
      default:
    }
    res.json({status: 'success', data: result})
  } else {
    res.json({status: 'unauthorised', payload: null})
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
  let table_results = []

  for ( let ann in annotation_data ) {
    console.log(`Preparing Table: ${ann} / ${annotation_data.length}`)
    let entry
    try {
      entry = annotation_data[ann]

      // Check file exists
      const override_exists = await fs.stat(
        path.join(tables_folder_override, entry.collection_id, entry.file_path)
      )
      .then(() => true, () => false)

      const table_res = await getFileResults(
        entry.annotation,
        path.join(
          override_exists ?
            tables_folder_override
            : tables_folder,
          entry.collection_id,
          entry.file_path
        )
      )

      table_results = [
        ...table_results,
        // table_res,
        {
          tid: entry.tid,
          table_result: table_res
        },
      ]

    } catch( err ) {
      console.log( 'Failed: ' + path.join(entry.collection_id, entry.file_path) )
      console.log(err)
    }
  }
  return table_results
}

// Collections
app.post(CONFIG.api_base_url+'/collections',
  experessJwt({
    secret: publickey,
    algorithms: ['ES256'],
    credentialsRequired: false,
  }),
  async (req, res) => {

  if ( req.body && ( ! req.body.action ) ){
    res.json({status: 'undefined', received: req.query})
    return
  }

  const {
    action,

    // collection_id,
    collectionData,

    tid,
    target,
  } = req.body

  // collection_id as number
  const collection_id = parseInt(req.body.collection_id)

  // req.user added by experessJwt
  const user = req?.user
  // username in user subject
  const username = user?.sub
  const collectionPermissions = await dbDriver.permissionsResourceGet('collections', user ? username : '')

  // Guest can see collections
  let response = {status: 'failed'}
  let result;

  switch (action) {
    case 'list':
      result = await dbDriver.collectionsList();
      result = result.filter(
        elm => collectionPermissions.read.includes(
          elm.collection_id
        )
      )
      response = {status: 'success', data: result}
      break;

    case 'get':
      if (collectionPermissions.read.includes(collection_id) == false ){
        response = {status:'unauthorised operation', payload: req.body}
        break;
      }
      result = await dbDriver.collectionGet(collection_id);

      result.permissions = {
        read: collectionPermissions.read.includes(collection_id),
        write: collectionPermissions.write.includes(collection_id)
      }

      response = {status: 'success', data: result}
      break;

    case 'delete':
      if (collectionPermissions.read.includes(collection_id) == false ){
        response = {status:'unauthorised operation', payload: req.body}
        break;
      }
      await dbDriver.collectionDelete(collection_id);
      response = {status: 'success', data: {}}
      break;

    case 'create':
      // no user?
      if (!user) {
        response = {status: 'login to create collection', payload: req.body}
        break;
      }
      result = await dbDriver.collectionCreate('new collection', '', username);
      response = {status: 'success', data: result}
      break;

    // Well use edit to create Collection on the fly
    case 'edit':
      if (collectionPermissions.read.includes(collection_id) == false ) {
        response = {status:'unauthorised operation', payload: req.body}
        break;
      }
      const allCollectionData = JSON.parse( collectionData )
      result = await dbDriver.collectionEdit(allCollectionData);
      // // * :-) Collections Edit return collection_id save a step
      // result = await dbDriver.collectionGet(collection_id);
      response = {status: 'success', data: result}
      break;

    case 'download':
      let tids = JSON.parse(tid);

      if (tids.length > 0 && typeof tids[0] == 'string') {
        // change tids from string to numbers
        tids = tids.map(tid => parseInt(tid))
      }

      // Download file
      if ( target.includes('results') ){
        // data csv
        // ! :-) remove comments when ok with download csv
        // const annotations = await dbDriver.annotationByIDGet(docid, page, collId)
        // result = await dbDriver.annotationDataGet(tids)
        // result = await dbDriver.resultsDataGet( tids );
        result = await getResultsRefreshed( tids )

      } else if ( target.includes('metadata') ) {
        // metadata csv
        // result = await dbDriver.metadataGet(tids)
        result = await dbDriver.metadataGet( tids );
      } else {
        // data & metadata json
        // Default Action.
        const result_res = await getResultsRefreshed( tids )
        const result_met = await dbDriver.metadataGet( tids );
        // var result =

        result = {data: result_res, metadata: result_met}
      }

      response = {status: 'success', data: result}
      break;
  }

  res.json(response)
});

const docidListCheckIfInTargetCollection = (list, collectionId) => {
  return Promise.all(
    list.map((_docid) => {
      const [docid, page] = _docid.split('_')
      return dbDriver.tableGet(
        docid,
        page,
        collectionId,
      )
    })
  );
}

app.post(CONFIG.api_base_url+'/tables',
  experessJwt({
    secret: publickey,
    algorithms: ['ES256'],
    credentialsRequired: false,
  }),
  async (req, res) => {

  if ( req.body && ( ! req.body.action ) ){
    return res.json({status: 'undefined', received : req.query})
  }

  const {
    action,
    // docidList,
    // collection_id,
    // tablesList,
    // targetCollectionID,
  } = req.body

  // collection_id as number
  const collection_id = parseInt(req.body.collection_id)
  const targetCollectionID = parseInt(req.body.targetCollectionID)
  let tablesList
  let docidList

  try {
    docidList = JSON.parse(req.body.docidList)
  } catch(err) { }
  
  // Check tablesList when docidList is not defined
  if (!docidList) {
    try {
      tablesList = JSON.parse(req.body.tablesList)
    } catch (err) {
      res.json({status: 'FAIL', payload: 'invalid table list'})
      return
    }
  }

  // req.user added by experessJwt
  const user = req?.user
  // username in user subject
  const username = user?.sub
  const collectionPermissions = await dbDriver.permissionsResourceGet('collections', user ? username : '')

  if ( !user ) {
    res.json({status:'unauthorised', payload: null})
    return
  }

  let result = {};

  switch (action) {
    case 'checkByDocid':
      if ( collectionPermissions.write.includes(collection_id) == false ) {
        res.json({status: 'FAIL', payload: 'do not have permissions on collection'})
        return
      }

      result = await docidListCheckIfInTargetCollection(docidList, collection_id);

      res.json({
        status: 'success',
        data: result.map((elm, index) => ({
          [docidList[index]]: typeof elm == 'string' && elm.includes('not found') ?
            elm
            : 'found'
        }))
      })
      return
      break;
    case 'checkFiles':
      if ( collectionPermissions.write.includes(collection_id) == false ) {
        res.json({status: 'FAIL', payload: 'do not have permissions on collection'})
        return
      }

      result = await Promise.all(
        tablesList.map((docid) => dbDriver.tableGet(
          docid.replace(/\.[^/.]+$/, '').replaceAll('_', '-'),
          1,
          collection_id,
        ))
      );

      res.json({
        status: 'success',
        data: result.map((elm, index) => ({
          [tablesList[index]]: typeof elm == 'string' && elm.includes('not found') ?
            elm
            : 'found'
        }))
      })
      return
      break;
    case 'remove':
      if ( collectionPermissions.write.includes(collection_id) == false ) {
        res.json({status: 'FAIL', payload: 'do not have permissions on collection'})
        return
      }
      result = await dbDriver.tablesRemove(tablesList, collection_id);
      break;
    case 'move':
      if ( collectionPermissions.write.includes(targetCollectionID) == false ) {
        res.json({status: 'FAIL', payload: 'do not have permissions on destination'})
        return
      }
      // check if table exist at collection
      result = await docidListCheckIfInTargetCollection(tablesList, targetCollectionID);

      const payload = result.reduce(function (prev, table, index) {
        typeof table == 'string' && table == 'not found'?
          prev.moved.push(tablesList[index])
          : prev.existAtCollection.push(tablesList[index]);
        return prev;
      }, {moved:[], existAtCollection:[]});

      result = await dbDriver.tablesMove(payload.moved, collection_id, targetCollectionID);
      return res.json({
        status: 'success',
        data: payload,
      })
      break;
    case 'list':  // This is the same as not doing anything and returning the collection and its tables.
    default:
  }
  // Always return the updated collection details
  result = await dbDriver.collectionGet(collection_id);
  res.json({status: 'success', data: result})
});

app.post(CONFIG.api_base_url+'/search',
  experessJwt({
    secret: publickey,
    algorithms: ['ES256'],
    credentialsRequired: false,
  }),
  async (req, res) => {

  const {
    searchContent,
  } = req.body
  var type = JSON.parse(req.body.searchType)

  // req.user added by experessJwt
  const user = req?.user
  // username in user subject
  const username = user?.sub
  const collectionPermissions = await dbDriver.permissionsResourceGet('collections', user ? username : '')

  let search_results = easysearch.search( global.searchIndex, searchContent)

  search_results = search_results.filter(
    (elm) => collectionPermissions.read.includes(
      // Extract collection id from path.
      // Example: 1 from 'HTML_TABLES/1/20463178_2.html'
      parseInt(/\d+/g.exec(elm.doc)[0])
    )
  )

  // remove extension
  search_results.forEach( elm => elm.doc = elm.doc.replace('.html', '') )

  console.log(`SEARCH: ${search_results.length} for ${searchContent}`)

  // if ( search_results.length > 100){
  //   search_results = search_results.slice(0,100)
  // }

  res.json(search_results)
});

app.post(CONFIG.api_base_url+'/getTableContent',
  experessJwt({
    secret: publickey,
    algorithms: ['ES256'],
    credentialsRequired: false,
  }),
  async (req, res) => {
  
  let {
    enablePrediction,

    docid,
    page,
    // collId,
  } = req.body

  // collId as integer
  let collId = parseInt(req.body.collId)

  // req.user added by experessJwt
  const user = req?.user
  // username in user subject
  const username = user?.sub
  let tid = req.body.tid

  const collectionPermissions = await dbDriver.permissionsResourceGet('collections', user ? username : '')

  if (tid && !collId) {
    // get collId from tid
    const table = await dbDriver.tableGetByTid(tid)
    collId = parseInt(table.collection_id)
    docid = table.docid
    page = table.page
  }

  if ( collectionPermissions.read.includes(collId) == false ){
    return res.json({status: 'unauthorised', body: req.body})
  }

  try {
    if ((docid && page && collId) == false) {
      return res.json({status: 'wrong parameters', body: req.body})
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

    tableData.annotationData = annotation ? annotation : {}

    if ( predictionEnabled ) {
      const rows = tableData.predictedAnnotation.rows.map( ann  => {
        return {
          location: 'Row',
          content: ann.descriptors.reduce( (acc,d) => { acc[d] = true; return acc }, {}),
          number: (ann.c+1)+'',
          qualifiers: ann.unique_modifier == '' ?
            {}
            : ann.unique_modifier.split(';')
              .filter( a => a.length > 1)
              .reduce( (acc,d) => { acc[d] = true; return acc }, {}),
          subannotation: false
        }
      })

      const cols = tableData.predictedAnnotation.cols.map( ann  => {
        return {
          location: 'Col',
          content: ann.descriptors.reduce( (acc,d) => { acc[d] = true; return acc }, {}),
          number: (ann.c+1)+'',
          qualifiers: ann.unique_modifier == '' ?
            {}
            : ann.unique_modifier.split(';')
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
      status: 'getTableContent: probably page out of bounds, or document does not exist',
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
  if ( !annotations ) {
    return {state: 'fail', result : []}
  }
  const entry = annotations

  // Check if file exist
  const override_exists = await fs.stat(path.join(
    tables_folder_override,
    entry.collection_id.toString(),
    entry.file_path
  ))
  .then(() => true, () => false)

  const tableResults = await getFileResults(
    entry.annotation,
    path.join(
      override_exists ? tables_folder_override : tables_folder,
      entry.collection_id.toString(),
      entry.file_path
    )
  )
  tableResults.forEach( item => { item.docid_page = entry.docid+'_'+entry.page })

  return {state: 'good', result: tableResults}
}

// Generates the results table live preview, connecting to the R API.
app.post(CONFIG.api_base_url+'/annotationPreview',
  experessJwt({
    secret: publickey,
    algorithms: ['ES256'],
    credentialsRequired: false,
  }),
  async (req, res) => {

  let {
    docid,
    page,
    // collId,

    cachedOnly,
  } = req.body

  // collId as integer
  let collId = parseInt(req.body.collId)

  // req.user added by experessJwt
  const user = req?.user
  // username in user subject
  const username = user?.sub
  let tid = req.body.tid

  const collectionPermissions = await dbDriver.permissionsResourceGet('collections', user ? username : '')

  if (tid && !collId) {
    // get collId from tid
    const table = await dbDriver.tableGetByTid(tid)
    collId = parseInt(table.collection_id)
    docid = table.docid
    page = table.page
  }

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
      return res.json({status: 'wrong parameters', body : req.body})
    }

    res.json(await prepareAnnotationPreview(docid , page, collId, cachedOnly))
  } catch (err) {
    console.log(err)
    res.json({
      status: 'annotationPreview : probably page out of bounds, or document does not exist',
      body: req.body
    })
  }
  // res.json( {"state" : "reached end", result : []} )
});

// Returns all annotations for all document/tables.
app.get(CONFIG.api_base_url+'/formattedResults', async function (req, res){
  const results = await dbDriver.annotationResultsGet()

  if ( !results ) {
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

  for ( const r in results) {
    const ann = results[r]
    const existing = finalResults[ann.docid+'_'+ann.page]
    if ( existing ) {
      if (
        ann.N > existing.N &&
        ann.annotation.annotations.length >= existing.annotation.annotations.length
      ) {
        finalResults[ann.docid+'_'+ann.page] = ann
      }
    } else { // Didn't exist so add it.
      finalResults[ann.docid+'_'+ann.page] = ann
    }
  }

  let finalResults_array = []
  for ( const r in finalResults ) {
    const ann = finalResults[r]
    finalResults_array[finalResults_array.length] = ann
  }

  let formattedRes = '"user","docid","page","corrupted_text","tableType","location","number","content","qualifiers"\n';

  finalResults_array.forEach( (value, i) => {
    value.annotation.annotations.forEach( (ann , j ) => {
      try {
        formattedRes = formattedRes+
          '"'+value.user
          +'","'+value.docid
          +'","'+value.page
          // +'","'+value.corrupted
          +'","'+ ( value.corrupted_text == 'undefined' ?
                      ''
                      : value.corrupted_text ).replace(/\"/g,"'")
          +'","'+value.tableType
          +'","'+ann.location
          +'","'+ann.number
          +'","'+(Object.keys(ann.content).join(';'))
          +'","'+(Object.keys(ann.qualifiers).join(';'))+'"\n'
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
  // Clean phrase
  phrase = phrase.trim()
    .replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '') //.replace(/[\W_]+/g," ");

  console.log('Asking MM for: '+ phrase)

  let result
  let mm_match
  try {
    result = await axios.post(
      `${CONFIG.metamapper_url}/form`,
      // body
      `input=${phrase} &args=-AsI+ --JSONn -E`,
      {
        headers: {'content-type': 'application/x-www-form-urlencoded'},
      }
    )

    result = result.data

    const start = result.indexOf('{"AllDocuments"')
    const end = result.indexOf(`'EOT'.`)

    mm_match = result.slice(start, end)
  } catch(err) {
    console.log(err)
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
              hasMSH: candidate.Sources.includes('MSH')
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
  const all_concepts = Array.from(new Set(Object.values(headers).flat().flat().flat().flat()))

  let results = await Promise.all(
    // extract mm_match
    all_concepts.map( concept => getMMatch(concept.toLowerCase()) )
  )

  const cuis_index = await dbDriver.cuisIndexGet()

  try {
    await Promise.all(results.flat().flat().map( async (cuiData, i) => {
      if ( cuis_index[cuiData.CUI] ){
        return
      }
      console.log("insert: "+ new Date())
      return dbDriver.cuiInsert(cuiData.CUI, cuiData.preferred, cuiData.hasMSH)
    }))
  } catch (err) {
    throw new Error(err)
  }

  results = all_concepts.reduce( (acc, con, i) => {
    acc[con.toLowerCase().trim()] = { concept: con.trim(), labels: results[i] };
    return acc
  }, {})

  const allConceptPairs = Object.keys(headers).reduce(
    (acc, concepts) => {acc.push(headers[concepts]); return acc}
    , []
  ).flat()

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
* Terminology Linking
* auto label
*/
// :-) auto?
app.post(CONFIG.api_base_url+'/auto', async (req, res) => {
  try{
    if( (req.body && req.body.headers) == false ) {
      return res.send({status: 'wrong parameters', query : req.query})
    }
    const headers = JSON.parse(req.body.headers)

    return res.send({autoLabels: await processHeaders(headers) })
  } catch(err){
    console.log(err)
    res.send({status: 'error', query : err})
  }
});

app.get(CONFIG.api_base_url+'/getMMatch',async (req, res) => {
  try {
    if(req.query && req.query.phrase ){
      const mm_match = await getMMatch(req.query.phrase)
      return res.send( mm_match )
    }
    res.send({status: 'wrong parameters', query : req.query})
  } catch(err) {
    console.log(err)
  }
});

app.post(CONFIG.api_base_url+'/notes',
  experessJwt({
    secret: publickey,
    algorithms: ['ES256'],
    credentialsRequired: false,
  }),
  async (req, res) => {
  
  // req.user added by experessJwt
  const user = req?.user

  if ( !user ) {
    res.json({status: 'unauthorised', payload: null})
    return
  }

  if ( req.body && ( ! req.body.action ) ) {
    res.json({status: 'undefined', received : req.query})
    return
  }

  const {
    payload,
    docid,
    page,
    collId,
  } = req.body

  const notesData = JSON.parse(payload)

  try {
    await dbDriver.notesUpdate(
      docid,
      page,
      collId,
      notesData.textNotes,
      notesData.tableType,
      notesData.tableStatus
    )
    console.log(`Updated records for ${docid}_${page}_${collId} result: `+ new Date())
  } catch(err) {
    console.log(err.stack)
  }

  res.json({status:'Successful', payload: null})
})

app.post(CONFIG.api_base_url+'/text',
  experessJwt({
    secret: publickey,
    algorithms: ['ES256'],
    credentialsRequired: false,
  }),
  async (req, res) => {

  // req.user added by experessJwt
  const user = req?.user

  if ( !user ) {
    res.json({status: 'unauthorised', payload: null})
    return
  }

  // Path to tables
  const {
    tables_folder,
    tables_folder_override,
  } = global.CONFIG

  if ( req.body && ( ! req.body.action ) ){
    res.json({status: 'undefined', received : req.query})
    return
  }

  const {
    payload,
    docid,
    page,
    collId,
  } = req.body

  const folder_exists = await fs.stat( path.join(tables_folder_override, collId ))
    .then(() => true, () => false)

  if ( !folder_exists ) {
    await fs.mkdir( path.join(tables_folder_override, collId), { recursive: true })
  }

  const payloadParsed = JSON.parse(payload)
  const titleText = '<div class="headers"><div style="font-size:20px; font-weight:bold; white-space: normal;">'+
    cheerio.load(payloadParsed.tableTitle).text()+'</div></div>'

  const bodyText = payloadParsed.tableBody
  const start_body_index = bodyText.indexOf("<table")
  const last_body_index = bodyText.lastIndexOf("</table>");
  let body;

  if ( (start_body_index > -1) && (last_body_index > -1) ){
    body = bodyText.substring(start_body_index, last_body_index)+"</table>";
  } else {
    body = bodyText
  }

  const completeFile = '<html><body>'+titleText+body+'</body></html>'

  try {
    await fs.writeFile( path.join(tables_folder_override, collId, `${docid}_${page}.html`), completeFile )
    const textResponse = `Written replacement for: ${collId} // ${docid}_${page}.html`
    console.log(textResponse);
    res.json({
      status: 'success',
      data: textResponse,
    })
  } catch(err) {
    throw err;
  };
})

app.get(CONFIG.api_base_url+'/removeOverrideTable', async (req, res) => {
   // Path to tables
   const {
    tables_folder_override,
  } = global.CONFIG

  const {
    docid,
    page,
    collId,
  } = req.body

  if (
    (
      req.query &&
      docid &&
      page
    ) == false
  ) {
    return res.send({status: 'no changes'})
  }

  const pathToFile = path.join(tables_folder_override, collId, `${docid}_${page}.html`)
  const file_exists = await fs.stat(pathToFile)
    .then(() => true, () => false)

  if ( file_exists ) {
    try {
      await fs.unlink(pathToFile)
    } catch (err) {
      console.log(`REMOVED : ${pathToFile} Error: ${err}`);
      throw err;
    }
  }

  res.send({status: 'override removed'})
});

// * :-) where lives function classify?
app.get(CONFIG.api_base_url+'/classify', async (req, res) => {
  const {
    terms
  } = req?.query
  if(req.query && terms){
    console.log(terms)

    res.send({results: await classify(terms.split(","))})
  }
});

const getTable = async (req, res) => {
  // check if it is a get or a post
  const dataSource = query in req ?
    query
    : body in req ?
    body
    : null

  if (!dataSource) {
    return res.send({status: 'wrong parameters', query: dataSource})
  }
  const {
    docid,
    page,
    collId,
  } = dataSource
  try {
    if ( (dataSource && docid && page && collId) == false ) {
      return res.send({status: 'wrong parameters', query: dataSource})
    }
    const tableData = await readyTable(
      docid,
      page,
      collId,
      false
    )
    return res.send(tableData)
  } catch (err) {
    console.log(err)
    res.send({
      status: 'getTable: probably page out of bounds, or document does not exist',
      query: dataSource
    })
  }
}

app.get(CONFIG.api_base_url+'/getTable', getTable);
app.post(CONFIG.api_base_url+'/getTable', getTable);

app.post(CONFIG.api_base_url+'/saveAnnotation',
  experessJwt({
    secret: publickey,
    algorithms: ['ES256'],
    credentialsRequired: false,
  }),
  async (req, res) => {

  // req.user added by experessJwt
  const user = req?.user

  if ( !user ) {
    return res.json({status:'unauthorised', payload: null})
  }
  
  const {
    action,

    docid,
    page,
    collId,

    payload,
  } = req?.body

  if ( req.body && !action ){
    res.json({status: 'undefined', received : req.body})
    return
  }

  console.log(`Recording Annotation: ${docid}_${page}_${collId}`)

  const tid = await dbDriver.tidGet ( docid, page, collId )

  const annotationData = JSON.parse(payload)

  annotationData.annotations.forEach( (row) => {
    row.content = Array.isArray(row.content) ?
      row.content.reduce( (acc,item) => { acc[item] = true; return acc}, {})
      : row.content
    row.qualifiers = Array.isArray(row.qualifiers) ?
      row.qualifiers.reduce ( (acc,item) => { acc[item] = true; return acc}, {})
      : row.qualifiers
  })

  try {
    await dbDriver.annotationInsert( tid, {annotations: annotationData.annotations} )
  } catch (err) {
    console.log(err.stack)
  }
  res.json({status:"success", payload: ''})
});

app.put(CONFIG.api_base_url+'/table/updateReferences',
  experessJwt({
    secret: publickey,
    algorithms: ['ES256'],
    credentialsRequired: false,
  }),
  async (req, res) => {

  // req.user added by experessJwt
  const user = req?.user
  const userNameRequesting = user.sub
  debugger
  if ( !user ) {
    return res.json({status:'unauthorised', payload: null})
  }

  if ( !req.body ) {
    res.json({status: 'undefined', payload: 'check request data'})
    return
  }

  const {
    tid,
    pmid,
    doi,
    url,
  } = req?.body

  // Check user have permissions to update table
  const table = await dbDriver.tableGetByTid(tid);
  if ( userNameRequesting != table.user ) {
    res.json({status: 'unauthorised', payload: userNameRequesting + ' user is not allowed to update references'})
    return
  }

  try {
    const result = await dbDriver.tableReferencesUpdate(tid, pmid, doi, url);
  } catch (err) {
    console.log(err)
  }
  res.json({status: 'success', payload: 'update done'})
});

const prepareMetadata = (headerData, tableResults) => {

  if (!headerData.headers || headerData.headers.length < 1 || (!tableResults) ) {
    return {}
  }

  const _tableResults = tableResults.sort( (a,b) => a.row-b.row)
  const headerDataCopy = JSON.parse(JSON.stringify(headerData))

  headerDataCopy.headers.reverse()
  headerDataCopy.subs.reverse()

  let annotation_groups = headerDataCopy.headers.reduce(
      (acc,item,i) => {
        if ( headerDataCopy.subs[i]) {
          acc.temp.push(item)
        } else {
          acc.groups.push([...acc.temp,item].reverse());
          acc.temp = []
        };
        return acc
      }, {groups:[], temp: []})

  annotation_groups.groups[annotation_groups.groups.length-1] = [
    ...annotation_groups.groups[annotation_groups.groups.length-1],
    ...annotation_groups.temp
  ]
  annotation_groups = annotation_groups.groups.reverse()

  const grouped_headers = annotation_groups.reduce( (acc,group,i) => {
    const concepts = _tableResults.reduce( (cons,res,j)  => {
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
  }, {})

  let meta_concepts = Object.keys(grouped_headers).reduce( (mcon, group) => {
    const alreadyshown = []
    const lastConcept = ''

    mcon[group] = grouped_headers[group].reduce(
      (acc, concepts) => {
        const key = concepts.join()
        if ( !alreadyshown[key] ){
          alreadyshown[key] = true
          concepts = concepts.filter( b => b != undefined )

          if ( concepts[concepts.length-1] == lastConcept ){
            concepts = concepts.slice(concepts.length-2, 1)
          }

          acc.push( concepts )
        }

        return acc
      }, [])

    return mcon
  }, {})

  const unfoldConcepts = (concepts) => {
    const unfolded = concepts.reduce ( (stor, elm, i) => {
      for ( let e = 1; e <= elm.length; e++ ) {
        const partial_elm = elm.slice(0, e)
        const key = partial_elm.join()

        if ( stor.alreadyThere.includes(key) == false ){
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
    }, {})

  return meta_concepts
}

// * :-) not used?
const processAnnotationAndMetadata = async (docid, page, collId) => {
  const tabularData = await prepareAnnotationPreview(docid, page, collId, false)

  if (
    (
      tabularData.backAnnotation &&
      tabularData.backAnnotation.rows.length > 0 &&
      tabularData.backAnnotation.rows[0].annotation
    ) == false
  ) {
    throw new Error('invalid tabularData')
  }

  // .annotations.map( ann => { return {head: Object.keys(ann.content).join(";"), sub: ann.subAnnotation } })

  const tid = tabularData.backAnnotation.rows[0].tid

  let header_data = tabularData.backAnnotation.rows[0].annotation.map( ann => { return {head: [ann.content.split("@")[0]].join(";"), sub: ann.subAnnotation } })

  header_data = header_data.reduce( (acc, header,i) => {
                          acc.count[header.head] = acc.count[header.head] ? acc.count[header.head]+1 : 1;
                          acc.headers.push(header.head+"@"+acc.count[header.head]);
                          acc.subs.push(header.sub);
                          return acc;
                        }, {count:{},headers:[],subs:[]} )

  // * :-) not used?
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


  const headDATA = prepareMetadata(header_data, tabularData.result)

  const hedDatra = await processHeaders(headDATA)

  const metadata = Object.keys(hedDatra).map( (key) => {
    const cuis = hedDatra[key].labels.map( (label) => {return label.CUI} )

    return {
      concept: hedDatra[key].concept,
      concept_root: hedDatra[key].root,
      concept_source: '',
      cuis: cuis,
      cuis_selected: cuis.slice(0,2),
      istitle: false,
      labeller: 'suso',
      qualifiers: [''],
      qualifiers_selected: [''],
      tid: tid
    }
  })

  const result = await setMetadata(metadata)
}

// catch events from Authentication, JWT, etc
app.use(function (err, req, res, next) {
  if (err.code === 'permission_denied') {
    return res.status(403).json({status:'unauthorised', message:'Forbidden'});
  }
  // JWToken is valid?
  if (err.code === 'invalid_token') {
    return res.status(401).json({status:'unauthorised', message:'invalid token...'});
  }
  console.log(err)
  
  if (
    err.status && 
    (
      err.status == 'failed' ||
      err.status == 'unauthorised'
    )
  ) {
    return res.status(200).json(err);
  }

  return res.status(500).json({message: err.message});
});

const myShellScript = exec(`fuser -k ${CONFIG.api_port}/tcp`);

app.listen(CONFIG.api_port, '0.0.0.0', () => {
  console.log(`Table Tidier Server running on port ${
    CONFIG.api_port
  } with base: ${
    CONFIG.api_base_url
  }  :: ${new Date().toISOString()}`);
});

main();
