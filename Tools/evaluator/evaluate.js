const csv = require('csv-parser');
const fs = require('fs');

var testData = {}
var gold = {}

var testFile = ""
var goldFile = ""
var referenceFile = ""

process.argv.forEach(function (val, index, array) {
  //console.log(index + ': ' + val);

  switch (index) {
    case 2:
      goldFile = val
      break;
    case 3:
      testFile = val
      break;
    case 4:
      referenceFile = val
      break;
    default:

  }

});



function cleanHeaders(headers) {

      headers = headers.split(";")

      var possible_headers = ['docid_page', 'baseline_level_1', 'baseline_level_2', 'arms', 'measures', 'subgroup_name', 'subgroup_level', 'p-interaction', 'outcomes', 'other', 'time/period','indent1','indent2','indent3','indent4','indent5']
      var override_headers = ['docid_page', 'characteristic_name', 'characteristic_level', 'arms', 'measures', 'characteristic_name', 'characteristic_level', 'p-interaction', 'outcomes', 'other', 'time/period','indented','indented','indented','indented','indented']


      for ( var c in headers){

          var i = possible_headers.indexOf(headers[c])

          if( i > -1 ) {
            headers[c] = override_headers[i]
          }

      }

      return headers.join(";")
}

async function readReferenceFile(file){
  if (file.length == 0){
    return [];
  }
  var res = new Promise( (resolve,reject) => {
    try {
      if ( file.length > 0 ){
      fileData = []
      fs.createReadStream(file)
        .pipe(csv())
        .on('data', (row) => {
          //console.log(row);
          // debugger
          fileData.push(row.docid+"_"+row.page)

        })
        .on('end', () => {
          resolve(fileData)
        });
      }
    } catch(r){
        reject([])
    }

    });

    return await res;
}

async function readDataFromFile(file){

  var res = new Promise( (resolve,reject) => {
    try {
      if ( file.length > 0 ){
      fileData = {}
      fs.createReadStream(file)
        .pipe(csv())
        .on('data', (row) => {

          var newData = {location: row.location, number: row.number, content: cleanHeaders(row.content), qualifiers: cleanHeaders(row.qualifiers) }

          var data = fileData[row.docid+"_"+row.page]

          if (!data ){
            data = []
          }

          data[data.length] = newData
          fileData[row.docid+"_"+row.page] = data

        })
        .on('end', () => {
          resolve(fileData)
        });
      }
    } catch(r){

        reject([])
    }

    });

    return await res;
}

maxChanges = (ann1,ann2) => {
  return Math.max(ann1.content.split(";").length, ann2.content.split(";").length)
       + Math.max(ann1.qualifiers.split(";").length,ann2.qualifiers.split(";").length) + 2
}

matchScore = (ann1,ann2) => {
  var max_changes = maxChanges ( ann1,ann2)

  var changes_needed = ann1.location == ann2.location ? 0 : 1
      changes_needed += ann1.number == ann2.number ? 0 : 1

  var ann1_contents = ann1.content.split()

  for( var c in ann1_contents ){
      changes_needed += ann2.content.indexOf(ann1_contents[c]) > -1 ? 0 : 1
  }

  var ann2_contents = ann2.content.split()

  for( var c in ann2_contents ){
      changes_needed += ann1.content.indexOf(ann2_contents[c]) > -1 ? 0 : 1
  }

  var ann1_qualifiers = ann1.qualifiers.split()

  for( var c in ann1_qualifiers ){
      changes_needed += ann2.qualifiers.indexOf(ann1_qualifiers[c]) > -1 ? 0 : 1
  }

  var ann2_qualifiers = ann2.qualifiers.split()

  for( var c in ann2_qualifiers ){
      changes_needed += ann1.qualifiers.indexOf(ann2_qualifiers[c]) > -1 ? 0 : 1
  }


  //console.log(1+" - "+ changes_needed+" / "+ max_changes);

  return 1 - (changes_needed/max_changes)
}


async function main(){
    var testData = await readDataFromFile(testFile)
    var goldData = await readDataFromFile(goldFile)

    var reference = await readReferenceFile(referenceFile)
    debugger
    for ( var g_did in goldData ){

      if ( referenceFile.length > 0 ){
        if ( reference.length > 0 ){
          if ( reference.indexOf(g_did) < 0) {
            continue;
          }
        }
      }
      var gold_table
      var test_table
      var buffer_it

      try{
        gold_table = Array.from(goldData[g_did])
        test_table = Array.from(testData[g_did])
        buffer_it = Array.from(test_table)
      } catch (e){


        if ( !test_table || test_table.length < 1 ){
          console.log(g_did+", 0.00")
        }
        continue


      }

        var max_annotations_number = Math.max(gold_table.length,test_table.length)

        var match_scores = []

        while( test_table.length > 0 ){


          var max_score = 0
          var max_score_index = -1


          for (var g in gold_table){ // We want to compare each of the gold standard annotation lines, to the testing ones to find the best match and take that out of the next comparison.


              for (var t in test_table ) {
                  var score = matchScore(gold_table[g],test_table[t])

                  if ( score >= max_score ) {
                      max_score = score
                      max_score_index = t
                  }

              }


          }

          test_table.splice(max_score_index, 1)
          match_scores[match_scores.length] = max_score


        }

        var scores_sum = match_scores.reduce(function(a, b) { return a + b; }, 0);

        var average = scores_sum / (max_annotations_number)

        console.log(g_did+", "+average.toFixed(2))
    }

}

main();
