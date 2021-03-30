var express = require('express');

var bodyParser = require('body-parser');
var html = require("html");

var request = require("request");

var multer = require('multer');

const fs = require('fs');
const path = require('path');

const { Pool, Client, Query } = require('pg')

const csv = require('csv-parser');
const CsvReadableStream = require('csv-reader');



//NODE R CONFIGURATION.
const R = require("r-script");


var cors = require('cors');

// I want to access cheerio from everywhere.
global.cheerio = require('cheerio');
global.CONFIG = require('./config.json')

global.available_documents = {}
global.abs_index = []
global.tables_folder = "HTML_TABLES"
global.tables_folder_override = "HTML_TABLES_OVERRIDE"
global.tables_folder_deleted = "HTML_TABLES_DELETED"
global.cssFolder = "HTML_STYLES"
global.DOCS = [];
global.msh_categories = {catIndex: {}, allcats: [], pmids_w_cat: []}
global.PRED_METHOD = "grouped_predictor"

global.umls_data_buffer = {};

// TTidier subsystems load.
console.log("Loading Files Management")
import {refreshDocuments} from "./files.js"

console.log("Loading Security")
import passport, {initialiseUsers, createUser, getUserHash}  from "./security.js"

console.log("Loading Table Libs")
import { readyTable, prepareAvailableDocuments } from "./table.js"

console.log("Loading MetaMap Docker Comms Module")
import { metamap } from "./metamap.js"

console.log("Loading Extra Functions")
import ef from "./extra_functions.js"

console.log("Loading Search Module")
var easysearch = require('@sephir/easy-search')

console.log("Configuring DB client: Postgres")
// Postgres configuration.
global.pool = new Pool({
    user: CONFIG.db.user,
    host: CONFIG.db.createUserhost,
    database: CONFIG.db.database,
    password: CONFIG.db.password,
    port: CONFIG.db.port,
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

app.post(CONFIG.api_base_url+'/login', function(req, res, next) {
  passport.authenticate('custom', function(err, user, info) {
    // console.log("login_req",JSON.stringify(req))
    if ( err ){
      res.json({status:"failed", payload: null})
    } else if ( !user ) {
      res.json({status:"unauthorised", payload: null})
    } else {
      res.json({status:"success", payload: user})
    }

    })(req, res, next)
  });

app.post(CONFIG.api_base_url+'/createUser', async function(req, res) {
  debugger
  var result;
  try{
    debugger
    result = await createUser(req.body)
    res.json({status:"success", payload: result })
  } catch (e){
    res.json({status:"failed", payload: "" })
  }

});


// const storage = multer.memoryStorage();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname )
  }
})

const moveFileToCollection = (filedata, coll) => {

  var tables_folder_target = (coll.indexOf("delete") > -1 ? global.tables_folder_deleted : global.tables_folder)
  fs.mkdirSync(path.join(tables_folder_target, coll), { recursive: true })
  fs.renameSync( filedata.path, path.join(tables_folder_target, coll, filedata.originalname) );

}

app.get("/api/test", function(req,res){
  res.send("here we are")
})

app.post(CONFIG.api_base_url+'/tableUploader', async function(req, res) {

 let upload = multer({ storage: storage }).array('fileNames');

 upload(req, res, async function(err) {

     const files = req.files;
     let index, len;

     var results = []

     // Loop through all the uploaded files and return names to frontend
     for (index = 0, len = files.length; index < len; ++index) {
       try{
         moveFileToCollection(files[index], req.body.collection_id )
         // var [docid, page] = files[index].originalname.split(".")[0].split("_")

         var file_elements = files[index].originalname.split(".")

         var extension = file_elements.pop()

             file_elements = file_elements.join(".").split("_")

         var page = file_elements.pop()
         var docid = file_elements.join("_")

         // debugger
         await createTable(docid,page,req.body.username_uploader,req.body.collection_id,files[index].originalname)
         results.push({filename: files[index].originalname, status:"success"})

       } catch(err){
         console.log("file: " + files[index].originalname + " failed to process")
         results.push({filename: files[index].originalname, status:"failed"})
       }
     }

     res.send(results);
 });

});

async function UMLSData(){

      var semtypes = new Promise( (resolve,reject) =>{

          let inputStream = fs.createReadStream(CONFIG.system_path+ "Tools/metamap_api/"+'cui_def.csv', 'utf8');

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

      semtypes = await semtypes

      var cui_def = new Promise( (resolve,reject) =>{

          let inputStream = fs.createReadStream(CONFIG.system_path+ "Tools/metamap_api/"+'cui_def.csv', 'utf8');

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

      cui_def = await cui_def


      var cui_concept = new Promise( (resolve,reject) =>{

          let inputStream = fs.createReadStream(CONFIG.system_path+ "Tools/metamap_api/"+'cui_concept.csv', 'utf8');

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

      cui_concept = await cui_concept

      return {semtypes, cui_def, cui_concept}
}

async function CUIData (){

    var umlsData = await UMLSData();

    var results = await getAnnotationResults()

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


// Gets the labellers associated w ith each document/table.
async function getMetadataLabellers(){

  var client = await pool.connect()
  var result = await client.query(`select distinct docid, page, labeller from metadata`)
        client.release()

  return result
}

// Returns the annotation for a single document/table
async function getAnnotationByID(docid,page,collId){

  if ( docid == "undefined" || page == "undefined" || collId == "undefined" ){
    return {rows:[]}
  }

  var client = await pool.connect()
  var result = await client.query(`
    SELECT docid, page, "user", notes, collection_id, file_path, "tableType", "table".tid, completion, annotation
    FROM "table"
    LEFT JOIN annotations
    ON  "table".tid = annotations.tid
    WHERE docid=$1 AND page=$2 AND collection_id = $3 `,[docid,page,collId])
  client.release()

  return result
}

const rebuildSearchIndex = async () => {
  var tables = fs.readdirSync(path.join(global.tables_folder)).map( (dir) => path.join(global.tables_folder,dir))
  var tables_folder_override = fs.readdirSync(path.join(global.tables_folder_override)).map( (dir) => path.join(global.tables_folder_override,dir))
  global.searchIndex = await easysearch.indexFolder( [...tables, ...tables_folder_override] )
}

const tabularFromAnnotation = async ( annotation ) => {

  if ( annotation.rows.length < 1 ){ // annotation not there
    return
  }
  annotation = annotation.rows[0]
  const htmlFile = annotation.file_path

  //If an override file exists then use it!. Overrides are those produced by the editor.
  var file_exists = await fs.existsSync( path.join(global.tables_folder_override, annotation.collection_id, htmlFile) )

  var htmlFolder = path.join(global.tables_folder, annotation.collection_id)
  if ( file_exists ) {
    htmlFolder = path.join(global.tables_folder_override, annotation.collection_id) //"HTML_TABLES_OVERRIDE/"
  }


  try {
    fs.readFile(path.join(htmlFolder,htmlFile),
                "utf8",
                function(err, data) {
                  var ann = annotation
                  var tablePage = cheerio.load(data);

                  var tableData = tablePage("tr").get().map( (row) => {
                    var rowValues = cheerio(row).children().get().map(
                      (i,e) => {
                        return {
                          text : cheerio(i).text(),
                          isIndent : (cheerio(i).find('.indent1').length + cheerio(i).find('.indent2').length + cheerio(i).find('.indent3').length + cheerio(i).find('.indent').length) > 0,
                          isBold : (cheerio(i).find('.bold').length + cheerio(i).find('strong').length) > 0,
                          isItalic : (cheerio(i).find('em').length) > 0,
                        }
                      }
                    )
                    return rowValues
                  });

                  debugger

                })
  } catch (e){
    console.log(e)
    debugger
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

  // var annotation = await getAnnotationByID("11442551", 1, 1);
  // // var tableData = await readyTable("11442551", 1, 1, false)
  // await tabularFromAnnotation(annotation)
}



app.get(CONFIG.api_base_url+'/deleteTable', async function(req,res){

  if ( req.query && req.query.docid && req.query.page ){

    var filename = req.query.docid+"_"+req.query.page+".html"

    var delprom = new Promise(function(resolve, reject) {
        fs.rename( tables_folder+'/'+ filename , tables_folder_deleted+'/'+ filename , (err) => {
          if (err) { reject("failed")} ;
          console.log('Move complete : '+filename);
          resolve("done");
        });
    });

    await delprom;
    // await refreshDocuments();

    res.send("table deleted")
  } else {
    res.send("table not deleted")
  }

});

app.get(CONFIG.api_base_url+'/recoverTable', async function(req,res){
    if ( req.query && req.query.docid && req.query.page ){

      var filename = req.query.docid+"_"+req.query.page+".html"

      fs.rename( tables_folder_deleted+'/'+ filename , tables_folder+'/'+ filename , (err) => {
        if (err) throw err;
          console.log('Move complete : '+filename);
      });
    }

    res.send("table recovered")
});

app.get(CONFIG.api_base_url+'/listDeletedTables', async function(req,res){

  fs.readdir( tables_folder_deleted, function(err, items) {

    if (err) {
      res.send("failed listing "+err)
    } else {
      res.send(items)
    }

  });

});

app.get(CONFIG.api_base_url+'/modifyCUIData', async function(req,res){

  var modifyCUIData = async (cui, preferred, adminApproved, prevcui) => {
      var client = await pool.connect()

      var result = await client.query(`UPDATE cuis_index SET cui=$1, preferred=$2, admin_approved=$3 WHERE cui = $4`,
        [cui, preferred, adminApproved, prevcui] )

      if ( result && result.rowCount ){
        var q = new Query(`UPDATE metadata SET cuis = array_to_string(array_replace(regexp_split_to_array(cuis, ';'), $2, $1), ';'), cuis_selected = array_to_string(array_replace(regexp_split_to_array(cuis_selected, ';'), $2, $1), ';')`, [cui, prevcui])
        result = await client.query( q )
      }

      client.release()
      return result
  }

  if ( req.query && req.query.cui && req.query.preferred && req.query.adminApproved && req.query.prevcui ){
    var result = await modifyCUIData(req.query.cui, req.query.preferred, req.query.adminApproved, req.query.prevcui)
    res.send(result)
  } else {
    res.send("UPDATE failed");
  }

});

app.get(CONFIG.api_base_url+'/cuiDeleteIndex', async function(req,res){

  var cuiDeleteIndex = async (cui) => {
      var client = await pool.connect()

      var done = await client.query('delete from cuis_index where cui = $1', [cui ])
        .then(result => console.log("deleted: "+ new Date()))
        .catch(e => console.error(e.stack))
        .then(() => client.release())

  }

  if ( req.query && req.query.cui){
    await cuiDeleteIndex(req.query.cui)
    res.send("done")
  } else {
    res.send("clear failed");
  }

});

app.get(CONFIG.api_base_url+'/getMetadataForCUI', async function(req,res){

  var getCuiTables = async (cui) => {
      var client = await pool.connect()
      var result = await client.query(`select docid,page,"user" from metadata where cuis like $1 `, ["%"+cui+"%"])
            client.release()
      return result

  }

  if ( req.query && req.query.cui ){
    var meta = await getCuiTables(req.query.cui)
    res.send(meta)
  } else {
    res.send("clear failed");
  }

});


const clearMetadata = async (tid) => {
    var client = await pool.connect()

    var done = await client.query('DELETE FROM metadata WHERE tid = $1', [tid])
      .then(result => console.log("deleted: "+ new Date()))
      .catch(e => console.error(e.stack))
      .then(() => client.release())

}

const setMetadata = async ( metadata ) => {

  var results = []

  for ( var m = 0; m < Object.keys(metadata).length; m++){

      var key = Object.keys(metadata)[m]

      var client = await pool.connect()

      // debugger

      var done = await client.query(`
        INSERT INTO metadata(concept_source, concept_root, concept, cuis, cuis_selected, qualifiers, qualifiers_selected, istitle, labeller, tid)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (concept_source, concept_root, concept, tid)
        DO UPDATE SET cuis = $4, cuis_selected = $5, qualifiers = $6, qualifiers_selected = $7, istitle = $8, labeller = $9`,
                [ metadata[key].concept_source, metadata[key].concept_root, metadata[key].concept,
                  metadata[key].cuis.join(";"), metadata[key].cuis_selected.join(";"), metadata[key].qualifiers.join(";"), metadata[key].qualifiers_selected.join(";"),
                  metadata[key].istitle, metadata[key].labeller, metadata[key].tid ])

          .then(result => console.log("insert: "+key+" -- "+ new Date()))
          .catch(e => {
            debugger
            console.error(metadata[key].concept+" -- "+"insert failed: "+key+" -- "+ new Date())
          })
          .then(() => client.release())

      results.push(done);
  }

  return results
}

const getMetadata = async ( tids ) => {
  var client = await pool.connect()
  var result = await client.query(`SELECT * FROM metadata WHERE tid = ANY ($1)`,[tids])
        client.release()
  return result
}

// important. Use this to recover the table id (tid). tid is used as primary key in many tables. uniquely identifying tables across sql tables.
const getTid = async ( docid, page, collId ) => {

  if ( docid == "undefined" || page == "undefined" || collId == "undefined" ){
    return -1
  }

  var client = await pool.connect()
  var result = await client.query(`SELECT tid FROM public."table" WHERE docid = $1 AND page = $2 AND collection_id = $3`,[docid, page, collId])
        client.release()

  var tid

  if ( result.rows && result.rows.length > 0 ){
    tid = result.rows[0].tid
  }

  return tid
}

app.post(CONFIG.api_base_url+'/metadata', async function(req,res){
  // debugger
  if ( req.body && ( ! req.body.action ) ){
    res.json({status: "undefined", received : req.body})
    return
  }

  var validate_user = validateUser(req.body.username, req.body.hash);

  if ( validate_user ){

     // debugger
    var tid = req.body.tid
    if ( tid == "undefined" ){
      tid = await getTid( req.body.docid, req.body.page, req.body.collId )
    }

    var result = {};

    switch (req.body.action) {
      case "clear":
        result = await clearMetadata(tid)
        break;
      case "save":
        var metadata = JSON.parse(req.body.payload).metadata
        result = await setMetadata(metadata)
        break;
      case "get":
        result = (await getMetadata([tid])).rows //req.body.docid, req.body.page, req.body.collId,
        break;
      case "get_multiple":
        result = (await getMetadata(req.body.tids)).rows //req.body.docid, req.body.page, req.body.collId,
        break;
        // debugger

      default:
    }
    // Always return the updated collection details
    // result = await getCollection(req.body.collection_id);
    res.json({status: "success", data: result})
  } else {
    res.json({status:"unauthorised", payload: null})
  }

});


const getCUISIndex = async () => {

  var cuis = {}

  var client = await pool.connect()
  var result = await client.query(`select * from cuis_index ORDER BY preferred ASC`)
        client.release()

  result.rows.map( row => {
    cuis[row.cui] = {preferred : row.preferred, hasMSH: row.hasMSH, userDefined: row.user_defined, adminApproved: row.admin_approved}
  })

  return cuis
}


app.post(CONFIG.api_base_url+'/cuis', async function(req,res){

  if ( req.body && ( ! req.body.action ) ){
    res.json({status: "undefined", received : req.body})
    return
  }

  var validate_user = validateUser(req.body.username, req.body.hash);

  if ( validate_user ){

    var result = {};

    switch (req.body.action) {
      // case "clear":
      //   result = await clearMetadata(tid)
      //   break;
      // case "set":
      //   result = await setMetadata(req.body.docid, req.body.page, req.body.concept,
      //                              req.body.cuis || "",
      //                              req.body.qualifiers || "",
      //                              req.body.cuis_selected || "",
      //                              req.body.qualifiers_selected || "" ,
      //                              req.body.user, req.body.istitle, req.body.labeller)
      //   break;
      case "get":
        result = await getCUISIndex() //req.body.docid, req.body.page, req.body.collId,
      default:

    }
    res.json({status: "success", data: result})
  } else {
    res.json({status: "unauthorised", payload: null})
  }

});



app.get(CONFIG.api_base_url+'/',function(req,res){
  res.send("TTidier Server running.")
});

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


// Collections
var listCollections = async () => {
    var client = await pool.connect()
    var result = await client.query(
      `SELECT collection.collection_id, title, description, owner_username, table_n
       FROM public.collection
       LEFT JOIN
       ( SELECT collection_id, count(docid) as table_n FROM
       ( select distinct docid, page, collection_id from public.table ) as interm
       group by collection_id ) as coll_counts
       ON collection.collection_id = coll_counts.collection_id ORDER BY collection_id`)
        client.release()
    return result.rows
}

var getCollection = async ( collection_id ) => {
    var client = await pool.connect()
    var result = await client.query(
      `SELECT *
      FROM public.collection WHERE collection_id = $1`,[collection_id])

    var tables = await client.query(
      `SELECT docid, page, "user", notes, tid, collection_id, file_path, "tableType"
      FROM public."table" WHERE collection_id = $1 ORDER BY docid,page`,[collection_id])

    var collectionsList = await client.query(
      `SELECT * FROM public.collection ORDER BY collection_id`);

    client.release()

    if ( result.rows.length == 1){
        result = result.rows[0]
        result.tables = tables.rows;
        result.collectionsList = collectionsList.rows;
        return result
    }
    return {}
}

var createCollection = async (title, description, owner) => {

    var client = await pool.connect()
    var result = await client.query(`INSERT INTO public.collection(
                                      title, description, owner_username, visibility, completion)
                                      VALUES ($1, $2, $3, $4, $5);`, [title, description, owner, "public", "in progress"] )
        result = await client.query(`Select * from collection
                                     ORDER BY collection_id DESC LIMIT 1;` )
    client.release()
    return result
}

var editCollection = async (collData) => {
    var client = await pool.connect()
    var result = await client.query(
      `UPDATE public.collection
      SET title=$2, description=$3, owner_username=$4, completion=$5, visibility=$6
      WHERE collection_id=$1`,
      [collData.collection_id, collData.title, collData.description,
        collData.owner_username, collData.completion, collData.visibility])
    client.release()
    return result
}

var deleteCollection = async (collection_id) => {
  var client = await pool.connect()

  var tables = await client.query(
    `SELECT docid, page FROM public."table" WHERE collection_id = $1`,[collection_id]
  )

  tables = tables.rows
  var result = await removeTables(tables, collection_id, true);

  var results = await client.query(
    `DELETE FROM collection WHERE collection_id = $1`, [collection_id]
  )
  client.release()
}

const getResults = async ( tids ) => {
  var client = await pool.connect()
  var result = await client.query(`SELECT * FROM "result" WHERE tid = ANY ($1)`,[tids])
        client.release()
  return result
}

app.post(CONFIG.api_base_url+'/collections', async function(req,res){

  if ( req.body && ( ! req.body.action ) ){
    res.json({status: "undefined", received : req.query})
    return
  }

  var validate_user = validateUser(req.body.username, req.body.hash);

  if ( validate_user ){

    var result;

    switch (req.body.action) {
      case "list":
        result = await listCollections();
        res.json({status: "success", data: result})
        break;
      case "get":
        result = await getCollection(req.body.collection_id);
        res.json({status: "success", data: result})
        break;
      case "delete":
        await deleteCollection(req.body.collection_id);
        res.json({status: "success", data: {}})
        break;
      case "create":
        result = await createCollection("new collection", "", req.body.username);
        res.json({status: "success", data: result})
        break;
      // Well use edit to createCollection on the fly
      case "edit":
        var allCollectionData = JSON.parse( req.body.collectionData )

        // if ( allCollectionData.collection_id == "new" ) {
        //   result = await createCollection(allCollectionData.title, allCollectionData.description, allCollectionData.owner_username);
        //   // result = result.rows[0]
        // } else {
        result = await editCollection(allCollectionData);
        // }
        result = await getCollection(req.body.collection_id);
        res.json({status: "success", data: result})
        break;

      case "download":
        var tids = JSON.parse(req.body.tid);

        if ( req.body.target.indexOf("results") > -1 ){
          result = await getResults( tids );
        } else {
          result = await getMetadata( tids );
        }

        res.json({status: "success", data: result})
        break;
      default:
        res.json({status: "failed"})
    }

  } else {
    res.json({status:"unauthorised", payload: null})
  }

});

// Tables
const createTable = async (docid,page,user,collection_id,file_path) => {

    var client = await pool.connect()
    var result = await client.query(
      `INSERT INTO public."table"(
	       docid, page, "user", notes, collection_id, file_path, "tableType")
	     VALUES ($1, $2, $3, $4, $5, $6, $7);`,
         [docid,page,user,"",collection_id,file_path,""])

    client.release()
    return result
}

const removeTables = async (tables, collection_id, fromSelect = false) => {

    if (!fromSelect){
      tables = tables.map( (tab) => { const [docid, page] = tab.split("_"); return {docid,page} })
    }

    var client = await pool.connect()

    for ( var i = 0; i < tables.length; i++){
      var result = await client.query(
        `DELETE FROM public."table"
        	WHERE docid = $1 AND page = $2 AND collection_id = $3;`,
           [tables[i].docid, tables[i].page, collection_id])

      var filename = tables[i].docid +"_"+ tables[i].page+".html";
      try{
        moveFileToCollection({ originalname: filename, path: path.join(global.tables_folder, collection_id, filename) }, "deleted" )
      } catch (err){
        console.log("REMOVE FILE DIDN't EXIST: "+JSON.stringify(err))
      }
    }

    client.release()
    return result
}

const moveTables = async (tables, collection_id, target_collection_id) => {
    tables = tables.map( (tab) => { const [docid, page] = tab.split("_"); return {docid,page} })

    var client = await pool.connect()

    for ( var i = 0; i < tables.length; i++){
      var result = await client.query(
        `UPDATE public."table"
	       SET collection_id=$4
         WHERE docid = $1 AND page = $2 AND collection_id = $3;`,
        [tables[i].docid, tables[i].page, collection_id, target_collection_id])

      var filename = tables[i].docid +"_"+ tables[i].page+".html";
      try{
        moveFileToCollection({ originalname: filename, path: path.join(global.tables_folder, collection_id, filename) }, target_collection_id )
      } catch (err){
        console.log("MOVE FILE DIDN't EXIST: "+JSON.stringify(err))
      }
    }

    client.release()
    return result
}



app.post(CONFIG.api_base_url+'/tables', async function(req,res){

  if ( req.body && ( ! req.body.action ) ){
    res.json({status: "undefined", received : req.query})
    return
  }

  var validate_user = validateUser(req.body.username, req.body.hash);

  if ( validate_user ){

    var result = {};

    switch (req.body.action) {
      case "remove":
        result = await removeTables(JSON.parse(req.body.tablesList), req.body.collection_id);
        break;
      case "move":
        result = await moveTables(JSON.parse(req.body.tablesList), req.body.collection_id, req.body.targetCollectionID);
        break;
      case "list":  // This is the same as not doing anything and returning the collection and its tables.
      default:
    }
    // Always return the updated collection details
    result = await getCollection(req.body.collection_id);
    res.json({status: "success", data: result})
  } else {
    res.json({status:"unauthorised", payload: null})
  }

});



app.post(CONFIG.api_base_url+'/search', async function(req,res){

  var bod = req.body.searchContent
  var type = JSON.parse(req.body.searchType)

  var validate_user = validateUser(req.body.username, req.body.hash);

  if ( validate_user ){

    var search_results = easysearch.search( global.searchIndex, bod)

    console.log("SEARCH: "+ search_results.length+ " for " + bod )

    if ( search_results.length > 100){
      search_results = search_results.slice(0,100)
    }

    res.json(search_results)
  } else {
    res.json([])
  }

});


app.post(CONFIG.api_base_url+'/getTableContent',async function(req,res){

    var bod = req.body.searchContent

    var validate_user = validateUser(req.body.username, req.body.hash);

    if ( validate_user ){

      try{

        if(req.body.docid && req.body.page && req.body.collId ){
          var collection_data = await getCollection(req.body.collId)

          var enablePrediction = JSON.parse(req.body.enablePrediction)

          var tableData = await readyTable(req.body.docid, req.body.page, req.body.collId, enablePrediction ) // false, predictions are disabled.

          var annotation = await getAnnotationByID(req.body.docid, req.body.page, req.body.collId)

          tableData.collectionData = collection_data

          tableData.annotationData = annotation && annotation.rows.length > 0 ? annotation.rows[0] : {}

          if ( enablePrediction ){
            var rows = tableData.predictedAnnotation.rows.map( ann  => {
              return {
                location: "Row",
                content: ann.descriptors.reduce( (acc,d) => { acc[d] = true; return acc },{}),
                number: (ann.c+1)+"",
                qualifiers: ann.unique_modifier == "" ? {} : ann.unique_modifier.split(";").filter( a => a.length > 1).reduce( (acc,d) => { acc[d] = true; return acc }, {}),
                subannotation: false }
              })

            var cols = tableData.predictedAnnotation.cols.map( ann  => {
              return {
                location: "Col",
                content: ann.descriptors.reduce( (acc,d) => { acc[d] = true; return acc },{}),
                number: (ann.c+1)+"",
                qualifiers: ann.unique_modifier == "" ? {} : ann.unique_modifier.split(";").filter( a => a.length > 1).reduce( (acc,d) => { acc[d] = true; return acc }, {}),
                subannotation: false }
              })

            var predAnnotationData = (tableData.annotationData && tableData.annotationData.annotation) ? tableData.annotationData : {
              annotation: {
                  collection_id: req.body.collId,
                  completion: "",
                  docid: req.body.docid,
                  file_path: req.body.docid + "_" + req.body.page + ".html",
                  notes: "",
                  page: req.body.page,
                  tableType: "",
                  tid: tableData.collectionData.tables.filter( ( table ) => { return table.docid == req.body.docid && table.page == req.body.page } )[0].tid,
                  user: req.body.username,
                }
            }

            // var tData = tableData.collectionData.tables.filter( ( table ) => { return table.docid == req.body.docid && table.page == req.body.page } )
            predAnnotationData.annotation.annotations = [...rows, ...cols]

            // debugger
            tableData.annotationData = predAnnotationData

          }

          res.json( tableData )
        } else {
          res.json({status: "wrong parameters", body : req.body})
        }
      } catch (e){
        console.log(e)
         // debugger
        res.json({status: "getTableContent: probably page out of bounds, or document does not exist", body : req.body})
      }

    } else {
      res.json([])
    }
});

// Extracts all recommended CUIs from the DB and formats them as per the "recommend_cuis" variable a the bottom of the function.
async function getRecommendedCUIS(){
  var cuiRecommend = async () => {
    var client = await pool.connect()
    var result = await client.query(`select * from cuis_recommend`)
          client.release()
    return result
  }

  var recommend_cuis = {}

  var rec_cuis = (await cuiRecommend()).rows

  var splitConcepts = ( c ) => {

      if ( c == null ){
        return []
      }

      var ret = c[0] == ";" ? c.slice(1) : c // remove trailing ;

      return ret.length > 0 ? ret.split(";") : []
  }

  rec_cuis ? rec_cuis.map ( item => {

    var cuis = splitConcepts(item.cuis)
    var rep_cuis = splitConcepts(item.rep_cuis)
    var excluded_cuis = splitConcepts(item.excluded_cuis)

    var rec_cuis = []

    cuis.forEach(function(cui) {
    	if ( excluded_cuis.indexOf(cui) < 0 ){
        if ( rep_cuis.indexOf(cui) < 0 ){
            rec_cuis.push(cui)
        }
      }
    });

    recommend_cuis[item.concept] = { cuis: rep_cuis.concat(rec_cuis), cc: item.cc }

  }) : ""
  return recommend_cuis
}

app.get(CONFIG.api_base_url+'/cuiRecommend', async function(req,res){

  var cuirec = await getRecommendedCUIS()

  res.send( cuirec )

});

const prepareAnnotationPreview = async (docid, page, collId, cachedOnly) => {

      var annotations = await getAnnotationByID(docid, page, collId)

      var tid = annotations.rows.length > 0 ? annotations.rows[0].tid : -1;

      if ( tid < 0 ){
        return {status: "wrong parameters (missing tid)"};
      }

      var client = await pool.connect()

      var tableResult = await client.query(
        `SELECT tid, "tableResult" FROM result WHERE tid = $1`,[tid]
      )

      client.release()

      tableResult = tableResult && (tableResult.rows.length > 0) ? tableResult.rows[0].tableResult : []

      if ( cachedOnly === 'true' ){

        var toReturn = {}
        if ( tableResult.length > 0){
          toReturn = {"state" : "good", result : tableResult }
        } else {
          toReturn = {"state" : "good", result : [] }
        }

        // console.log("Fast reload: "+ req.body.docid +" - "+ req.body.page +" - "+ req.body.collId)
        return toReturn;
      }

      var final_annotations = {}

      /**
      * There are multiple versions of the annotations. When calling reading the results from the database, here we will return only the latest/ most complete version of the annotation.
      * Independently from the author of it. Completeness here measured as the result with the highest number of annotations and the highest index number (I.e. Newest, but only if it has more information/annotations).
      * May not be the best in some cases.
      *
      */

      for ( var r in annotations.rows){
        var ann = annotations.rows[r]
        var existing = final_annotations[ann.docid+"_"+ann.page]
        if ( existing ){
          if ( ann.N > existing.N && ann.annotation.annotations.length >= existing.annotation.annotations.length ){
                final_annotations[ann.docid+"_"+ann.page] = ann
          }
        } else { // Didn't exist so add it.
          final_annotations[ann.docid+"_"+ann.page] = ann
        }
      }

      var final_annotations_array = []
      for (  var r in final_annotations ){
        var ann = final_annotations[r]
        final_annotations_array[final_annotations_array.length] = ann
      }


      if( final_annotations_array.length > 0){

            var entry = final_annotations_array[0]
                entry.annotation = !entry.annotation ? [] : entry.annotation.annotations.map( (v,i) => {
                  var ann = v;
                      ann.content = Object.keys(ann.content).join(";");
                      ann.qualifiers = Object.keys(ann.qualifiers).join(";");
                  return ann
                })

            console.log(entry)

            entry.annotation.reduce( (acc, entry, i) => {
              acc[entry.content] = acc[entry.content] ? acc[entry.content]+1 : 1;
              entry.content = entry.content+"@"+acc[entry.content];
              return acc
            }, {})

            console.log("TRY: "+ 'http://'+CONFIG.plumber_url+'/preview')


            var doRequest = new Promise( async (accept, reject) => {

              await request({
                      url: 'http://'+CONFIG.plumber_url+'/preview',
                      method: "POST",
                      json: {
                        anns: entry,
                        collId: collId
                      }
                }, async function (error, response, body) {

                  // console.log("pentada"+JSON.stringify(error))
                  var insertResult = async (tid, tableResult) => {
                        var client = await pool.connect()
                        var done = await client.query('INSERT INTO result(tid, "tableResult") VALUES ($1, $2) ON CONFLICT (tid) DO UPDATE SET "tableResult" = $2',  [tid, tableResult])
                          .then(result => console.log("insert result: "+ new Date()))
                          .catch(e => console.error(e.stack))
                          .then(() => client.release())
                  }

                  if ( body && body.tableResult && body.tableResult.length > 0){
                    await insertResult(body.ann.tid[0], body.tableResult)
                    console.log("tableresults: "+body.tableResult.length)
                    accept({"state" : "good", result : body.tableResult})
                  } else {
                    console.log("tableresults: empty. Is plumber/R API running, or annotation empty?")
                    accept({"state" : "good", result : []})
                  }
              });

            })

        var plumberResult = await doRequest


        plumberResult["backAnnotation"] = annotations
        return plumberResult
      } else {
        return {"state" : "empty"}
      }

      return {"state":"whathappened!"}
}

// Generates the results table live preview, connecting to the R API.
app.post(CONFIG.api_base_url+'/annotationPreview',async function(req,res){

      var bod = req.body.searchContent

      var validate_user = validateUser(req.body.username, req.body.hash);

      if ( validate_user ){

        try{

          if(req.body.docid && req.body.page && req.body.collId ){

            res.json(await prepareAnnotationPreview(req.body.docid , req.body.page, req.body.collId, req.body.cachedOnly))

          } else {
            res.json({status: "wrong parameters", body : req.body})
          }

        } catch (e){
          console.log(e)
          res.json({status: "annotationPreview : probably page out of bounds, or document does not exist", body : req.body})
        }

      } else {
        res.json([])
      }
      // res.json( {"state" : "reached end", result : []} )
});

// Returns all annotations for all document/tables.
app.get(CONFIG.api_base_url+'/formattedResults', async function (req,res){

       var results = await getAnnotationResults()

       if ( results ){

          var finalResults = {}

          /**
          * There are multiple versions of the annotations. When calling reading the results from the database, here we will return only the latest/ most complete version of the annotation.
          * Independently from the author of it. Completeness here measured as the result with the highest number of annotations and the highest index number (I.e. Newest, but only if it has more information/annotations).
          * May not be the best in some cases.
          *
          */

          for ( var r in results.rows){
            var ann = results.rows[r]
            var existing = finalResults[ann.docid+"_"+ann.page]
            if ( existing ){
              if ( ann.N > existing.N && ann.annotation.annotations.length >= existing.annotation.annotations.length ){
                    finalResults[ann.docid+"_"+ann.page] = ann
              }
            } else { // Didn't exist so add it.
              finalResults[ann.docid+"_"+ann.page] = ann
            }
          }

          var finalResults_array = []
          for (  var r in finalResults ){
            var ann = finalResults[r]
            finalResults_array[finalResults_array.length] = ann
          }

          var formattedRes = '"user","docid","page","corrupted_text","tableType","location","number","content","qualifiers"\n';

          finalResults_array.map( (value, i) => {
            value.annotation.annotations.map( (ann , j ) => {
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
              } catch (e){
                console.log("an empty annotation, no worries: "+JSON.stringify(ann))
              }

            })
          })

          res.send(formattedRes)
      }
})

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

  var result = new Promise(function(resolve, reject) {

    request.post({
        headers: {'content-type' : 'application/x-www-form-urlencoded'},
        url:     'http://'+CONFIG.metamapper_url+'/form',
        body:    "input="+phrase+" &args=-AsI+ --JSONn -E"
      }, (error, res, body) => {
      if (error) {
        reject(error)
        return
      }

      var start = body.indexOf('{"AllDocuments"')
      var end = body.indexOf("'EOT'.")

      resolve(body.slice(start, end))
    })


  });

  var mm_match = await result

  try{

    var r = JSON.parse(mm_match).AllDocuments[0].Document.Utterances.map(
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

    // // This removes duplicate cuis
    // r = r.reduce( (acc,el) => {if ( acc.cuis.indexOf(el.CUI) < 0 ){acc.cuis.push(el.CUI); acc.data.push(el)}; return acc }, {cuis: [], data: []} ).data
    r = r.flat().flat().flat().reduce( (acc,el) => {if ( acc.cuis.indexOf(el.CUI) < 0 ){acc.cuis.push(el.CUI); acc.data.push(el)}; return acc }, {cuis: [], data: []} ).data
    r = r.sort( (a,b) => a.score - b.score)

    return r
  } catch (e){
    return []
  }

  // return result
}

const processHeaders = async (headers) => {

       var all_concepts = Array.from(new Set(Object.values(headers).flat().flat().flat().flat()))

       var results = await Promise.all(all_concepts.map( async (concept,i) => {
                                     var mm_match = await getMMatch(concept.toLowerCase())
                                     return mm_match
                                   }))

       var insertCUI = async (cui,preferred,hasMSH) => {
           var client = await pool.connect()
           var done = await client.query('INSERT INTO cuis_index(cui,preferred,"hasMSH",user_defined,admin_approved) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (cui) DO UPDATE SET preferred = $2, "hasMSH" = $3, user_defined = $4, admin_approved = $5',  [cui,preferred,hasMSH,true,false])
             .then(result => console.log("insert: "+ new Date()))
             .catch(e => console.error(e.stack))
             .then(() => client.release())
       }

       var cuis_index = await getCUISIndex()

       await Promise.all(results.flat().flat().map( async (cuiData,i) => {

            if ( cuis_index[cuiData.CUI] ){
                return
            } else {
                return await insertCUI(cuiData.CUI, cuiData.preferred, cuiData.hasMSH)
            }
       }))

       results = all_concepts.reduce( (acc,con,i) => {acc[con.toLowerCase().trim()] = {concept:con.trim(), labels:results[i]}; return acc},{})

       var allConceptPairs = Object.keys(headers).reduce ( (acc,concepts) => {acc.push(headers[concepts]); return acc} , [] ).flat()


       // debugger
       var final = allConceptPairs.reduce ( (acc,con,i) => {
                var concept = con[con.length-1].toLowerCase().trim()
                var root = con.slice(0,con.length-1).join(" ").toLowerCase().trim()
                var rootWCase = con.slice(0,con.length-1).join(" ").trim()
                var key = root+concept

                acc[key] = {concept:con[con.length-1].trim(), root: rootWCase, labels: results[concept].labels};
                return acc
            },{})

      return final
}

app.post(CONFIG.api_base_url+'/auto', async function(req,res){

  try{
   if(req.body && req.body.headers ){

     var headers = JSON.parse(req.body.headers)

     res.send({autoLabels : await processHeaders(headers) })
   } else {
     res.send({status: "wrong parameters", query : req.query})
   }
 } catch(e){
   console.log(e)
   res.send({status: "error", query : e})
 }
});

app.get(CONFIG.api_base_url+'/getMMatch',async function(req,res){
  try{
   if(req.query && req.query.phrase ){
     var mm_match = await getMMatch(req.query.phrase)
     res.send( mm_match )
   } else {
     res.send({status: "wrong parameters", query : req.query})
   }
 } catch(e){
   console.log(e)
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

    if ( req.body && ( ! req.body.action ) ){
      res.json({status: "undefined", received : req.query})
      return
    }

    var validate_user = validateUser(req.body.username, req.body.hash);

    if ( validate_user ){

      var result;

      var folder_exists = await fs.existsSync( path.join(global.tables_folder_override, req.body.collId ) )

      if ( !folder_exists ){
         fs.mkdirSync( path.join(global.tables_folder_override, req.body.collId), { recursive: true })
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

      fs.writeFile( path.join(global.tables_folder_override, req.body.collId, (req.body.docid+"_"+req.body.page+'.html') ),  completeFile, function (err) {
        if (err) throw err;

        console.log('Written replacement for: '+ req.body.collId+ " // " +req.body.docid+"_"+req.body.page+'.html');
        res.json({status: "success", data: 'Written replacement for: '+ req.body.collId+ " // " +req.body.docid+"_"+req.body.page+'.html' })
      });

    } else {
      res.json({status:"unauthorised", payload: null})
    }

})

app.get(CONFIG.api_base_url+'/removeOverrideTable', async function(req,res){

  if(req.query && req.query.docid && req.query.page ){

    var file_exists = await fs.existsSync(global.tables_folder_override+"/"+req.query.docid+"_"+req.query.page+".html")
    if ( file_exists ) {

      fs.unlink(global.tables_folder_override+"/"+req.query.docid+"_"+req.query.page+".html", (err) => {
        if (err) throw err;
        console.log("REMOVED : "+global.tables_folder_override+"/"+req.query.docid+"_"+req.query.page+".html");
      });

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

app.post(CONFIG.api_base_url+'/saveAnnotation',async function(req,res){


  if ( req.body && ( ! req.body.action ) ){
    res.json({status: "undefined", received : req.query})
    return
  }

  var validate_user = validateUser(req.body.username, req.body.hash);

  if ( validate_user ){

      console.log("Recording Annotation: "+req.body.docid + "_" +req.body.page + "_" + req.body.collId)

      var tid = await getTid ( req.body.docid, req.body.page, req.body.collId )

      var insertAnnotation = async (tid, annotation) => {

        var client = await pool.connect()

        var done = await client.query('INSERT INTO annotations VALUES($2,$1) ON CONFLICT (tid) DO UPDATE SET annotation = $2;', [tid, annotation])
          .then(result => console.log("Updated Annotations for "+tid+" : "+ new Date()))
          .catch(e => console.error(e.stack))
          .then(() => client.release())

      }


      var annotationData = JSON.parse(req.body.payload)

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
      // debugger

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

      // debugger

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

app.listen(CONFIG.api_port, '0.0.0.0', function () {
  console.log('Table Tidier Server running on port '+CONFIG.api_port+' with base: '+ CONFIG.api_base_url + "  :: " + new Date().toISOString());
});

main();
