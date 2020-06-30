const express = require('express');
const app = express();

const bodyParser = require('body-parser');

const csv = require('csv-parser');

const html = require("html");

const fs = require('fs');

const request = require("request");

const cheerio = require('cheerio');

//requiring path and fs modules
const path = require('path');

//joining path of directory
const directoryPath = path.join(__dirname, '../../Server/');
//passsing directoryPath and callback function

var sys = require('util')
var exec = require('child_process').exec;

const cors = require('cors');
app.use(cors("*"));

Object.defineProperty(Array.prototype, 'flat', {
    value: function(depth = 1) {
      return this.reduce(function (flat, toFlatten) {
        return flat.concat((Array.isArray(toFlatten) && (depth>1)) ? toFlatten.flat(depth-1) : toFlatten);
      }, []);
    },

});


const createCsvWriter = require('csv-writer').createObjectCsvWriter;


fs.unlink('cui_concept.csv', (err) => {
  if (err) {console.log( "file already deleted")};
  console.log('cui_concept.csv was deleted');
});

fs.unlink('cui_def.csv', (err) => {
  if (err) {console.log( "file already deleted")};
  console.log('cui_def.csv was deleted');
});

const concept_cui_csvWriter = createCsvWriter({
    path: 'cui_concept.csv',
    header: [
        {id: 'text', title: 'Text'},
        {id: 'cuis', title: 'CUIS'}
    ]
});

const cui_def_csvWriter = createCsvWriter({
    path: 'cui_def.csv',
    header: [
        {id: 'cui', title: 'CUI'},
        {id: 'matchedtext', title: 'matchedText'},
        {id: 'preferred', title: 'preferred'},
        {id: 'hasmsh', title: 'hasMSH'},
        {id: 'semTypes',title: 'semTypes'}
    ]
});


async function listFiles(directoryPath){

  var files = new Promise( function (resolve, reject) {

        fs.readdir(directoryPath+"HTML_TABLES", function (err, fils) {
            //handling error
            if (err) {
                reject(err)
            }
            resolve(fils)
        });

      })

  return await files
}

function cleanTerm (term){

  term = term.toLowerCase().replace(/[^A-z0-9 ]/gi, " ").replace(/[0-9]+/gi, " $nmbr$ " ).replace(/ +/gi," ").trim()

  return term
}




function extractMMData (r) {
  try{
    r = JSON.parse(r)
    // debugger
    r = r.AllDocuments[0].Document.Utterances.map(
                    utterances => utterances.Phrases.map(
                      phrases => phrases.Mappings.map(
                        mappings => mappings.MappingCandidates.map(
                          candidate => ({
                                    CUI:candidate.CandidateCUI,
                                    matchedText: candidate.CandidateMatched,
                                    preferred: candidate.CandidatePreferred,
                                    hasMSH: candidate.Sources.indexOf("MSH") > -1,
                                    semTypes: candidate.SemTypes.join(";")
                                 })
                               )
                             )
                           )
                         ).flat().flat().flat()


    // This removes duplicate cuis
    r = r.reduce( (acc,el) => {if ( acc.cuis.indexOf(el.CUI) < 0 ){acc.cuis.push(el.CUI); acc.data.push(el)}; return acc }, {cuis: [], data: []} ).data
    return r
  } catch (e){
    return []
  }
}

async function askMM(term){
  // debugger
  var mm_concepts = new Promise( function (resolve, reject) {
      var dir = exec('curl -X POST -d "input='+term+'&args=-AsItd+ --JSONf 2 --prune 2 -V USAbase" "http://localhost:8080/form" | tail -n +3 ', function(err, stdout, stderr) {
        if (err) {
            reject(err)
        }
        //console.log(stdout)


        resolve(extractMMData (stdout));
      });

      dir.on('exit', function (code) {
        // exit code is code
      });

   })

   return await mm_concepts
}



async function main(){
  var files = await listFiles(directoryPath)

  var td_strings = []

  for ( var f in files ){
    //console.log(files[f]+" --: "+f+" / "+files.length)

    var file_exists = await fs.existsSync(directoryPath+"/HTML_TABLES_OVERRIDE/"+files[f])
    var $
    if ( file_exists ) {
      // console.log("from override")
       $ = cheerio.load(fs.readFileSync(directoryPath+"/HTML_TABLES_OVERRIDE/"+files[f]))
    } else {
      $ = cheerio.load(fs.readFileSync(directoryPath+"/HTML_TABLES/"+files[f]))
    }

    $("td").each(function(i, elem) {
      var term = cleanTerm ($(this).text());
      td_strings[td_strings.length] = term;
    });

  }

  var td_strings = Array.from( new Set(td_strings))

  var concepts = []

  for ( var w in td_strings ){

    if ( td_strings[w].length < 2 && td_strings[w].split(" ").length > 12 ){
      continue;
    }

    console.log(td_strings[w]+" --: "+w+" / "+td_strings.length)

    var conps = await askMM(td_strings[w])
    var concepts = [...concepts,...conps]

    var cuis = []

    for ( var e in conps ){

      cuis.push(conps[e].CUI)

      cui_def_csvWriter.writeRecords( [{cui: conps[e].CUI, matchedtext: conps[e].matchedText, preferred: conps[e].preferred, hasmsh: conps[e].hasMSH, semTypes: conps[e].semTypes}] )
          .then(() => {
            //console.log("'"+conps[e].CUI+"','"+conps[e].matchedText+"','"+conps[e].preferred+"','"+conps[e].hasMSH+"'")
          });

    }

    concept_cui_csvWriter.writeRecords( [{text: td_strings[w], cuis: cuis.join(";")}] )
        .then(() => {
            //console.log( td_strings[w]+ ', '+cuis.join(";") );
        });


  }
}

// {CUI: "C0027051", matchedText: "Infarction, Myocardial", preferred: "Myocardial Infarction", hasMSH: true}

main();


//
// app.get('/echo', async function(req,res){
//   //
//   // if ( req.query && req.query.docid && req.query.page ){
//   //
//   //   var filename = req.query.docid+"_"+req.query.page+".html"
//   //
//   //   var delprom = new Promise(function(resolve, reject) {
//   //       fs.rename( tables_folder+'/'+ filename , tables_folder_deleted+'/'+ filename , (err) => {
//   //         if (err) { reject("failed")} ;
//   //         console.log('Move complete : '+filename);
//   //         resolve("done");
//   //       });
//   //   });
//   //
//   //   await delprom;
//   //   await refreshDocuments();
//   //
//   //   res.send("table deleted")
//   // } else {
//   //   res.send("table not deleted")
//   // }
//   res.send("echo!")
// });
//
// app.listen(PORT, function () {
//   console.log('Express Server running on port '+PORT+' ' + new Date().toISOString());
// });
