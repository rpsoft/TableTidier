// Load config
import 'dotenv/config'
const CONFIG_PATH = process.env.CONFIG_PATH || process.cwd()
const CONFIG = require(CONFIG_PATH + '/config.json')
const fs = require('fs/promises');
const CsvReadableStream = require('csv-reader');


export async function UMLSData() {
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