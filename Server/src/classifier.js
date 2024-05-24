/**
 * * classifier module
 * 
 *  - Classifier module uses UMLSData function
 *  Loading UMLSData takes long time to parse (seconds approx 1.3 sec)
 * 
 *  - Classifier also uses a python module that also takes time to load a machine learning model
 *  It takes approx. another 1.6 seconds.
 * Then each call to the model takes between 50 - 100 ms
 * 
 */

import * as cheerio from 'cheerio';
import { metamap } from './metamap.js'
import { UMLSData } from './utils/umls.js'

// * Load UMLSData
//     This function takes long time to parse (may take multiple seconds)
let umls_data_buffer = UMLSData()

let pythonBridge = require('python-bridge');

let python = pythonBridge({
  python: 'python3'
});

const CONFIG_PATH = process.env.CONFIG_PATH || process.cwd()
const CONFIG = require(CONFIG_PATH + '/config.json')

const classifierFile = CONFIG.system_path+'Classifier/trained/umls_full.model'

async function classify(terms) {

  let result = new Promise(function(resolve, reject) {

    if ( terms.length > 0 ){

      python`
        groupedPredict(${terms})
      `.then( x => resolve(x))
      .catch(python.Exception,
        (e) => {
          console.log("python error: "+e)
          resolve({})
        }
      );
    } else {
      resolve({})
    }
  });
  
  result = await result

  if ( result.terms ) {
    result = result.terms.reduce( (acc, item, i) => {
      if ( item.length > 0 ) {
        acc[item] = result.classes[i];
      }
      return acc
    }, {} )
  }

  return result
}

async function grouped_predictor(terms){
  const res = []

  for ( let t in terms ) {
    res.push([terms[t], 0, 0, 0, 0, 0, '', ''])
  }

  const result = new Promise(function(resolve, reject) {
    if ( res.length > 0 ){
      python`
        groupedPredict(${res})
      `.then( x => resolve(x))
      .catch(python.Exception, (e) => console.log("python error: "+e));
    } else {
      resolve({})
    }
  });

  return result
}

async function feature_extraction (lines) {
  // await for umls_data_buffer to finish
  umls_data_buffer = await umls_data_buffer

  const predictions = new Array(lines.length)

  const allowedFormatKeys = ["bold", "italic", "indent"]

  for( let l = 0; l < lines.length; l++ ) {
    const currentLine = cheerio.load(lines[l])('tr')
    const terms = []
    const cellClasses = []
    // var cellClass = ''

    const total_cols = currentLine.children().length;

    let terms_features = []

    for ( let c = 0 ; c < total_cols; c++) {

      // let term = prepare_cell_text(cheerio.load(currentLine.children()[c]).text())   //.trim().replace(/\n/g, " ").toLowerCase()
      // remove element with call
      const tableTd = cheerio.load(currentLine.children()[0])
      // console.log(tableTd.text())
      //Important to use this function for all text extracted from the tables.
      let term = (tableTd.text())
        .replace(/([^A-z0-9 ])/g, " $1 ")
        .replace(/[0-9]+/g, ' $nmbr$ ')
        .replace(/ +/g," ")
        .trim()
        .toLowerCase()

      term = term.replace(/([^A-z0-9 ])/g, ' ')
        .replace(/[0-9]+/g, ' $nmbr$ ')
        .replace(/ +/g, ' ')
        .replace(/nmbr/g, '$nmbr$')
        .trim().toLowerCase()

      terms.push(term)

      const currentTDclass = (tableTd('td').attr('class') || '').replace(/[0-9]+/g, '').split(' ')

      const childrenClasses = Array.from(
        new Set(
          tableTd('td')
            .find('*').toArray()
            .map( (i, el) => i.attribs.class || '' )
            .join(' ')
            .replace(/[0-9]+/g, '')
            .split(' ')
        )
      )

      let cellClass = Array.from( new Set([...currentTDclass, ...childrenClasses])).filter( (el) => el.length > 0)

      cellClass = cellClass.filter( (el) => allowedFormatKeys.includes(el) == true )

      cellClasses[cellClasses.length] = (term.length > 0 ? cellClass.join(' ') : '').trim()
      //
      // pos_start = c == 0 ? 1 : 0,
      //     pos_middle = c > 0 && c < (total_cols-1) ? 1 : 0,
      //     pos_end = c == (total_cols-1) ? 1 : 0,
      //
      // debugger
      const is_bold = cellClasses[cellClasses.length-1].includes("bold") == true ? 1 : 0,
            is_italic = cellClasses[cellClasses.length-1].includes("italic") == true ? 1 : 0,
            is_indent = cellClasses[cellClasses.length-1].includes("indent") == true ? 1 : 0

      let cuis = umls_data_buffer.cui_concept[term] || "",
          semanticTypes = cuis.split(';').map( item => 
            umls_data_buffer.cui_def[item] ?
              umls_data_buffer.cui_def[item].semTypes
              : []
            ).join(';')

      if ( cuis.trim().length == '' && term.length > 1) {

        // Making sure we attempt something that contains more things than numbers ($nmbr$)
        if ( term.replace(/\$nmbr\$/g, '').trim().toLowerCase().length > 0  ){
          // really get terms that do not exist,
          // I.e ignore those we have tried but got nothing back from metamap (empty)
          if ( umls_data_buffer.cui_concept[term] == undefined ){ 
            console.log("looking up: "+term)

            const mm = await metamap(term);

            cuis = mm.map( item => item.CUI ).join(';')
            semanticTypes = mm.map( item => item.semTypes ).join(';')

            // Now add missing CUIS to buffer to speed up computation.
            mm.forEach( item => {
              umls_data_buffer.cui_def[item.CUI] = {
                matchedText: item.matchedText,
                preferred: item.preferred,
                hasMSH: item.hasMSH,
                semTypes: item.semTypes
              }
            })
            umls_data_buffer.cui_concept[term] = cuis
          }
        }
      }

      // ! where to use feats?
      var feats = [term, is_bold, is_italic, is_indent, cuis, semanticTypes]

      terms_features[terms_features.length] = [term, is_bold, is_italic, is_indent, cuis, semanticTypes]
    }

    const emptyRow = terms.join('') == terms[0]
    const comb = terms[0]+terms[terms.length-1]
    const emptyRow_pvalue = (terms.join('') == comb) && (comb.length > terms[0].length)

    cellClasses[0] = (cellClasses[0].length > 0 ? cellClasses[0]+' ' : '') + 
      ((emptyRow ? ' empty_row' : '') + (emptyRow_pvalue ? ' empty_row_with_p_value' : '')).trim()

    terms_features = terms_features.map( item => [
      ...item.slice(0,4),
      emptyRow ? 1 : 0,
      emptyRow_pvalue ? 1 : 0,
      ...item.slice(4,6)
    ])

    const pred_class = await classify(terms_features)
    predictions[l] = {pred_class, terms, cellClasses, terms_features}
  }

  return predictions
}

async function predictionFeaturesExtractor(actual_table) {
  const result = new Promise(async function(resolve, reject) {
    try{
      const a = cheerio.load(actual_table)
      const lines = a("tr")
      const predictions = feature_extraction(lines);

      resolve(predictions)
    } catch (err) {
      reject(err)
    }
  });

  return result
}

const attemptPrediction = async (actual_table) => {
  const predictions = await predictionFeaturesExtractor(actual_table)

  const terms_matrix = predictions.map(
    e => e.terms.map(
      term => term
    )
  )

  const preds_matrix = predictions.map(
    e => e.terms.map(
      term => e.pred_class[term]
    )
  )

  const format_matrix = predictions.map( e => e.cellClasses.map( cellClass => cellClass ))

  // :-) never used
  // var feature_matrix = predictions.map(
  //   e => e.terms_features.map(
  //     term => term
  //   )
  // )

  // values in this matrix represent the cell contents, and can be: "text", "numeric" or ""
  const content_type_matrix = predictions.map(
    e => e.terms.map(
      term => {
        const _term = term.replace(/\$nmbr\$/g, 0)
        const numberless_size = _term.replace(/([^A-z0-9 ])/g, '')
          .replace(/[0-9]+/g, '')
          .replace(/ +/g, ' ')
          .trim().length
        const spaceless_size = _term.replace(/([^A-z0-9 ])/g, '').replace(/ +/g," ").trim().length
        return spaceless_size == 0 ?
          ''
          : (numberless_size >= spaceless_size/2 ?
            'text'
            : 'numeric')
      }
    )
  )

  const isTermNumber = (term) => {
    term = term ? term : '' ; // Just in case term is undefined

    const statsRelated = ['nmbr', 'mean', 'median', 'percent', 'mode', 'std', 'nan', 'na', 'nr']
    const stats = term.toLowerCase().replace(/[^A-z0-9 ]/gi, " ")
                .replace(/ +/gi," ").trim().split(" ").filter( el => el.length > 1)
                .reduce( (acc, term) => {
                  if (statsRelated.indexOf(term) > -1) { acc.numbers++ };
                  acc.total++;
                  return acc },
                  {numbers: 0, total: 0} )
    return stats.numbers > stats.total/2
  }

  const getColumnAsArray = (matrix, c) => matrix.map( (row,r) => row[c] )

  const getFreqs = (elements) => {
    return elements.reduce( (countMap, word) => {
            countMap.freqs[word] = ++countMap.freqs[word] || 1
            const max = (countMap["max"] || 0)
            countMap["max"] = max < countMap.freqs[word] ? countMap.freqs[word] : max
            countMap["total"] = ++countMap["total"] || 1
            return countMap
        },{total:0,freqs:{}})
  }

  const getMatchingIndices = (elements, items) => elements.reduce(
    (indices, el, i ) => { 
      if ( items.indexOf(el) > -1 ) { indices.push(i) }
      return indices
    }
    ,[]
  )

  const getElementsByIndices = (elements, indices) => elements.reduce(
    (res, el, i ) => {
      if ( indices.indexOf(i) > -1 ){ res.push(elements[i]) }
      return res
    }
    ,[]
  )

  const getTopDescriptors = (freqs, rowFirstCellEmpty = false) => {

    if ( rowFirstCellEmpty ){
      delete freqs['']
    }

    const sum = Object.values(freqs).reduce ( (total, i) => total+i, 0 )
    const avg = (sum / Object.values(freqs).length) * 0.85 // just a bit under the average

    return Object.keys(freqs).reduce( (acc, k, i) => {
      const exclude = ['undefined', undefined, '']
      if ( freqs[k] >= avg && exclude.indexOf(k) < 0){
          acc.push(k)
      }
      return acc
    }, [])
  }

  // Used to check if more than half elements in the column/row are just numbers.
  // This is useful as they can be detected as characteristic_level by the classifier.
  // We use this function to not accept predictions if most elements are just numbers,
  //   I.e very likely a results column/row
  const isMostlyNumbers = (all_terms, equals=false) => {
    const numberTerms_number = all_terms.map( (term) => isTermNumber(term) )
      .reduce( (sum, isNumber) => isNumber ? sum+1 : sum , 0 )
    return equals ? numberTerms_number >= all_terms.length/2 : numberTerms_number > all_terms.length/2
  }

  const max_col = preds_matrix.reduce( (acc,n) => n.length > acc ? n.length : acc, 0);
  const max_row = preds_matrix.length

  //Estimate column predictions.
  let col_top_descriptors = []
  let row_top_descriptors = []

  const format_units = Array.from(new Set(format_matrix.flat()))

  for ( let f in format_units ) {
    const format_key = format_units[f]

    for ( let col = 0 ; col < max_col; col++ ){

      const col_array = getColumnAsArray(format_matrix,col)

      const indices_w_format = getMatchingIndices( col_array, [format_key])
      // If the cells with this formatting are rare. then ignore.
      if ( format_key.indexOf("empty_row") < 0 && indices_w_format.length <= 2){ // Emptyrows are rare so, they are exempt
        continue
      }

      if ( isMostlyNumbers(getColumnAsArray(terms_matrix, col)) ){
        continue
      }

      const pred_array = getColumnAsArray(preds_matrix,col)
      let predictions_w_format = getElementsByIndices( pred_array, indices_w_format)
          predictions_w_format = predictions_w_format.join(";").split(";")

      const content_array = getColumnAsArray(content_type_matrix, col)


      if (getFreqs(content_array).freqs["text"] < (content_array.length/2) ){
        continue;
      }

      const descriptors = getTopDescriptors(getFreqs(predictions_w_format).freqs)

      if ( descriptors.length > 0 ){
        col_top_descriptors[col_top_descriptors.length] = {
          descriptors,
          c: col,
          unique_modifier: format_key.split(" ").join(";")
        }
      }
    }
  }

  // Rows are run once, and not dependant on format, unlike cols.
  for ( let row = 0 ; row < max_row; row++ ) {
    if ( isMostlyNumbers(terms_matrix[row]) ) { // if the row contains mostly numbers, there is no reason to check it.
      continue;
    }

    let row_predictions = preds_matrix[row]
        row_predictions = row_predictions.join(";").split(";")

    let content_array = content_type_matrix[row]
    content_array = content_array.reduce( (acc, it) => {
      if (it.length > 0){ acc.push(it) };
      return acc
    }, []);

    if (getFreqs(content_array).freqs["text"] < (content_array.length/2) ) {
      continue;
    }

    // very likely to be a heading row, since the first empty cell indicates a indentation.
    const rowFirstCellEmpty = terms_matrix[row][0].trim() == ''

    const descriptors = getTopDescriptors( getFreqs(row_predictions).freqs, rowFirstCellEmpty )

    const is_empty_or_P = format_matrix[row][0].indexOf("empty_row") > -1

    if ( is_empty_or_P ){
      continue
    }

    if ( descriptors.length > 0 ){
      row_top_descriptors[row_top_descriptors.length] = {descriptors, c : row , unique_modifier: ""}
    }
  }

  // Estimate row predictions

  // NEed some sanitation here.

  // If many rows, or many columns, chose only top one.

  // col_top_descriptors[col_top_descriptors.length] = {descriptors, c , unique_modifier}
  // row_top_descriptors[row_top_descriptors.length] = {descriptors, c : r , unique_modifier:""}
  // Eliminates rows/cols given a descriptor set that exceeds the amount allowed by the threshold w.r.t. the total.
  const sanitiseItemRepetition = (top_descriptors, total, threshold = 0.40) => {
    const similarRowCounts = top_descriptors.reduce( (acc, row_item, r) => {
      const thekey = row_item.descriptors.join(";")
      let storedRow = acc[thekey]
      if ( storedRow ){
        storedRow.push(row_item.c)
      } else {
        storedRow = [row_item.c]
      }
      acc[thekey] = storedRow
      return acc
    }, {})

    const clean_top_descriptors = []

    for ( let d in top_descriptors ){
      const thekey = top_descriptors[d].descriptors.join(";")

      for ( let r in similarRowCounts ){
          if (similarRowCounts[thekey].length < total * threshold){
            clean_top_descriptors.push(top_descriptors[d])
            break;
          }
      }
    }
    return clean_top_descriptors
  }

  row_top_descriptors = sanitiseItemRepetition( row_top_descriptors, max_row )

  const reduceFormatRedundancy = ( descriptors ) => {
    const references = {}

    const finalDescriptors = []

    for ( let c in descriptors){
      if ( descriptors[c].unique_modifier == '' ){
        references[descriptors[c].c] = descriptors[c].descriptors.join(';')
        finalDescriptors.push(descriptors[c])
      }
    }

    for ( let c in descriptors){
      if ( descriptors[c].descriptors.join(';') != references[descriptors[c].c] ) {
        finalDescriptors.push(descriptors[c])
      }
    }

    return finalDescriptors
  }

  col_top_descriptors = reduceFormatRedundancy(col_top_descriptors)

  return {
    cols: col_top_descriptors,
    rows: row_top_descriptors,
    predictions: predictions
  }
}

module.exports = {
  predictionFeaturesExtractor,
  attemptPrediction,
  classify,
  grouped_predictor
}
