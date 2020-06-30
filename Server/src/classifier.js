import { metamap } from "./metamap.js"

let assert = require('assert');
let pythonBridge = require('python-bridge');

let python = pythonBridge({
    python: 'python3'
});

// For python debugging remove this.
python.ex`
  import warnings
  warnings.filterwarnings("ignore", category=FutureWarning)
  warnings.filterwarnings("ignore", category=UserWarning)
`;

python.ex`
  import pandas as pd
  import pickle
`;

// console.log(process.cwd())
//   sgd = pickle.load(open("./src/sgd_multiterm.sav", 'rb'))
//   sgd = pickle.load(open("./src/sgd_l_svm_char.sav", 'rb'))

var CONFIG = require('./config.json')

// simple_full.model
// semTypes_full.model
// cuis_full.model
// umls_full.model

// var classifierFile = CONFIG.system_path+"tools/IHW_table_classifier/trained/cuis_model.model" //

var classifierFile = CONFIG.system_path+"tools/IHW_table_classifier/trained/semTypes_full.model" //
//
// python.ex`
//   sgd = pickle.load(open(${classifierFile}, 'rb'))`

python.ex`
  model = pickle.load(open(${classifierFile}, 'rb'))
`


python.ex`
  def predict(data):

      c = ['clean_concept',
          'is_bold', 'is_italic', 'is_indent', 'is_empty_row',
          'is_empty_row_p', 'cuis', 'semanticTypes']

      customPredict = pd.DataFrame(
          data = data,
          columns = c)

      customPredict = customPredict[['clean_concept', 'is_bold', 'is_italic',
          'is_indent', 'is_empty_row', 'is_empty_row_p', 'semanticTypes']]


      return (model["target_codec"].inverse_transform(model["trained_model"].predict(customPredict)))


  def groupedPredict( data ):
      terms = []
      predictions = predict(data)
      classes = []

      for t in range(0,len(data)):
          terms.append(data[t][0])
          classes.append(";".join(predictions[t]))

      return({"terms": terms, "classes" : classes})

  def printAll(data):
    print(data)
    return data
`;


async function classify(terms){

   // debugger

  var result = new Promise(function(resolve, reject) {
    // var cleanTerms = []
    //
    // for( var t in terms ){
    //
    //   var term = terms[t]
    //
    //   if (term.length > 0){
    //     if ( term.replace(/[^a-z]/g,"").trim().length > 2 ){ // na's and "to" as part of ranges matching this length. Potentially other rubbish picked up here.
    //       cleanTerms[cleanTerms.length] = term
    //     }
    //   }
    // }

    if ( terms.length > 0 ){
      python`
        groupedPredict(${terms})
      `.then( x => resolve(x))
      .catch(python.Exception, (e) => console.log("python error: "+e));
    } else {
      resolve({})
    }
  });

  result = await result
  // debugger
  result = result.terms.reduce ( (acc,item,i) => { if ( item.length > 0 ) {acc[item] = result.classes[i];} return acc }, {} )
  // debugger

  return result
}

async function grouped_predictor(terms){
  var res = []

  for ( var t in terms ){
    res.push([terms[t], 0, 0, 0, 0, 0, "", ""])
  }

  var result = new Promise(function(resolve, reject) {
    if ( res.length > 0 ){
      python`
        groupedPredict(${res})
      `.then( x => resolve(x))
      .catch(python.Exception, (e) => console.log("python error: "+e));
    } else {
      resolve({})
    }
  });
  // debugger
  return result
}

async function feature_extraction (lines){


        var predictions = new Array(lines.length)

        var allowedFormatKeys = ["bold", "italic", "indent"]

        for( var l = 0; l < lines.length; l++ ){
            var currentLine = cheerio(lines[l])
            var terms = []
            var cellClasses = []
            var cellClass = ""

            var total_cols = currentLine.children().length;

            var terms_features = []

            for ( var c = 0 ; c < total_cols; c++){

              var term = prepare_cell_text(cheerio(currentLine.children()[c]).text())   //.trim().replace(/\n/g, " ").toLowerCase()

              term = term.replace(/([^A-z0-9 ])/g, " ").replace(/[0-9]+/g, ' $nmbr$ ').replace(/ +/g," ").replace(/nmbr/g,"$nmbr$").trim().toLowerCase()

              terms[terms.length] = term

              var currentTDclass = (currentLine.children()[c].attribs.class || "").replace(/[0-9]+/g, '').split(" ")

              var childrenClasses = Array.from( new Set(cheerio(currentLine.children()[c]).find("*").toArray().map( (i,el) => { return i.attribs.class || ""} ).join(" ").replace(/[0-9]+/g, '').split(" ")))

              var cellClass = Array.from( new Set([...currentTDclass, ...childrenClasses])).filter( (el) => el.length > 0)

                  cellClass = cellClass.filter( (el) => allowedFormatKeys.indexOf(el) > -1 )

              cellClasses[cellClasses.length] = (term.length > 0 ? cellClass.join(" ") : "").trim()
              //
              // pos_start = c == 0 ? 1 : 0,
              //     pos_middle = c > 0 && c < (total_cols-1) ? 1 : 0,
              //     pos_end = c == (total_cols-1) ? 1 : 0,
              //
              // debugger
              var is_bold = cellClasses[cellClasses.length-1].indexOf("bold") > -1 ? 1 : 0,
                  is_italic = cellClasses[cellClasses.length-1].indexOf("italic") > -1 ? 1 : 0,
                  is_indent = cellClasses[cellClasses.length-1].indexOf("indent") > -1 ? 1 : 0,
                  cuis = umls_data_buffer.cui_concept[term] || "",
                  semanticTypes = cuis.split(";").map( item => umls_data_buffer.cui_def[item] ? umls_data_buffer.cui_def[item].semTypes : [] ).join(";")

                  if ( cuis.trim().length == "" && term.length > 1){

                    // Making sure we attempt something that contains more things than numbers ($nmbr$)
                    if ( term.replace(/\$nmbr\$/g,"").trim().toLowerCase().length > 0  ){

                      if ( umls_data_buffer.cui_concept[term] == undefined ){ // really get terms that do not exist, I.e ignore those we have tried but got nothing back from metamap (empty)
                        console.log("looking up: "+term)

                        var mm = await metamap(term);

                        cuis = mm.map( item => item.CUI ).join(";")
                        semanticTypes = mm.map( item => item.semTypes ).join(";")

                        // Now add missing CUIS to buffer to speed up computation.
                        mm.map( item => { umls_data_buffer.cui_def[item.CUI] = {matchedText: item.matchedText, preferred: item.preferred, hasMSH: item.hasMSH, semTypes: item.semTypes} })
                        umls_data_buffer.cui_concept[term] = cuis

                      }
                    }

                  }
              //
              // var um = umls_data_buffer
              // debugger
              //
              // debugger
              //     ,
              //     is_empty_row =,
              //     is_empty_row_p =,
              //     cuis =,
              //     semanticTypes =,
              //
              var feats = [term, is_bold, is_italic, is_indent, cuis, semanticTypes]

              terms_features[terms_features.length] = [term, is_bold, is_italic, is_indent, cuis, semanticTypes]

            }

            var emptyRow = terms.join("") == terms[0]
            var comb = terms[0]+terms[terms.length-1]
            var emptyRow_pvalue = (terms.join("") == comb) && (comb.length > terms[0].length)

            cellClasses[0] = (cellClasses[0].length > 0 ? cellClasses[0]+" " : "") + ((emptyRow ? " empty_row" : "") + (emptyRow_pvalue ? " empty_row_with_p_value" : "")).trim()
            // debugger
            terms_features = terms_features.map( item => [...item.slice(0,4), emptyRow ? 1 : 0, emptyRow_pvalue ? 1 : 0 , ...item.slice(4,6)])

            var pred_class = await classify(terms_features)

            predictions[l] = {pred_class, terms, cellClasses, terms_features}
        }
        // ['clean_concept', 'pos_start', 'pos_middle', 'pos_end', 'is_bold', 'is_italic', 'is_indent', 'is_empty_row', 'is_empty_row_p', 'cuis', 'semanticTypes']
        //   [clean_concept, pos_start, pos_middle, pos_end, is_bold, is_italic, is_indent, is_empty_row, is_empty_row_p, cuis, semanticTypes]
      //
      //
      // {
      //   clean_concept : clean_concept,
      //   original : term,
      //   onlyNumbers : term.replace(/[^a-z]/g," ").replace(/ +/g," ").trim() == "",
      //   pos_start: row == 0 ? 1 : "",
      //   pos_middle: row > 0 && row < (data.predicted.predictions.length-1)  ? 1 : "",
      //   pos_end: row == data.predicted.predictions.length-1 ? 1 : "",
      //   is_bold : data.predicted.predictions[row].cellClasses[col].indexOf("bold") > -1 ? 1 : "",
      //   is_italic : data.predicted.predictions[row].cellClasses[col].indexOf("italic") > -1 ? 1 : "",
      //   is_indent : data.predicted.predictions[row].cellClasses[col].indexOf("indent") > -1 ? 1 : "",
      //   is_empty_row : row_terms[0] == row_terms.join("") ? 1 : "",
      //   is_empty_row_p : row_terms.length > 2 && (row_terms[0]+row_terms[row_terms.length-1] == row_terms.join("")) ? 1 : "",  // this one is a crude estimation of P values structure. Assume the row has P value if multiple columns are detected but only first and last are populated.
      //   label : cols[col] ? cols[col].descriptors : (rows[row] ? rows[row].descriptors : ""),
      //   cuis: cui_data.cui_concept[clean_concept],
      //   semanticTypes: getSemanticTypes(cui_data.cui_concept[clean_concept],cui_data).join(";"),
      // }
      // debugger
      return (predictions)
}


async function attempt_predictions(actual_table){
  var result = new Promise(async function(resolve, reject) {
    try{
      var a = cheerio.load(actual_table)

      var lines = a("tr")

      var predictions = feature_extraction (lines);

      resolve(predictions)
    } catch ( e){
      reject(e)
    }
  });

  return result
}

module.exports = {
    attempt_predictions,
    classify,
    grouped_predictor
}
