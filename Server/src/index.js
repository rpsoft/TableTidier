var express = require('express');

var bodyParser = require('body-parser');
var html = require("html");

var request = require("request");

var multer = require('multer');

const fs = require('fs');

const { Pool, Client, Query } = require('pg')

const csv = require('csv-parser');
const CsvReadableStream = require('csv-reader');
const path = require('path');


//NODE R CONFIGURATION.
const R = require("r-script");


var cors = require('cors');

// I want to access cheerio from everywhere.
global.cheerio = require('cheerio');

global.CONFIG = require('./config.json')
global.available_documents = {}
global.abs_index = []
global.tables_folder = "HTML_TABLES"
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
import passport, {initialiseUsers, createUser}  from "./security.js"

console.log("Loading Table Libs")
import { prepareAvailableDocuments, readyTableData } from "./table.js"

console.log("Loading MetaMap Docker Comms Module")
import { metamap } from "./metamap.js"

console.log("Loading Extra Functions")
import ef from "./extra_functions.js"

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
import {getAnnotationResults} from "./network_functions.js"


console.log("Configuring Server")
var app = express();

app.use(cors("*"));
app.options('*', cors())


app.use('/images', express.static(path.join(__dirname, 'images')))
app.use('/pdfs', express.static(path.join(__dirname, 'pdfs')))
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(passport.initialize());


app.post('/login', function(req, res, next) {
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



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.post('/api/createUser', async function(req, res) {

  var result;
  try{
    result = await createUser(req.body)
    res.json({status:"success", payload: result })
  } catch (e){
    res.json({status:"failed", payload: "" })
  }

});

app.get('/api/test', async function(req,res){
    res.send("testing this worked!")
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

const upload = multer({ storage: storage });




app.post('/api/tableUploader', upload.array('fileNames'), async function(req, res) {

  var uploaded_files = []

  for( var f in req.files) {
      uploaded_files.push(req.files[f].originalname)
  }

  res.json({status:"test", payload: uploaded_files })
  res.end();
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
async function getAnnotationByID(docid,page,user){

  var client = await pool.connect()

  var result = await client.query('select * from annotations where docid=$1 AND page=$2 AND "user"=$3 order by docid desc,page asc',[docid,page,user])
        client.release()
  return result
}


// preinitialisation of components if needed.
async function main(){

  umls_data_buffer = await UMLSData();

  await refreshDocuments()

  await initialiseUsers()

}

main();


app.get('/api/deleteTable', async function(req,res){

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
    await refreshDocuments();

    res.send("table deleted")
  } else {
    res.send("table not deleted")
  }

});

app.get('/api/recoverTable', async function(req,res){
    if ( req.query && req.query.docid && req.query.page ){

      var filename = req.query.docid+"_"+req.query.page+".html"

      fs.rename( tables_folder_deleted+'/'+ filename , tables_folder+'/'+ filename , (err) => {
        if (err) throw err;
          console.log('Move complete : '+filename);
      });
    }

    res.send("table recovered")
});

app.get('/api/listDeletedTables', async function(req,res){

  fs.readdir( tables_folder_deleted, function(err, items) {

    if (err) {
      res.send("failed listing "+err)
    } else {
      res.send(items)
    }

  });

});

app.get('/api/modifyCUIData', async function(req,res){

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

app.get('/api/cuiDeleteIndex', async function(req,res){

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

app.get('/api/getMetadataForCUI', async function(req,res){

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

app.get('/api/clearMetadata', async function(req,res){

  var setMetadata = async (docid, page, user) => {
      var client = await pool.connect()

      var done = await client.query('DELETE FROM metadata WHERE docid = $1 AND page = $2 AND "user" = $3', [docid, page, user ])
        .then(result => console.log("deleted: "+ new Date()))
        .catch(e => console.error(e.stack))
        .then(() => client.release())

  }

  if ( req.query && req.query.docid && req.query.page && req.query.user){
    await setMetadata(req.query.docid , req.query.page, req.query.user)
    res.send("done")
  } else {
    res.send("clear failed");
  }

});

app.get('/api/setMetadata', async function(req,res){

  // Setting the Metadata. The Metadata includes the labelling of terms in headings by assigning CUIs.
  var setMetadata = async (docid, page, concept, cuis, qualifiers, cuis_selected, qualifiers_selected, user, istitle, labeller ) => {
      var client = await pool.connect()

     var done = await client.query('INSERT INTO metadata(docid, page, concept, cuis, qualifiers, "user", cuis_selected, qualifiers_selected, istitle, labeller ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (docid, page, concept, "user") DO UPDATE SET cuis = $4, qualifiers = $5, cuis_selected = $7, qualifiers_selected = $8, istitle = $9, labeller = $10', [docid, page, concept, cuis, qualifiers, user, cuis_selected, qualifiers_selected, istitle, labeller ])
        .then(result => console.log("insert: "+ new Date()))
        .catch(e => console.error(e.stack))
        .then(() => client.release())

  }

  if ( req.query && req.query.docid && req.query.page && req.query.concept && req.query.user){
    await setMetadata(req.query.docid , req.query.page , req.query.concept , req.query.cuis || "", req.query.qualifiers || "", req.query.cuis_selected || "", req.query.qualifiers_selected || "" , req.query.user, req.query.istitle, req.query.labeller)
    res.send("done")
  } else {
    res.send("insert failed");
  }

});

app.get('/api/getMetadata', async function(req,res){

  var getMetadata = async ( docid,page, user) => {
    var client = await pool.connect()
    var result = await client.query(`SELECT docid, page, concept, cuis, cuis_selected, qualifiers, qualifiers_selected, "user",istitle, labeller FROM metadata WHERE docid = $1 AND page = $2 AND "user" = $3`,[docid,page,user])
          client.release()
    return result
  }

  if ( req.query && req.query.docid && req.query.page && req.query.user ){
    res.send( await getMetadata(req.query.docid , req.query.page , req.query.user) )
  } else {
    res.send( { error : "getMetadata_badquery" } )
  }

});

app.get('/',function(req,res){
  res.send("TTidier Server running.")
});

// Collections
var listCollections = async () => {
    var client = await pool.connect()
    var result = await client.query(`SELECT id, title, description, owner_username FROM public.collection`)
          client.release()
    return result
}

var createCollection = async () => {
    var client = await pool.connect()
    var result = await client.query(`SELECT id, title, description, owner_username FROM public.collection`)
          client.release()
    return result
}

var editCollection = async () => {
    var client = await pool.connect()
    var result = await client.query(`SELECT id, title, description, owner_username FROM public.collection`)
          client.release()
    return result
}

app.post('/collections', async function(req,res){

  if ( req.query && ( ! req.query.action ) ){
    res.json({status: "undefined"})
    return
  }

  var result;

  switch (req.query.action) {
    case "list":
      result = await listCollections();
      res.json({status: "success", data: result.rows})
      break;
    case "create":
      result = await createCollection();
      res.json({status: "success"})
      break;
    case "edit":
      result = await editCollection();
      res.json({status: "success"})
      break;
    default:
      res.json({status: "failed"})
  }
  // var collections = await getCollections()
  // res.json(collections.rows)
});


app.post('/search', async function(req,res){

  var bod = req.body.searchContent
  var type = JSON.parse(req.body.searchType)

  type.searchCollections
  type.searchTables

  // debugger

  console.log("SEARCH: "+ bod )

  // if ( req.query && ( ! req.query.action ) ){
  //   res.json({status: "undefined"})
  //   return
  // }
  // var result;
  //
  // switch (req.query.action) {
  //   case "list":
  //     result = await listCollections();
  //     res.json({status: "success", data: result.rows})
  //     break;
  //   case "create":
  //     result = await createCollection();
  //     res.json({status: "success"})
  //     break;
  //   case "edit":
  //     result = await editCollection();
  //     res.json({status: "success"})
  //     break;
  //   default:
  //     res.json({status: "failed"})
  // }
  // // var collections = await getCollections()

  res.json([])
});


app.get('/api/allInfo',async function(req,res){

  var labellers = await getMetadataLabellers();
      labellers = labellers.rows.reduce( (acc,item) => { acc[item.docid+"_"+item.page] = item.labeller; return acc;},{})

  if ( req.query && (req.query.filter_topic || req.query.filter_type || req.query.hua || req.query.filter_group || req.query.filter_labelgroup) ){

    var result = await prepareAvailableDocuments( req.query.filter_topic ? req.query.filter_topic.split("_") : [],
                                                  req.query.filter_type ? req.query.filter_type.split("_") : [],
                                                  req.query.hua ? req.query.hua == "true" : false,
                                                  req.query.filter_group ? req.query.filter_group.split("_") : [],
                                                  req.query.filter_labelgroup ? req.query.filter_labelgroup.split("_") : [])


    var available_documents_temp = result.available_documents
    var abs_index_temp = result.abs_index
    var DOCS_temp = result.DOCS

        res.send({
          abs_index : abs_index_temp,
          total : DOCS_temp.length,
          available_documents: available_documents_temp,
          msh_categories: msh_categories,
          labellers: labellers
        })

  } else {

        res.send({
          abs_index,
          total : DOCS.length,
          available_documents,
          msh_categories: msh_categories,
          labellers: labellers
        })

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

app.get('/api/cuiRecommend', async function(req,res){

  var cuirec = await getRecommendedCUIS()

  res.send( cuirec )

});


app.get('/api/allMetadata', async function(req,res){

  var allMetadataAnnotations = async () => {
    var client = await pool.connect()
    var result = await client.query(`select * from metadata`)
          client.release()
    return result
  }

  res.send( await allMetadataAnnotations() )

});


app.get('/api/cuisIndex',async function(req,res){

      var getCUISIndex = async () => {

        var cuis = {}

        var client = await pool.connect()
        var result = await client.query(`select * from cuis_index`)
              client.release()

        result.rows.map( row => {
          cuis[row.cui] = {preferred : row.preferred, hasMSH: row.hasMSH, userDefined: row.user_defined, adminApproved: row.admin_approved}
        })

        return cuis
      }

      res.send( await getCUISIndex() )

});

app.get('/api/cuisIndexAdd',async function(req,res){

  console.log(JSON.stringify(req.query))

  var insertCUI = async (cui,preferred,hasMSH) => {
      var client = await pool.connect()
      var done = await client.query('INSERT INTO cuis_index(cui,preferred,"hasMSH",user_defined,admin_approved) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (cui) DO UPDATE SET preferred = $2, "hasMSH" = $3, user_defined = $4, admin_approved = $5',  [cui,preferred,hasMSH,true,false])
        .then(result => console.log("insert: "+ new Date()))
        .catch(e => console.error(e.stack))
        .then(() => client.release())
  }

  if(req.query && req.query.cui.length > 0
              && req.query.preferred.length > 0
              && req.query.hasMSH.length > 0
              ){
              await insertCUI( req.query.cui , req.query.preferred, req.query.hasMSH );
  }
  res.send("saved annotation: "+JSON.stringify(req.query))
});



// Produces the data required to teach classifiers. Traverses all existing tables, extracting cell values and associating it with the human annotations.
async function trainingData(){

  var cui_data =  await CUIData ()

  var header = [
      {id: 'docid', title: 'docid'},
      {id: 'page', title: 'page'},
      {id: 'clean_concept', title: 'clean_concept'},
      {id: 'is_bold', title: 'is_bold'},
      {id: 'is_italic', title: 'is_italic'},
      {id: 'is_indent', title: 'is_indent'},
      {id: 'is_empty_row', title: 'is_empty_row'},
      {id: 'is_empty_row_p', title: 'is_empty_row_p'},
      {id: 'cuis', title: 'cuis'},
      {id: 'semanticTypes', title: 'semanticTypes'},
      {id: 'label', title: 'label'}
  ]

  // Object.keys(cui_data.cui_def).map( c => {header.push({id: c, title: c})})
  // Object.keys(cui_data.semtypes).map( s => {header.push({id: s, title: s})})

  const createCsvWriter = require('csv-writer').createObjectCsvWriter;

  const csvWriter = createCsvWriter({
      path: 'training_data.csv',
      header: header
  });

  const csvWriter_unique = createCsvWriter({
      path: 'training_data_unique.csv',
      header: header
  });


  var count = 1;

  var cuirec = await getRecommendedCUIS()

  for ( var docid in available_documents){
    for ( var page in available_documents[docid].pages ) {
      console.log(docid+"  --  "+page+"  --  "+count+" / "+DOCS.length)

      //
      // count = count + 1;
      //
      // if ( count < 1800 ){
      //   continue
      // }


      var page = available_documents[docid].pages[page]
      var data = await readyTableData(docid,page)

      var ac_res = cui_data.actual_results

      if ( !ac_res[docid+"_"+page] ) { // table could not be annotated yet, so we skip it.
        continue
      }

      // The manual annotations for each col/row
      var cols; //= data.predicted.cols.reduce( (acc,e) => {acc[e.c] = {descriptors : e.descriptors.join(";"), modifier: e.unique_modifier}; return acc},{} )
      var rows; //= data.predicted.rows.reduce( (acc,e) => {acc[e.c] = {descriptors : e.descriptors.join(";"), modifier: e.unique_modifier}; return acc},{} )

      try{
      // These are manually annotated
        cols = Object.keys(ac_res[docid+"_"+page].Col).reduce( (acc,e) => {  acc[e-1] = ac_res[docid+"_"+page].Col[e]; return acc }, {} )
        rows = Object.keys(ac_res[docid+"_"+page].Row).reduce( (acc,e) => {  acc[e-1] = ac_res[docid+"_"+page].Row[e]; return acc }, {} )
      } catch (e) {
        console.log( "skipping: "+ docid+"_"+page)
        continue
      }


      var getSemanticTypes = (cuis, cui_data) => {

        if ( ! cuis ){
          return []
        }

        var semType = []

        cuis.split(";").map( (cui) => {

            semType.push(cui_data.cui_def[cui].semTypes.split(";"))

        });

        return semType.flat()
      }

      count = count + 1;

      var csvData = data.predicted.predictions.map(
        (row_el,row) => {
          return row_el.terms.map( ( term, col ) => {

              var row_terms = data.predicted.predictions[row].terms

              var term_features = data.predicted.predictions[row].terms_features[col]

              var toReturn = {
                docid: docid,
                page: page,
                clean_concept : term_features[0],
                is_bold : term_features[1],
                is_italic : term_features[2],
                is_indent : term_features[3],
                is_empty_row : term_features[4],
                is_empty_row_p : term_features[5],  // this one is a crude estimation of P values structure. Assume the row has P value if multiple columns are detected but only first and last are populated.
                cuis: term_features[6],
                semanticTypes: term_features[7],
                label : cols[col] ? cols[col].descriptors : (rows[row] ? rows[row].descriptors : ""), // This is the label selected by the annotating person : "subgroup_name; level etc. "
              }

              return toReturn
            })
          }
        )

         csvData = csvData.flat();


         var csvDataUnique = []

         var allkeys = {}

         for ( var i = 0; i < csvData.length; i++ ) {
           var key = Object.values(csvData[i]).join("")

           if ( !allkeys[key] ){
             allkeys[key] = true;
             csvDataUnique.push(csvData[i]);
           }

         }

      await csvWriter.writeRecords(csvData)
          .then(() => {
              console.log('...Done');
          });
      await csvWriter_unique.writeRecords(csvDataUnique)
          .then(() => {
              console.log('...Done');
          });
    }
  }

  return {}
}

app.get('/api/trainingData', async function(req,res){
  console.log("getting all training data")

  var allP = await trainingData()

  res.send(allP)
});

// Generates the results table live preview, connecting to the R API.
app.get('/api/annotationPreview',async function(req,res){

  try{

        var annotations

        if(req.query && req.query.docid && req.query.docid.length > 0 ){
          var page = req.query.page && (req.query.page.length > 0) ? req.query.page : 1
          var user = req.query.user && (req.query.user.length > 0) ? req.query.user : ""

          console.log("Producing Data Preview for: " + JSON.stringify(req.query))
          annotations = await getAnnotationByID(req.query.docid,page, user)

        } else{
          res.send( {state:"badquery: "+JSON.stringify(req.query)} )
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
                  entry.annotation = entry.annotation.annotations.map( (v,i) => {var ann = v; ann.content = Object.keys(ann.content).join(";"); ann.qualifiers = Object.keys(ann.qualifiers).join(";"); return ann} )

              request({
                      url: 'http://localhost:6666/preview',
                      method: "POST",
                      json: {
                        anns: entry
                      }
                }, function (error, response, body) {
                res.send( {"state" : "good", result : body.tableResult, "anns": body.ann} )
              });

        } else {
          res.send({"state" : "empty"})
        }

  } catch (e){

    res.send({"state" : "failed"})
  }


});

// Returns all annotations for all document/tables.
app.get('/api/formattedResults', async function (req,res){

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

app.get('/api/abs_index',function(req,res){

  var output = "";
  for (var i in abs_index){

    output = output + i
              +","+abs_index[i].docid
              +","+abs_index[i].page
              +"\n";

  }

  res.send(output)
});

app.get('/api/totalTables',function(req,res){
  res.send({total : DOCS.length})
});


app.get('/api/getMMatch',async function(req,res){

  var getMMatch = async (phrase) => {

    console.log("LOOKING FOR: "+ phrase)

    var result = new Promise(function(resolve, reject) {

      request.post({
          headers: {'content-type' : 'application/x-www-form-urlencoded'},
          url:     'http://localhost:8080/form',
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

    return result
  }

  try{
   if(req.query && req.query.phrase ){

     var mm_match = await getMMatch(req.query.phrase)

     res.send( mm_match )
   } else {
     res.send({status: "wrong parameters", query : req.query})
   }
 }catch (e){
   console.log(e)
 }
});



// POST method route
app.post('/saveTableOverride', function (req, res) {

  // debugger
  fs.writeFile("HTML_TABLES_OVERRIDE/"+req.body.docid+"_"+req.body.page+'.html',  req.body.table, function (err) {
    if (err) throw err;
    console.log('Written replacement for: '+req.body.docid+"_"+req.body.page+'.html');
  });

  res.send("alles gut!");

})

app.get('/api/removeOverrideTable', async function(req,res){

  if(req.query && req.query.docid && req.query.page ){

    var file_exists = await fs.existsSync("HTML_TABLES_OVERRIDE/"+req.query.docid+"_"+req.query.page+".html")
    if ( file_exists ) {

      fs.unlink("HTML_TABLES_OVERRIDE/"+req.query.docid+"_"+req.query.page+".html", (err) => {
        if (err) throw err;
        console.log("REMOVED : HTML_TABLES_OVERRIDE/"+req.query.docid+"_"+req.query.page+".html");
      });

    }

    res.send({status: "override removed"})
  } else {
    res.send({status: "no changes"})
  }


});

app.get('/api/classify', async function(req,res){

  if(req.query && req.query.terms){
    console.log(req.query.terms)

    res.send({results : await classify(req.query.terms.split(","))})

  }

});

app.get('/api/getTable',async function(req,res){
   try{
    if(req.query && req.query.docid
      && req.query.page && available_documents[req.query.docid]
      && available_documents[req.query.docid].pages.indexOf(req.query.page) > -1){

      var tableData = await readyTableData(req.query.docid,req.query.page)

      res.send( tableData  )
    } else {
      res.send({status: "wrong parameters", query : req.query})
    }
} catch (e){
  console.log(e)
  res.send({status: "probably page out of bounds, or document does not exist", query : req.query})
}

});

app.get('/api/getAvailableTables',function(req,res){
  res.send(available_documents)
});

app.get('/api/getAnnotations',async function(req,res){
  res.send( await getAnnotationResults() )
});



app.get('/api/deleteAnnotation', async function(req,res){

  var deleteAnnotation = async (docid, page, user) => {
      var client = await pool.connect()

      var done = await client.query('DELETE FROM annotations WHERE docid = $1 AND page = $2 AND "user" = $3', [docid, page, user ])
        .then(result => console.log("Annotation deleted: "+ new Date()))
        .catch(e => console.error(e.stack))
        .then(() => client.release())
  }

  if ( req.query && req.query.docid && req.query.page && req.query.user){
    await deleteAnnotation(req.query.docid , req.query.page, req.query.user)
    res.send("done")
  } else {
    res.send("delete failed");
  }

});


app.get('/api/getAnnotationByID',async function(req,res){

  if(req.query && req.query.docid && req.query.docid.length > 0 ){
    var page = req.query.page && (req.query.page.length > 0) ? req.query.page : 1
    var user = req.query.user && (req.query.user.length > 0) ? req.query.user : ""

              var annotations = await getAnnotationByID(req.query.docid,page,user)

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
                  res.send( entry )
              } else {
                  res.send( {} )
              }

  } else{
    res.send( {error:"failed request"} )
  }

});



app.get('/api/modelEval', async (req,res) => {

  var testingDocs = new Promise( (resolve,reject) =>{
      let inputStream = fs.createReadStream(CONFIG.system_path+ "testing_tables_list.csv", 'utf8');

        var testingDocs = [];

        inputStream.pipe(new CsvReadableStream({ parseNumbers: true, parseBooleans: true, trim: true, skipHeader: true }))
          .on('data', function (row) {

              testingDocs.push(row[0]+"_"+row[1])

          })
          .on('end', function (data) {
              console.log("read testing docs list")
              resolve(testingDocs)
          });

    });

    testingDocs = await testingDocs;
    // debugger

    var createCsvWriter = require('csv-writer').createObjectCsvWriter;
      var csvWriter = createCsvWriter({
        path: CONFIG.system_path+'predictor_results.csv',
        header: [
            {id: 'user', title: 'user'},
            {id: 'docid', title: 'docid'},
            {id: 'page', title: 'page'},
            {id: 'corrupted', title: 'corrupted'},
            {id: 'tableType', title: 'tableType'},
            {id: 'location', title: 'location'},
            {id: 'number', title: 'number'},
            {id: 'content', title: 'content'},
            {id: 'qualifiers', title: 'qualifiers'}
        ]
      });

      var records = [
      ];

      var transferAnnotations = (records, items, type ) => {

          items.map( (p,i) =>
            records.push( {
              user : "auto",
              docid : docid,
              page : page,
              corrupted : "false",
              tableType : "na",
              location : type == "Col" ? "Col" : "Row",
              number : parseInt(p.c)+1,
              content : p.descriptors.join(";"),
              qualifiers : p.unique_modifier.split(" ").join(";")
            })
           );

           return records
      }




      var counter = 0;
      for (var doc in available_documents) {


          // if ( counter > 10 ){
          //   break;
          // }

          for (var p in available_documents[doc].pages ){
            var page = available_documents[doc].pages[p]
            var docid = doc

            console.log( (counter) + " / " + (testingDocs.length > 0 ? testingDocs.length : Object.keys(available_documents).length) )

            if ( testingDocs.indexOf(docid+"_"+page) < 0 ) {
              continue
            } else {
              counter++
            }


            var tableData
            try{
              tableData = await readyTableData(docid,page)
            } catch (e){
              console.log(docid+"_"+page+ " :: Failed");
              continue;
            }

            if ( tableData.predicted ){
              records = transferAnnotations( records, tableData.predicted.cols, "Col")
              records = transferAnnotations( records, tableData.predicted.rows, "Row")
            } else {
              console.log("no predicted data found")
              debugger
            }
          }

      }

      // debugger

      csvWriter.writeRecords(records)       // returns a promise
          .then(() => {
              res.send("Done experiments")
          });



});


app.get('/api/recordAnnotation',async function(req,res){

  console.log("Recording Annotation: "+JSON.stringify(req.query))


  var insertAnnotation = async (docid, page, user, annotation, corrupted, tableType, corrupted_text) => {

    var client = await pool.connect()

    var done = await client.query('INSERT INTO annotations VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (docid, page,"user") DO UPDATE SET annotation = $4, corrupted = $5, "tableType" = $6, "corrupted_text" = $7 ;', [docid, page, user, annotation, corrupted,tableType, corrupted_text])
      .then(result => console.log("insert: "+ result))
      .catch(e => console.error(e.stack))
      .then(() => client.release())

  }


  if(req.query && req.query.docid.length > 0
              && req.query.page.length > 0
              && req.query.user.length > 0
              && req.query.annotation.length > 0 ){
      await insertAnnotation( req.query.docid , req.query.page, req.query.user, {annotations:JSON.parse(req.query.annotation)}, req.query.corrupted, req.query.tableType, req.query.corrupted_text)
  }
  res.send("saved annotation: "+JSON.stringify(req.query))
});

app.listen(CONFIG.port, function () {
  console.log('Table Tidier Server running on port '+CONFIG.port+' ' + new Date().toISOString());
});
