// var sys = require('util')
const exec = require('child_process').exec;

/*
//  Restrict to UMLS Sources with Restriction Level 0-1
const UMLS_RESTRICT_SOURCES = [
  'AIR',             'AOD',             'NCI_ACC-AHA',     'ATC',
  'AOT',             'NCI_BioC',        'NCI_BRIDG',       'NCI_BRIDG_3_0_3',
  'NCI_BRIDG_5_3',   'NCI_caDSR',       'NCI_CRCH',        'NCI_CTEP-SDC',
  'NCI_CDISC-GLOSS', 'NCI_CDISC',       'NCI_CELLOSAURUS', 'NCI_CBDD',
  'NCI_CCPS',        'CCS',             'CCSR_ICD10CM',    'CCSR_ICD10PCS',
  'RAM',             'NCI_CTDC',        'NCI_CTRP',        'NCI_CTCAE_3',
  'NCI_CTCAE',       'NCI_CTCAE_5',     'CHV',             'NCI_CareLex',
  'COSTAR',          'CST',             'CSP',             'UWDA',
  'NCI_DICOM',       'DRUGBANK',        'DXP',             'NCI_EDQM-HC',
  'MTHSPL',          'NCI_FDA',         'FMA',             'GO',
  'NCI_GENC',        'NCI_GAIA',        'MCM',             'HCPCS',
  'HL7V2.5',         'HL7V3.0',         'HGNC',            'HPO',
  'ICD10PCS',        'MTHICD9',         'ICPCBAQ',         'ICPCDAN',
  'ICPCDUT',         'ICPCFIN',         'ICPCFRE',         'ICPCGER',
  'ICPCHEB',         'ICPCHUN',         'ICPCITA',         'ICPCNOR',
  'ICPCPOR',         'ICPCSPA',         'ICPCSWE',         'ICD9CM',
  'ICPC',            'NCI_ICH',         'NCI_INC',         'NCI_JAX',
  'NCI_KEGG',        'LCH',             'LCH_NW',          'LNC',
  'LNC-ZH-CN',       'LNC-NL-NL',       'LNC-ET-EE',       'LNC-FR-BE',
  'LNC-FR-CA',       'LNC-FR-FR',       'LNC-DE-AT',       'LNC-DE-DE',
  'LNC-EL-GR',       'LNC-IT-IT',       'LNC-KO-KR',       'LNC-PL-PL',
  'LNC-PT-BR',       'LNC-RU-RU',       'LNC-ES-AR',       'LNC-ES-MX',
  'LNC-ES-ES',       'LNC-TR-TR',       'MVX',             'MED-RT',
  'MEDLINEPLUS',     'MEDLINEPLUS_SPA', 'MSH',             'MSHGER',
  'MTHCMSFRF',       'MTH',             'MTHMST',          'MTHMSTFRE',
  'MTHMSTITA',       'NCI_PID',         'VANDF',           'NCBI',
  'NCI_DTP',         'NCI_NCI-GLOSS',   'NCI_DCP',         'NCI_GDC',
  'NCI_NCI-HL7',     'NCI_NCI-HGNC',    'NCI_ICDC',        'NCISEER',
  'NCI',             'NCI_NCPDP',       'NCI_NICHD',       'OMIM',
  'NCI_PCDC',        'PDQ',             'NCI_PI-RADS',     'QMR',
  'CDCREC',          'NCI_RENI',        'RXNORM',          'SOP',
  'SRC',             'SPN',             'TKMT',            'NCI_CDC',
  'NCI_UCUM',        'USP',             'USPMG',           'CVX',
  'NCI_ZFin',        'CCC',             'JABL',            'DMDICD10',
  'MMSL',            'OMS',             'UMD',             'DMDUMD'
].join(',')

// Function that filters sources not valid with 2018 metamap version
function sourcesFilterNotValid() {
  Promise.all(
    // UMLS_RESTRICT_SOURCES.slice(0, 10).map(source => axios({                                                                                                                                                    
    UMLS_RESTRICT_SOURCES.map(source => axios({
        method: 'post',
        url: 'http://localhost:8088/form',
        data: `input=aspirin&args=-AsItd+ -R ${source} --JSONf 2 --prune 2 -V USAbase`,
    }))
  ).then(result => {
    let sourcesValid=[]
    let menosdemil = 0
    result.map((body, index) => {
        data = body.data;
        data.length < 1000 ?
            menosdemil++
            : sourcesValid.push(UMLS_RESTRICT_SOURCES[index])
  
        console.log(`${index}. source ${UMLS_RESTRICT_SOURCES[index]} size ${data.length} ${data.length < 1000? `menosdemil ${menosdemil}`: ''}`);
    })
    console.dir(sourcesValid, { maxArrayLength: null })
  })
}
*/

// Filtered for metamap 2018 version sources
const UMLS_RESTRICT_SOURCES = [
  'AIR',             'AOD',          'ATC',           'AOT',
  'NCI_BioC',        'NCI_BRIDG',    'NCI_CRCH',      'NCI_CTEP-SDC',
  'NCI_CDISC-GLOSS', 'NCI_CDISC',    'CCS',           'RAM',
  'NCI_CTRP',        'NCI_CTCAE_3',  'NCI_CTCAE',     'NCI_CTCAE_5',
  'CHV',             'NCI_CareLex',  'COSTAR',        'CST',
  'CSP',             'UWDA',         'NCI_DICOM',     'DRUGBANK',
  'DXP',             'MTHSPL',       'NCI_FDA',       'FMA',
  'GO',              'NCI_GENC',     'NCI_GAIA',      'MCM',
  'HCPCS',           'HL7V2.5',      'HL7V3.0',       'HGNC',
  'HPO',             'ICD10PCS',     'MTHICD9',       'ICPCBAQ',
  'ICPCDAN',         'ICPCDUT',      'ICPCFIN',       'ICPCFRE',
  'ICPCGER',         'ICPCHEB',      'ICPCHUN',       'ICPCITA',
  'ICPCNOR',         'ICPCPOR',      'ICPCSPA',       'ICPCSWE',
  'ICD9CM',          'ICPC',         'NCI_ICH',       'NCI_JAX',
  'NCI_KEGG',        'LCH',          'LCH_NW',        'LNC',
  'LNC-ZH-CN',       'LNC-NL-NL',    'LNC-ET-EE',     'LNC-FR-BE',
  'LNC-FR-CA',       'LNC-FR-FR',    'LNC-DE-AT',     'LNC-DE-DE',
  'LNC-EL-GR',       'LNC-IT-IT',    'LNC-KO-KR',     'LNC-PT-BR',
  'LNC-RU-RU',       'LNC-ES-AR',    'LNC-ES-ES',     'LNC-TR-TR',
  'MVX',             'MED-RT',       'MEDLINEPLUS',   'MSH',
  'MSHGER',          'MTHCMSFRF',    'MTH',           'MTHMST',
  'MTHMSTFRE',       'MTHMSTITA',    'NCI_PID',       'VANDF',
  'NCBI',            'NCI_DTP',      'NCI_NCI-GLOSS', 'NCI_DCP',
  'NCI_NCI-HL7',     'NCI_NCI-HGNC', 'NCISEER',       'NCI',
  'NCI_NCPDP',       'NCI_NICHD',    'OMIM',          'PDQ',
  'NCI_PI-RADS',     'QMR',          'NCI_RENI',      'RXNORM',
  'SOP',             'SRC',          'SPN',           'TKMT',
  'NCI_CDC',         'NCI_UCUM',     'USP',           'USPMG',
  'CVX',             'NCI_ZFin',     'CCC',           'JABL',
  'DMDICD10',        'MMSL',         'OMS',           'UMD',
  'DMDUMD'
].join(',')



function extractMMData(r) {
  try{
    r = JSON.parse(r)
    // debugger
    r = r.AllDocuments[0].Document.Utterances.map(
                    utterances => utterances.Phrases.map(
                      phrases => phrases.Mappings.map(
                        mappings => mappings.MappingCandidates.map(
                          candidate => ({
                            CUI: candidate.CandidateCUI,
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
    // debugger
    r = r.reduce((acc, el) => {
      if ( acc.cuis.indexOf(el.CUI) < 0 ) {
        acc.cuis.push(el.CUI); acc.data.push(el)
      }
      return acc
    }, {cuis: [], data: []} ).data
    return r
  } catch (e){
    return []
  }
}

async function metamap(term){
  // removing single characters in the term/phrase

  term = term.split(" ")
    .map( item => item.length > 1 && item !== "$nmbr$" ? item : "" )
    .join("")
    // debugger
  let mm_concepts = new Promise((resolve, reject) => {
    let dir = exec(
      `curl -X POST -d "input=${term}&args=-AsItd+ -R ${UMLS_RESTRICT_SOURCES} --JSONf 2 --prune 2 -V USAbase" "http://localhost:8088/form" | tail -n +3 `,
      function(err, stdout, stderr) {
        if (err) {
          reject(err)
        }
        //console.log(stdout)

        resolve(extractMMData(stdout));
    });

    dir.on('exit', function (code) {
      // exit code is code
    });
  })

  return await mm_concepts
}

module.exports = {
  metamap
}

