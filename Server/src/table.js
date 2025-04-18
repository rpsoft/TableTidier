const fs = require('fs/promises');
const cheerio = require('cheerio');
const path = require('path');
// Import path from config.json
const CONFIG_PATH = process.env.CONFIG_PATH || process.cwd()
const GENERAL_CONFIG = require(CONFIG_PATH + '/config.json')

let dbDriver = null

// Set driver
const tableDBDriverSet = (driver) => dbDriver = driver

console.log("Loading Classifier")
import {attemptPrediction, classify, grouped_predictor} from "./classifier.js"

async function refreshDocuments() {
  const res = await prepareAvailableDocuments()
  available_documents = res.available_documents
  abs_index = res.abs_index
  DOCS = res.DOCS
}

// const readyTable = async (docname, page, collection_id, enablePrediction = false) => {
const readyTable = async (filename, collection_id, enablePrediction = false) => {
  // encode filename
  // prevent invalid filename chars
  
  // const docidEncoded = encodeURIComponent(docname).replaceAll('%20', ' ')+'_'+page+'.html'
  // const docid = docname+'_'+page+'.html'
  // let htmlFile = docidEncoded

  // If an override file exists then use it!. Overrides are those produced by the editor.
  const override_file_exists = await fs.stat(path.join(
    GENERAL_CONFIG.tables_folder_override,
    collection_id.toString(),
    filename.toString()
  ))
  .then(() => true)
  .catch(
    // try to find not encoded version
    (err) => {
      console.log('Is already edited trying to find not encoded version: ' + err)
      return fs.stat(path.join(
        GENERAL_CONFIG.tables_folder_override,
        collection_id.toString(),
        filename.toString()
      ))
    }
  )
  .then(
    () => true,
    () => false
  )
  .catch(err => console.log(err))

  const htmlFolder = path.join(
    // choose path: HTML_TABLES or HTML_TABLES_OVERRIDE/
    override_file_exists?
      GENERAL_CONFIG.tables_folder_override
      : GENERAL_CONFIG.tables_folder,
    collection_id.toString()
  )

  console.log(`Loading Table: ${filename} ${override_file_exists ? ' [Override Folder]': ''}`)
  
  try {
    // Load file
    //  First encoded if it fails try not encoded. 
    const data = await fs.readFile(path.join(htmlFolder, filename), {encoding: 'utf8'})
      .catch((err) => {
        // try not encoded file
        console.log('try to find not encoded version: ' + err)
        return fs.readFile(path.join(htmlFolder, filename), {encoding: 'utf8'})
      })

    // Return if not found
    if ( (!data) || (data.trim().length < 1)) {
      return {status: 'failed', tableTitle: '', tableBody: '', predictedAnnotation: {} }
    }

    // Load CSS styles file
    const data_ss = await fs.readFile(path.join(global.cssFolder, "stylesheet.css"), {encoding: 'utf8'})
    let tablePage;

    try {
      // This removes any non-printable characters
      // data = data.replace(/[^\x20-\x7E]+/g, "")
      // tablePage = cheerio.load(data.replace(/[^\x20-\x7E]+/g, ''));

      // Remove space related characters
      // let str = '\t\n\r this  \n \t   \r  is \r a   \n test \t  \r \n';
      // str = str.replace(/\s+/g, ' ').trim();
      // console.log(str); // logs: "this is a test"
      tablePage = cheerio.load(
        data.replace(/\s+/g, ' ').trim(),
        {}
      );
      if ( !tablePage || data.trim().length < 1 ) {
        // return ({htmlHeader: "",formattedPage : "", title: "" }) //Failed or empty
        return {status: 'failed', tableTitle: '', tableBody: '', predictedAnnotation: {} }
      }

      let tableEdited = false;

      // Prevents infinite loop caused when no tables are present.
      if ( tablePage('table').text().length == 0 ) {
        return {status: 'failed no table tag found', tableTitle: '', tableBody: '', predictedAnnotation: {} }
      }

      // Remove all empty rows from the top.
      while (
        tablePage('table').text().length > 0 &&
        tablePage('table tr:nth-child(1)').text().trim().length == 0
      ) {
        // Prevents infinite loop caused when no more tables rows are present.
        if ( tablePage('tr').length == 0 ) { 
          return {
            status: 'failed',
            tableTitle: '',
            tableBody: '',
            predictedAnnotation: {},
            description: 'The table seems to be empty. Is table empty?',
            errorCode: 'IS_TABLE_EMPTY',
          }
        }

        tablePage('table tr:nth-child(1)').remove()
        tableEdited = true;
      }

      // "remove NCT column on the fly"
      const firstColContent = tablePage('table tr td:nth-child(1)').text().trim()
      if ( firstColContent.indexOf("NCT") == 0 ){
          tablePage('table tr td:nth-child(1)').remove()
          tablePage('table tr td:nth-child(1)').remove()
          tableEdited = true;
      }

      // If exists one of this tags at table page
      // add css class to parent and remove tag
      const tagType = ['strong', 'b', 'i']

      const appendToParent = function (i, el) {
        const content = tablePage(el).html();
        const parent = tablePage(el).parent();
        tablePage(el).remove();
        tablePage(parent).text(content)
      }

      for (const tag of tagType) {
        const tagsFound = tablePage(tag)
        if (tagsFound.length == 0) {
          // Try next tag
          continue
        }
        const className = tag == 'i' ? 'italic': 'bold'
        // fixing strong, b and i tags on the fly. using 'bold' and 'italic' classes is preferred
        // check for th parent
        for (const parentTag of ['th', 'td']) {
          let tagsClosest = tagsFound.closest(parentTag)

          if (tagsClosest.length == 0) {
            continue
          }

          // Set css class to th or td
          tagsClosest.addClass(className)

          tagsClosest.each(function (i, el) {
            console.log(tablePage(el).html())
          })

          tagsFound.each(appendToParent)
          tableEdited = true
        }
      }

      if ( tableEdited ) {
        console.log('Table corrected on the fly: '+path.join(htmlFolder, filename));
        fs.writeFile(path.join(htmlFolder, filename),  tablePage.html())
        .catch((err) => {
          console.log(`Error: Table corrected on the fly: ${path.join(htmlFolder, filename)} ` + err);
          if (err) throw err;
        });
      }
    } catch (err) {
      // console.log(JSON.stringify(e)+" -- " + JSON.stringify(data))
      return { htmlHeader: '', formattedPage: '', title: '' }
    }

    let htmlHeader = ''

    const findHeader = (tablePage, tag) => {
      let totalTextChars = 0
      let htmlHeader = ''
      const searchElementsByCssClass = tablePage(tag)

      if (searchElementsByCssClass.length == 0) {
        return {htmlHeader, totalTextChars}
      }
      // Unplug searchElementsByCssClass from dom (tablePage)
      const headerNodes = searchElementsByCssClass.remove()

      // Table Header max length text limit
      const textLimit = 400

      // For each element found with tag
      //  Add text to a new tr
      // https://cheerio.js.org/classes/Cheerio.html#each
      // Need to use a function to have access to 'this' var
      headerNodes.each(function (i, el) {
        // console.log(cheerio.load(this).text())
        // cheerio(headerNodes[h]).css("font-size","20px");

        // Extract text from tag
        const headText = cheerio.load(this).text().trim()
        const actualText = headText.length > textLimit ?
          headText.slice(0, textLimit-1) + ' [...] '
          : headText
        
        // Count number characters added
        totalTextChars += actualText.length

        // Add text to new tr element 
        htmlHeader = htmlHeader + 
          '<tr ><td style="font-size:20px; font-weight:bold; white-space: normal;">' +
            actualText +
          '</td></tr>'
      })

      return {htmlHeader, totalTextChars}
    }

    const possible_tags_for_title = ['.headers','.caption','.captions','.article-table-caption']

    for (let t in possible_tags_for_title){
      htmlHeader = findHeader(tablePage, possible_tags_for_title[t])
      if ( htmlHeader.totalTextChars > 0 ) {
        break;
      }
    }

    htmlHeader = '<table>'+htmlHeader.htmlHeader+'</table>'

    // var htmlHeaderText = cheerio(htmlHeader).find('td').text()

    let actual_table = tablePage('table').parent().html();
    actual_table = cheerio.load(actual_table);

    // The following lines remove, line numbers present in some tables, as well as positions in headings derived from the excel sheets  if present.
    let colum_with_numbers = actual_table(
      'tr > td:nth-child(1), tr > td:nth-child(2), tr > th:nth-child(1), tr > th:nth-child(2)'
    )

    if ( colum_with_numbers.text().replace( /[0-9]/gi, '').replace(/\s+/g, '').toLowerCase() === 'row/col' ){
      colum_with_numbers.remove()
    }

    if ( actual_table('thead').text().trim().indexOf('1(A)') > -1 ) {
      actual_table('thead').remove();
    }
    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Correction here for bold

    actual_table = actual_table.html();

    // var ss = "<style>"+data_ss+" td {width: auto;} tr:hover {background: aliceblue} td:hover {background: #82c1f8} col{width:100pt} </style>"
    const styles = actual_table.includes('<style type="text/css">.indent0') ? '' : `<style>${data_ss}</style>`

    const formattedPage = actual_table.includes("tr:hover") == false ? `<div>${styles}${actual_table}</div>` : actual_table

    let predicted = {};

    if ( enablePrediction ) {
      console.log('predicting')
      predicted = await attemptPrediction(actual_table);
    }

    return {
      status: 'good',
      tableTitle: htmlHeader,
      tableBody: formattedPage,
      predictedAnnotation: predicted
    }
  } catch (err) {
    console.log(err)
    return {status: 'bad'}
  }
}

const prepareAvailableDocuments = async (collection_id) => {
  if (!dbDriver) {
    throw new Error('Required DB Driver')
  }

  const ftop = []
  const ftyp = []
  const fgroup = []
  const flgroup = []

  const hua = false

  const type_lookup = {
    'Baseline Characteristics': 'baseline_table',
    'Results with subgroups': 'result_table_subgroup',
    'Results without subgroups': 'result_table_without_subgroup',
    'Other': 'other_table',
    'Unassigned': 'NA'
  }

  // * :-) never gets in. ftyp length always 0
  for ( let i = 0; i < ftyp.length; i++) {
    ftyp[i] = type_lookup[ftyp[i]]
  }

  let filtered_docs_ttype = []

  const allAnnotations = await dbDriver.annotationResultsGet()

  const all_annotated_docids = Array.from(new Set(allAnnotations.rows.reduce( (acc,ann) => {
      acc = acc ? acc : []

      acc.push(ann.docid+"_"+ann.page);

      return acc
    }, [] )))

  if( ftop.length+ftyp.length > 0 ) {
    filtered_docs_ttype = allAnnotations.rows.reduce( (acc,ann) => {
      acc = acc ? acc : []

      if ( ann.tableType != "" && ftyp.indexOf(ann.tableType) > -1 ){
          acc.push(ann.docid+"_"+ann.page);
      }

      return acc
    }, [] )

    filtered_docs_ttype = Array.from(new Set(filtered_docs_ttype));
  }

  const ordered_Splits = []
  const ordered_docs_to_label = []

  // * :-) never used allLabelled
  let allLabelled = []
  allLabelled = allLabelled.map( d => d+".html")

  let selected_group_docs = []

  if (fgroup == "all" || (fgroup.indexOf("all") > -1)){
    selected_group_docs = ordered_Splits.flat()
  } else {
    for ( i in fgroup ) {
      const group_index = parseInt(fgroup[i])-1;
      selected_group_docs = [...selected_group_docs, ...ordered_Splits[group_index]]
    }
  }

  let selected_label_docs = []

  if (flgroup == "all" || (flgroup.indexOf("all") > -1)){
    selected_label_docs = ordered_docs_to_label.flat()
  } else {
    for ( i in flgroup ) {
      const label_index = parseInt(flgroup[i])-1;
      selected_label_docs = [...selected_label_docs, ...ordered_docs_to_label[label_index]]
    }
  }

  selected_group_docs = selected_group_docs.flat();

  const available_documents = {}
  const abs_index = []
  let DOCS = []

  const fixVersionOrder = (a) => {
    const i = a.indexOf("v");
    if ( i > -1 ) {
      return a.slice(0,i)+a.slice(i+2,a.length)+a.slice(i, i+2)
    }
    return a;
  }


  let folderItems 
  try {
    folderItems = await fs.readdir( path.join(tables_folder, collection_id) )
  } catch(err) {
    console.log(err)
  }

  // * :-) never used label_filters and unannotated
  var label_filters = flgroup;
  var unannotated = ordered_Splits;

  if ( selected_group_docs.length > 0 ) {
    DOCS = selected_group_docs
  }

  if ( selected_label_docs.length > 0 ) {
    DOCS = selected_label_docs
  }

  if ( DOCS.length < 1) {
    if ( !folderItems ){
      folderItems = []
    }
    folderItems = folderItems.reduce( async (acc,filename) => {
        const doc_path = path.join(
          tables_folder,
          collection_id.toString(),
          filename
        )
        let docPathExist = true
        try {
          const fd = await fs.open(doc_path)
          fd.close()
        } catch (err) {
          docPathExist = false
        }
        const docPathIsADirecotry = await fs.lstatSync(doc_path).isDirectory()
        if ( docPathExist && docPathIsADirecotry == false ) {
          acc.push(filename)
        }
        return acc
      },
      []
    )

    DOCS = folderItems.sort( (a,b) => {return fixVersionOrder(a).localeCompare(fixVersionOrder(b))} );
  }

  DOCS = DOCS.sort( (a, b) => {
    a = a.match(/([\w\W]*)_([0-9]*).html/)
    b = b.match(/([\w\W]*)_([0-9]*).html/)
    const st_a = {docid: a[1], page:a[2]}
    const st_b = {docid: b[1], page:b[2]}
    const dd = st_a.docid.localeCompare(st_b.docid);
    return dd == 0 ? parseInt(st_a.page) - parseInt(st_b.page) : dd
  });

  DOCS = DOCS.reduce( (acc, docfile) => {
    const file_parts = docfile.match(/([\w\W]*)_([0-9]*).html/)

    const docid = file_parts[1]
    const docid_V = file_parts[1]
    const page = file_parts[2]

    if (
      (ftop.length + ftyp.length > 0) && 
      msh_categories &&
      msh_categories.catIndex 
    ) {
      const topic_enabled = ftop.length > 0

      const topic_intersection = ftop.reduce( (acc, cat) => {
          return acc || (msh_categories.catIndex[cat].indexOf(docid) > -1)
        }, false
      );

      if ( ftop.indexOf("NA") > -1 ) {
        if ( msh_categories.pmids_w_cat.indexOf(docid) < 0 ){
          topic_intersection = true
        }
      }

      const type_enabled = ftyp.length > 0
      const type_intersection = (
        type_enabled && (filtered_docs_ttype.length > 0) &&
        (filtered_docs_ttype.indexOf(docid_V+"_"+page) > -1)
      )

      const isAnnotated = all_annotated_docids.indexOf(docid_V+"_"+page) > -1

      const show_not_annotated = !hua

      let accept_docid = false

      // Logic to control the filter.
      // It depends in many variables with many controlled outcomes, so it looks a bit complicated
      if ( topic_enabled && type_enabled ) {

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

  try {
    for ( let d in DOCS ){

      const docfile = DOCS[d]

      const fileElements = docfile.match(/([\w\W]*)_([0-9]*).html/);
      const docid = fileElements[1]
      const page = fileElements[2] //.split(".")[0]
      const extension = ".html" //fileElements[1].split(".")[1]

      if ( available_documents[docid] ) {
        const prev_data = available_documents[docid]
        prev_data.pages[prev_data.pages.length] = page
        prev_data.abs_pos[prev_data.abs_pos.length] = abs_index.length
        prev_data.maxPage = page > prev_data.maxPage ? page : prev_data.maxPage
        available_documents[docid] = prev_data
      } else {
        available_documents[docid] = {
          abs_pos: [ abs_index.length ],
          pages: [ page ],
          extension,
          maxPage: page
        }
      }

      abs_index[abs_index.length] = {docid, page, extension, docfile}
    }

    return {
      available_documents,
      abs_index,
      DOCS
    }
  } catch (err) {
    console.log('FAILED: ' + JSON.stringify(err))
    return err
  }
}

module.exports = {
  tableDBDriverSet,
  refreshDocuments,
  readyTable,
  prepareAvailableDocuments,
}
