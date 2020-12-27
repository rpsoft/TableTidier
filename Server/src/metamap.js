var sys = require('util')
var exec = require('child_process').exec;

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
    // debugger
    r = r.reduce( (acc,el) => {if ( acc.cuis.indexOf(el.CUI) < 0 ){acc.cuis.push(el.CUI); acc.data.push(el)}; return acc }, {cuis: [], data: []} ).data
    return r
  } catch (e){
    return []
  }
}

async function metamap(term){
  // removing single characters in the term/phrase

  term = term.split(" ").map( item => item.length > 1 && item !== "$nmbr$" ? item : "" ).join("")
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


module.exports = {
  metamap
}
