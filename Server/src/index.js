// Load config
import 'dotenv/config'
const CONFIG_PATH = process.env.CONFIG_PATH || process.cwd()
const GENERAL_CONFIG = require(CONFIG_PATH + '/config.json')

const fsClassic = require('fs');
const fs = require('fs/promises');
const path = require('path');
const exec = require('child_process').exec;
const axios = require('axios');
const {UMLSData} = require('./utils/umls');

const express = require('express');
// morgan, HTTP request logger middleware for node.js
const logger = require('morgan')
// multer, middleware for handling multipart/form-data
const multer = require('multer');
const bodyParser = require('body-parser');
const cors = require('cors');
const Cookies = require('cookies')
// JWT Authentication
// https://github.com/MichielDeMey/express-jwt-permissions
// https://github.com/auth0/express-jwt
const experessJwt = require('express-jwt');
const {getJwtFromCookie} = require('./utils/jwt-utils');

// DB driver
const pgDriver = require('./db/postgres-driver')({...GENERAL_CONFIG.db})
const dbDriver = require('./db/sniffer-driver')
dbDriver.addDriver(pgDriver)

// const csv = require('csv-parser');

// Import routes
import usersRoutes from './routes/users'
usersRoutes.addDriver(dbDriver)

// I want to access cheerio from everywhere.
const cheerio = require('cheerio');
global.cheerio = cheerio;

global.CONFIG = GENERAL_CONFIG
global.available_documents = {}
global.abs_index = []
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

// const privatekey = fsClassic.readFileSync('./certificates/private.pem')
const publickey = fsClassic.readFileSync('./certificates/public.pem')

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
} from "./table.js"
// configure table with dbDriver
tableDBDriverSet(dbDriver)
import generateMetamappers from './utils/metadata-mapper.js';

console.log("Loading MetaMap Docker Comms Module")
// import { metamap } from "./metamap.js"

console.log("Loading Tabuliser Module")
import { getFileResults } from "./tabuliser.js"

console.log("Loading Extra Functions")
// import ef from "./extra_functions.js"

console.log("Loading Search Module")
const easysearch = require('@sephir/easy-search')

console.log("Configuring Server")
const app = express();

app.use(Cookies.express())

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

app.get(global.CONFIG.api_base_url+'/', function(req,res){
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

app.post(global.CONFIG.api_base_url+'/tableUploader',
  experessJwt({
    secret: publickey,
    algorithms: ['ES256'],
    credentialsRequired: true,
    getToken: getJwtFromCookie,
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
    // let index, len;

    const results = []
    const {
      collection_id,
      username_uploader,
    } = req.body

    // check if table exists at collection
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
        // const extension = file_elements.pop()
        const baseFilename = file_elements.join('.')

        await fs.mkdir(path.join(tables_folder, collection_id), { recursive: true })

        await Promise.all(tables_html.map( async (table, t) => {
          const page = t+1
          const docid = baseFilename
          
          const newTable = await dbDriver.tableCreate({
            docid,
            page,
            user: username_uploader,
            collection_id,
            file_path: 'temporal name',
          })

          // Table Tidier File Name Format
          const newTableFilename = `${newTable.tid}-table-tidier.html`;
          const tableFileChangeName = dbDriver.tableFilePathUpdate(
            newTable.tid,
            newTableFilename
          )

          await fs.writeFile(
            path.join(tables_folder, collection_id, newTableFilename),
            table
          )
          // File Write and Table Change Name working in parallel
          await tableFileChangeName

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

let globalSearchIndex = {}

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

  // Get DB info
  // [
  //   {
  //     tid,
  //     file_path,
  //     other,
  //   },
  //   ...
  // ]
  const tablesInfo = await dbDriver.tablesSearchIndexInfo()
  // prepare files paths
  for (let info of tablesInfo) {
    const pathOverride = path.join(
      tables_folder_override,
      info.collection_id,
      info.file_path
    )

    // If file exists at tables_folder_override
    info.file_path = fs.access(pathOverride)
      .then(() => true, () => false) == true ?
        pathOverride
        // else path is in tables_folder
        : path.join(
          tables_folder,
          info.collection_id,
          info.file_path
        )
  }

  // Search index by DB info
  globalSearchIndex = await easysearch.indexFromDB(
    tablesInfo,
    {
      filePathFieldName: 'file_path',
      linkFieldName: 'tid',
    },
    true
  )
  // search index
  // globalSearchIndex = await easysearch.indexFolder(
  //   [
  //     ...tablesInFolder,
  //     ...tablesInFolderOverride
  //   ],
  //   true
  // )
}

// preinitialisation of components if needed.
async function main() {

  // search index rebuild/initialisation
  console.time('easySearch')
  await rebuildSearchIndex()
  console.timeEnd('easySearch')

  // UMLS Data buffer
  console.time('UMLSData')
  // eslint-disable-next-line no-unused-vars
  const umls_data_buffer = await UMLSData();
  console.timeEnd('UMLSData')

}

// * :-) check calls from ui
app.get(global.CONFIG.api_base_url+'/listDeletedTables', async (req,res) => {
  try {
    const items = await fs.readdir( tables_folder_deleted )
    res.send(items)
  } catch (err) {
    res.status(500).send('failed listing deleted tables:' + err)
  }
});

app.get(global.CONFIG.api_base_url+'/modifyCUIData', async (req, res) => {
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
app.get(global.CONFIG.api_base_url+'/cuiDeleteIndex', async (req, res) => {
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

app.get(global.CONFIG.api_base_url+'/getMetadataForCUI', async function(req,res){
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
      const done = await dbDriver.metadataSet({
        concept_source,
        concept_root,
        concept,
        cuis: cuis.join(';'),
        cuis_selected: cuis_selected.join(';'),
        qualifiers: qualifiers.join(';'),
        qualifiers_selected: qualifiers_selected.join(';'),
        istitle,
        labeller,
        tid
      })
      results.push(done);
      console.log('insert: '+key+' -- '+ new Date())
    } catch (err) {
      console.log(concept+' -- '+'insert failed: '+key+' -- ' + new Date() + ' ' + err)
    }
  }

  return results
}

app.post(global.CONFIG.api_base_url+'/metadata',
  experessJwt({
    secret: publickey,
    algorithms: ['ES256'],
    credentialsRequired: false,
    getToken: getJwtFromCookie,
  }),
  async (req, res) => {

  if ( req.body && ( ! req.body.action ) ){
    res.json({status: 'undefined', received: req.body})
    return
  }

  let {
    docid,
    page,
    collId,
    action,
    payload,
    // single table
    tid,
    // multiple tables
    tids,
  } = req.body

  // Prevent invalid chars error
  docid = decodeURIComponent(docid)

  // collection_id
  collId = parseInt(collId)
  // page
  page = parseInt(page)

  // req.user added by experessJwt
  const user = req?.user
  // username in user subject
  const username = user?.sub

  // parse tid
  tid = parseInt(tid)

  const collectionPermissions = await dbDriver.permissionsResourceGet('collections', user ? username : '')

  if (tid && Number.isInteger(tid) == true) {
    // get collId from tid
    const table = await dbDriver.tableGetByTid(tid)
    // If table not found?
    if (table == 'not found') {
      return res.json({status: 'not found', tid: tid})
    }
    collId = parseInt(table.collection_id)
  }

  const collection_data = await dbDriver.collectionGet(collId)
  // collection not found?
  if (collection_data == 'collection not found') {
    return res.json({status: 'collection not found', collId: collId})
  }

  if ( collectionPermissions.read.includes(collId) == false ) {
    return res.json({status: 'unauthorised', payload: null})
  }

  if (
    Number.isNaN(tid) == true ||
    tid === 'undefined' ||
    tid === 'null'
  ) {
    tid = await dbDriver.tidGet(
      docid,
      page,
      collId,
    )
  
    if (!tid || tid == 'not found') {
      return res.json({status: 'not found', data: 'table not found'})
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

app.post(global.CONFIG.api_base_url+'/cuis', async (req, res) => {

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
        path.join(
          tables_folder_override,
          entry.collection_id,
          entry.file_path
        )
      ).then(() => true, () => false)

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
          tid: parseInt(entry.tid),
          docid: entry.docid,
          page: entry.page,
          collection_id: parseInt(entry.collection_id),
          doi: entry.doi || '',
          pmid: entry.pmid || '',
          url: entry.url || '',
          annotations: {
            notes: entry.notes ?? '',
            tableType: entry.tableType ?? '',
            completion: entry.completion ?? '',
          },
          tableResults: table_res
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
app.post(global.CONFIG.api_base_url+'/collections',
  experessJwt({
    secret: publickey,
    algorithms: ['ES256'],
    credentialsRequired: false,
    getToken: getJwtFromCookie,
  }),
  async (req, res) => {

  if ( req.body && ( ! req.body.action ) ){
    res.json({status: 'undefined', received: req.query})
    return
  }

  let {
    action,

    collection_id,
    collectionData,

    tid,
    target,
  } = req.body

  // collection_id as number
  collection_id = parseInt(collection_id)

  // req.user added by experessJwt
  const user = req?.user
  // username in user subject
  const username = user?.sub
  const collectionPermissions = await dbDriver.permissionsResourceGet('collections', user ? username : '')

  // Guest can see collections
  let response = {status: 'failed'}
  let result;
  const responseUnauthorised = () => ({
    status: 'unauthorised',
    description: 'collection is private',
    payload: req.body
  })

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
      if (!collection_id == true) {
        response = {
          status: 'failed',
          description: 'Collection id not valid',
          collId: collection_id,
        }
        break;
      }
      result = await dbDriver.collectionGet(collection_id);

      if (result == 'collection not found') {
        response = {
          status: result,
          collId: collection_id,
        }
        break;
      }

      if (collectionPermissions.read.includes(collection_id) == false ) {
        response = responseUnauthorised()
        break;
      }

      result.permissions = {
        read: collectionPermissions.read.includes(collection_id),
        write: collectionPermissions.write.includes(collection_id)
      }

      response = {status: 'success', data: result}
      break;

    case 'delete':
      if (collectionPermissions.read.includes(collection_id) == false ){
        response = responseUnauthorised()
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
        response = responseUnauthorised()
        break;
      }
      result = await dbDriver.collectionEdit(
        JSON.parse( collectionData )
      );
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
      switch (target.toLowerCase()) {
        case 'results':
          // data csv
          // ! :-) remove comments when ok with download csv
          // const annotations = await dbDriver.annotationByIDGet(docid, page, collId)
          // result = await dbDriver.annotationDataGet(tids)
          // result = await dbDriver.resultsDataGet( tids );
          result = await getResultsRefreshed( tids )
          break;
        case 'metadata':
          // metadata csv
          result = await dbDriver.metadataGet( tids );
          break;
        default:
          // data & metadata json
          // Default Action.
          const result_res = await getResultsRefreshed( tids )
          const result_met = await dbDriver.metadataGet( tids );
          // Add metadata and metadataMapper fields to each table data
          result_res.forEach(table => {
            table.metadata = []
          })
          // use this map tid to index to move metadata from result_met to table
          const resultMapTidToIndex = result_res.reduce(
            (prev, table, index) => {
              prev.set(parseInt(table.tid), index)
              return prev
            },
            new Map()
          )
          // move each metadata to result_res
          result_met.forEach(metadata => {
            const tid = metadata.tid
            // remove tid from data
            delete metadata.tid
            // Access table tid info
            const tableTid = result_res[resultMapTidToIndex.get(tid)]
            // link concept to metadata by index
            tableTid.metadata.push(metadata)
          })

          result_res.forEach(table => {
            const { concMapper, posiMapper } = generateMetamappers(table)
            table.concMapper = concMapper
            table.posiMapper = posiMapper
          })

          result = result_res
          break;
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

const tableTidListCheckIfInTargetCollection = async (list, collectionId) => {
  let tables = await Promise.all(list.map( tableTid => dbDriver.tableGet(tableTid) ))
  return Promise.all(tables.map(table => dbDriver.tableGet(
    table.docid,
    table.page,
    collectionId,
  )))
}

app.post(global.CONFIG.api_base_url+'/tables',
  experessJwt({
    secret: publickey,
    algorithms: ['ES256'],
    credentialsRequired: false,
    getToken: getJwtFromCookie,
  }),
  async (req, res) => {

  if ( req.body && ( ! req.body.action ) ){
    return res.json({status: 'undefined', received : req.query})
  }

  const {
    action,
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
    case 'remove':
      if ( collectionPermissions.write.includes(collection_id) == false ) {
        res.json({status: 'FAIL', payload: 'do not have permissions on collection'})
        return
      }

      // Check if it is a table id
      // Is it a number?
      if (/^\d+$/.test(tablesList[0]) == true) {
        result = await dbDriver.tablesRemoveByTid(tablesList);
        break;
      }

      result = await dbDriver.tablesRemove(tablesList, collection_id);
      break;
    case 'copy':
      if ( collectionPermissions.write.includes(targetCollectionID) == false ) {
        res.json({status: 'FAIL', payload: 'do not have permissions on destination'})
        return
      }

      // eslint-disable-next-line no-case-declarations
      const tableSourceInfo = await Promise.all(
        tablesList.map(tid => dbDriver.tableGetByTid(parseInt(tid))))

      // Copy tables
      // eslint-disable-next-line no-case-declarations
      let copyResult = await Promise.all(tableSourceInfo.map(async (table) => {
        // Check table collection source has read permission
        if (collectionPermissions.read.includes(table['collection_id']) == false ) {
          return {
            table: table.tid,
            status: 'error',
            error: 'unauthorized, table belongs to private collection'
          }
        }
        const result = await dbDriver.tableCopy(
          table.tid,
          targetCollectionID,
          username
        );
        return {
          table: result.tid,
          status: 'success',
        }
      }))

      return res.json({
        status: 'success',
        data: copyResult,
      })
      break;

    case 'move':
      if ( collectionPermissions.write.includes(targetCollectionID) == false ) {
        res.json({status: 'FAIL', payload: 'do not have permissions on destination'})
        return
      }

      // eslint-disable-next-line no-case-declarations
      const tablesFoundAtCollectionReducer = (prev, table, index) => {
        typeof table == 'string' && table == 'not found'?
          prev.moved.push(tablesList[index])
          : prev.existAtCollection.push(tablesList[index]);
        return prev;
      }
      // eslint-disable-next-line no-case-declarations
      let payload

      // Check if it is a table id
      // Is it a number?
      if (/^\d+$/.test(tablesList[0]) == true) {
        result = await tableTidListCheckIfInTargetCollection(tablesList, targetCollectionID);
        payload = result.reduce(tablesFoundAtCollectionReducer, {moved:[], existAtCollection:[]});
        result = await dbDriver.tablesMoveByTid(payload.moved, collection_id, targetCollectionID);
      } else {
        // check if table exist at collection
        result = await docidListCheckIfInTargetCollection(tablesList, targetCollectionID);
        payload = result.reduce(tablesFoundAtCollectionReducer, {moved:[], existAtCollection:[]});
        result = await dbDriver.tablesMove(payload.moved, collection_id, targetCollectionID);
      }

      return res.json({
        status: 'success',
        data: payload,
      })
    case 'list':  // This is the same as not doing anything and returning the collection and its tables.
    default:
  }
  // Always return the updated collection details
  result = await dbDriver.collectionGet(collection_id);
  res.json({status: 'success', data: result})
});

app.post(global.CONFIG.api_base_url+'/search',
  experessJwt({
    secret: publickey,
    algorithms: ['ES256'],
    credentialsRequired: false,
    getToken: getJwtFromCookie,
  }),
  async (req, res) => {

  const {
    searchContent,
  } = req.body
  // var type = JSON.parse(req.body.searchType)

  // req.user added by experessJwt
  const user = req?.user
  // username in user subject
  const username = user?.sub
  const collectionPermissions = await dbDriver.permissionsResourceGet('collections', user ? username : '')

  // Search index
  let search_results = easysearch.search( globalSearchIndex, searchContent)

  search_results = search_results.filter(
    (elm) => collectionPermissions.read.includes(
      // Extract collection id from path.
      // Example: 1 from 'HTML_TABLES/1/20463178_2.html'
      parseInt(elm.info.collection_id)
    )
  )

  // Get search items/words
  // Filter by size and it does not contain spaces
  const metadataSearchItemsWords = searchContent.split(' ')
    .filter(word => word.length > 2 && word.includes(' ') == false)

  // Search metadata at DB for each search item/'word'
  const metadataSearchItems = await Promise.all(
    metadataSearchItemsWords.map(word => dbDriver.searchMetadata(word))
  )

  let metadataSearchByTableId = {}

  // For each search item/word metadata from DB search,
  // Generate an object map of tables id with scores
  //   each searchItem/word matched = 10 points
  //   each metadata matched = 1 point
  metadataSearchItems.forEach((metadataSearch, index) => {
    const searchItem = metadataSearchItemsWords[index]
    for (let metadata of Object.keys(metadataSearch)) {
      for (let table of metadataSearch[metadata]) {
        const tid = table.tid
        // metadataSearch[metadata]
        // if table already added to metadataSearchByTableId
        if (metadataSearchByTableId[tid]) {
          // increase score +1
          metadataSearchByTableId[tid].score += 1
          // add metadata if not present
          if (metadataSearchByTableId[tid].metadata.includes(metadata) == false ) {
            metadataSearchByTableId[tid].metadata.push(metadata)
          }
          // Add searchItem if not present
          if (metadataSearchByTableId[tid].searchItems.includes(searchItem) == false ) {
            // Add 10 points to the score
            metadataSearchByTableId[tid].score += 10
            metadataSearchByTableId[tid].searchItems.push(searchItem)
          }
          // next table
          continue
        }

        // Add table to metadataSearchByTableId
        metadataSearchByTableId[tid] = {
          doc: tid,
          // get info from easysearch index
          info: globalSearchIndex.doc_info[tid],
          // initial score
          score: 11,
          // get doc chunks from easysearch index
          // limit number of chucks to length 10 
          selectedChunks: globalSearchIndex.doc_chunks[tid].slice(0, 10),
          metadata: [metadata],
          searchItems: [searchItem]
        }
      }
    }
  })


  if (Object.keys(metadataSearchByTableId).length > 0) {
    // sort metadata by score and tid
    let sortedArray = Object.keys(metadataSearchByTableId)
      .map(tid => metadataSearchByTableId[tid])
      .sort((a, b) => {
        if (a.score === b.score){
          return parseInt(a.doc) > parseInt(b.doc) ? -1 : 1
        } else {
          return a.score > b.score ? -1 : 1
        }
      })

    // if table is duplicated at search index and metadata
    // remove table duplicate from search index
    Object.keys(metadataSearchByTableId).forEach(tid => {
      const indexTid = search_results.findIndex(table => table.doc == tid)
      // if it is not duplicated check next
      if (indexTid < 0) {
        return
      }
      // remove duplicated table
      search_results.splice(indexTid, 1);
    })

    return res.json({
      search_results,
      metadata: sortedArray,
    })
  }

  // remove extension
  // search_results.forEach( elm => elm.doc = elm.doc.replace('.html', '') )

  console.log(`SEARCH: ${search_results.length} for ${searchContent}`)

  // if ( search_results.length > 100){
  //   search_results = search_results.slice(0,100)
  // }
  
  res.json({search_results})
});

app.post(global.CONFIG.api_base_url+'/getTableContent',
  experessJwt({
    secret: publickey,
    algorithms: ['ES256'],
    credentialsRequired: false,
    getToken: getJwtFromCookie,
  }),
  async (req, res) => {
  
  let {
    enablePrediction,
    docid,
    page,
    collId,
    tid,
  } = req.body

  // Prevent invalid chars error
  docid = decodeURIComponent(docid)

  // collId as integer
  collId = parseInt(collId)

  // req.user added by experessJwt
  const user = req?.user
  // username in user subject
  const username = user?.sub
  // parse tid
  tid = parseInt(tid)
  let table = null

  const collectionPermissions = await dbDriver.permissionsResourceGet('collections', user ? username : '')

  if (tid && Number.isInteger(tid) == true) {
    // get collId from tid
    table = await dbDriver.tableGetByTid(tid)
    // If table not found?
    if (table == 'not found') {
      return res.json({status: 'not found', tid: tid})
    }
    collId = parseInt(table.collection_id);
    ({docid, page} = table)
  }

  const collection_data = await dbDriver.collectionGet(collId)
  // collection not found?
  if (collection_data == 'collection not found') {
    return res.json({status: 'collection not found', collId: collId})
  }

  if ( collectionPermissions.read.includes(collId) == false ){
    return res.json({status: 'unauthorised', body: req.body})
  }

  if ((docid && page && collId) == false) {
    return res.json({status: 'wrong parameters', body: req.body})
  }

  if (!table) {
    table = await dbDriver.tableGet(docid, page, collId)
  }

  try {
    const predictionEnabled = JSON.parse(enablePrediction)

    let tableData = readyTable(
      table.file_path,
      collId,
      // predictions
      predictionEnabled
    )

    let annotation = await dbDriver.annotationJoinTableGet(table.tid)

    tableData = await tableData

    // mapped the old terms (eg characteristic_level) over to the new (eg characteristic)
    // ## table structure elements
    // outcomes = outcomes
    // arms = arms (main exposure)
    // measures = measures
    // time/period = times
    // p-interaction - statistics
    // characteristic_name = characteristics (features)
    // characteristic_level = characteristics (features)

    // this terms are also defined at UI in component TableAnnotatorItem

    const autoAnnotationMapTerms = {
      outcomes: 'outcomes',
      arms: 'arms',
      measures: 'measures',
      'time/period': 'times',
      'p-interaction': 'statistics',
      'characteristic_name': 'characteristics',
      'characteristic_level': 'characteristics',
    }

    // map columns
    if (tableData.predictedAnnotation.cols) {
      // mapped the old terms (eg characteristic_level) over to the new
      tableData.predictedAnnotation.cols = tableData.predictedAnnotation.cols.map(
        annotation => ({
          ...annotation,
          descriptors: annotation.descriptors.map(
            descriptor => autoAnnotationMapTerms[descriptor]
          ),
        })
      )
    }
    
    // map rows
    if (tableData.predictedAnnotation.rows) {
      // mapped the old terms (eg characteristic_level) over to the new
      tableData.predictedAnnotation.rows = tableData.predictedAnnotation.rows.map(
        annotation => ({
          ...annotation,
          descriptors: annotation.descriptors.map(
            descriptor => autoAnnotationMapTerms[descriptor]
          ),
        })
      )
    }

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
            // file_path: table.file_path,
            notes: '',
            page,
            tableType: '',
            tid: tableData.collectionData.tables.filter(
              table => table.docid == docid && table.page == page
            )[0].tid,
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

app.get(global.CONFIG.api_base_url+'/cuiRecommend', async function(req,res){
  const cuiRecommend = await getRecommendedCUIS()
  res.send( cuiRecommend )
});

const prepareAnnotationPreview = async (tid, cachedOnly) => {
   // Path to tables
   const {
    tables_folder,
    tables_folder_override,
  } = global.CONFIG

  const annotations = await dbDriver.annotationJoinTableGet(tid)

  if ( !annotations ) {
    return {state: 'fail', result: []}
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
app.post(global.CONFIG.api_base_url+'/annotationPreview',
  experessJwt({
    secret: publickey,
    algorithms: ['ES256'],
    credentialsRequired: false,
    getToken: getJwtFromCookie,
  }),
  async (req, res) => {

  let {
    docid,
    page,
    collId,
    tid,
    cachedOnly,
  } = req.body

  // Prevent invalid chars error
  docid = decodeURIComponent(docid)

  // collId as integer
  collId = parseInt(collId)

  // parse tid
  tid = parseInt(tid)

  // req.user added by experessJwt
  const user = req?.user
  // username in user subject
  const username = user?.sub

  const collectionPermissions = await dbDriver.permissionsResourceGet('collections', user ? username : '')

  if (tid && Number.isInteger(tid) == true) {
    // get collId from tid
    const table = await dbDriver.tableGetByTid(tid)
    // If table not found?
    if (table == 'not found') {
      return res.json({status: 'not found', tid: tid})
    }
    collId = parseInt(table.collection_id);
    ({docid, page} = table)
  }

  const collection_data = await dbDriver.collectionGet(collId)
  // collection not found?
  if (collection_data == 'collection not found') {
    return res.json({status: 'collection not found', collId: collId})
  }

  if ( collectionPermissions.read.includes(collId) == false ) {
    return res.json({status: 'unauthorised',})
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

    res.json(await prepareAnnotationPreview(tid, cachedOnly))
  } catch (err) {
    console.log(err)
    res.json({
      status: 'annotationPreview: probably page out of bounds, or document does not exist',
      body: req.body
    })
  }
  // res.json( {"state" : "reached end", result : []} )
});

// Returns all annotations for all document/tables.
app.get(global.CONFIG.api_base_url+'/formattedResults', async function (req, res){
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
        }
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
app.post(global.CONFIG.api_base_url+'/auto', async (req, res) => {
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

app.get(global.CONFIG.api_base_url+'/getMMatch',async (req, res) => {
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

app.post(global.CONFIG.api_base_url+'/notes',
  experessJwt({
    secret: publickey,
    algorithms: ['ES256'],
    credentialsRequired: false,
    getToken: getJwtFromCookie,
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

  let {
    payload,
    page,
    collId,
    tid,
  } = req.body

  // Prevent invalid chars error
  let docid = decodeURIComponent(req.body.docid)
  // parse tid
  tid = parseInt(tid)

  if (tid && Number.isInteger(tid) == true) {
    // get collId from tid
    const table = await dbDriver.tableGetByTid(tid)
    // If table not found?
    if (table == 'not found') {
      return res.json({status: 'not found', tid: tid})
    }
    collId = parseInt(table.collection_id);
    ({docid, page} = table)
  }

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

app.post(global.CONFIG.api_base_url+'/text',
  experessJwt({
    secret: publickey,
    algorithms: ['ES256'],
    credentialsRequired: false,
    getToken: getJwtFromCookie,
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

  let {
    payload,
    page,
    collId,
    tid,
  } = req.body

  // Prevent invalid chars error
  let docid = decodeURIComponent(req.body.docid)
  // parse tid
  tid = parseInt(tid)
  let table = null

  if (tid && Number.isInteger(tid) == true) {
    // get collId from tid
    table = await dbDriver.tableGetByTid(tid)
    // If table not found?
    if (table == 'not found') {
      return res.json({status: 'not found', tid: tid})
    }
    collId = parseInt(table.collection_id);
    ({docid, page} = table)
  }

  if (!table) {
    table = await dbDriver.tableGet(docid, page, collId)
  }

  const folder_exists = await fs.stat(
      path.join(
        tables_folder_override,
        table.file_path
      )
    )
    .then(() => true, () => false)

  // If folder don't exists create collection folder
  if ( !folder_exists ) {
    await fs.mkdir(
      path.join(tables_folder_override, collId.toString()),
      { recursive: true }
    )
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
    await fs.writeFile(
      path.join(
        tables_folder_override,
        collId.toString(),
        table.file_path
      ),
      completeFile
    )
    const textResponse = `Written replacement for: ${collId} // ${docid}_${page}.html`
    console.log(textResponse);
    res.json({
      status: 'success',
      data: textResponse,
    })
  } catch(err) {
    console.log(err)
  }
})

app.get(global.CONFIG.api_base_url+'/removeOverrideTable', async (req, res) => {
   // Path to tables
   const {
    tables_folder_override,
  } = global.CONFIG

  let {
    page,
    collId,
    tid,
  } = req.body

  // Prevent invalid chars error
  let docid = decodeURIComponent(req.body.docid)
  // parse tid
  tid = parseInt(tid)
  let table = null

  if (tid && Number.isInteger(tid) == true) {
    // get collId from tid
    table = await dbDriver.tableGetByTid(tid)
    // If table not found?
    if (table == 'not found') {
      return res.json({status: 'not found', tid: tid})
    }
    collId = parseInt(table.collection_id);
    ({docid, page} = table)
  }

  if (
    (
      req.query &&
      docid &&
      page
    ) == false
  ) {
    return res.send({status: 'no changes'})
  }

  if (!table) {
    table = await dbDriver.tableGet(docid, page, collId)
  }

  const pathToFile = path.join(
    tables_folder_override,
    collId.toString(),
    table.file_path
  )
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
app.get(global.CONFIG.api_base_url+'/classify', async (req, res) => {
  const {
    terms=null,
  } = req?.query || {}

  if(req.query && terms) {
    console.log(terms)

    res.send({results: await classify(terms.split(","))})
  }
});

const getTable = async (req, res) => {
  // check if it is a get or a post
  const dataSource = 'query' in req ?
    req.query
    : 'body' in req ?
    req.body
    : null

  if (!dataSource) {
    return res.send({status: 'wrong parameters', query: dataSource})
  }

  let {
    page,
    collId,
    tid,
  } = dataSource

  // Prevent invalid chars error
  let docid = decodeURIComponent(req.body.docid)
  // parse tid
  tid = parseInt(tid)
  let table = null

  if (tid && Number.isInteger(tid) == true) {
    // get collId from tid
    table = await dbDriver.tableGetByTid(tid)
    // If table not found?
    if (table == 'not found') {
      return res.json({status: 'not found', tid: tid})
    }
    collId = parseInt(table.collection_id);
    ({docid, page} = table)
  }

  try {
    if ( (dataSource && docid && page && collId) == false ) {
      return res.send({status: 'wrong parameters', query: dataSource})
    }

    if (!table) {
      table = await dbDriver.tableGet(docid, page, collId)
    }

    const tableData = await readyTable(
      table.file_path,
      collId,
      // false, predictions are disabled.
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

app.get(global.CONFIG.api_base_url+'/getTable', getTable);
app.post(global.CONFIG.api_base_url+'/getTable', getTable);

app.post(global.CONFIG.api_base_url+'/saveAnnotation',
  experessJwt({
    secret: publickey,
    algorithms: ['ES256'],
    credentialsRequired: false,
    getToken: getJwtFromCookie,
  }),
  async (req, res) => {

  // req.user added by experessJwt
  const user = req?.user

  if ( !user ) {
    return res.json({status:'unauthorised', payload: null})
  }
  
  let {
    action,
    page,
    collId,
    payload,
    tid=undefined,
  } = req?.body || {}

  // Prevent invalid chars error
  let docid = decodeURIComponent(req.body.docid)
  // parse tid
  tid = parseInt(tid)

  if (tid && Number.isInteger(tid) == true) {
    // get collId from tid
    const table = await dbDriver.tableGetByTid(tid)
    // If table not found?
    if (table == 'not found') {
      return res.json({status: 'not found', tid: tid})
    }
    collId = parseInt(table.collection_id);
    ({docid, page} = table)
  } else {
    tid = await dbDriver.tidGet( docid, page, collId )
  }

  if ( req.body && !action ){
    res.json({status: 'undefined', received : req.body})
    return
  }

  console.log(`Recording Annotation: ${docid}_${page}_${collId}`)

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

app.put(global.CONFIG.api_base_url+'/table/updateReferences',
  experessJwt({
    secret: publickey,
    algorithms: ['ES256'],
    credentialsRequired: false,
    getToken: getJwtFromCookie,
  }),
  async (req, res) => {

  // req.user added by experessJwt
  const user = req?.user
  const userNameRequesting = user.sub

  if ( !user ) {
    return res.json({status:'unauthorised', payload: null})
  }

  if ( !req.body ) {
    res.json({status: 'undefined', payload: 'check request data'})
    return
  }

  let {
    tid,
    pmid,
    doi,
    url,
  } = req?.body || {}
  // parse tid
  tid = parseInt(tid)

  // Check user have permissions to update table
  const table = await dbDriver.tableGetByTid(tid);
  if ( userNameRequesting != table.user ) {
    res.json({status: 'unauthorised', payload: userNameRequesting + ' user is not allowed to update references'})
    return
  }

  try {
    const result = await dbDriver.tableReferencesUpdate(tid, pmid, doi, url);

    // Update table info at search index info (globalSearchIndex)
    globalSearchIndex.doc_info[tid].pmid = pmid
    globalSearchIndex.doc_info[tid].doi = doi
    globalSearchIndex.doc_info[tid].url = url

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
        }
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

app.listen(global.CONFIG.api_port, '0.0.0.0', () => {
  console.log(`Table Tidier Server running on port ${
    global.CONFIG.api_port
  } with base: ${
    global.CONFIG.api_base_url
  }  :: ${new Date().toISOString()}`);
});

main();
