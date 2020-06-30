"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var express = require('express');

var app = express();

var bodyParser = require('body-parser');

var csv = require('csv-parser');

var html = require("html");

var fs = require('fs');

var request = require("request");

var cheerio = require('cheerio'); //requiring path and fs modules


var path = require('path'); //joining path of directory


var directoryPath = path.join(__dirname, '../../Server/'); //passsing directoryPath and callback function

var sys = require('util');

var exec = require('child_process').exec;

var cors = require('cors');

app.use(cors("*"));
Object.defineProperty(Array.prototype, 'flat', {
  value: function value() {
    var depth = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
    return this.reduce(function (flat, toFlatten) {
      return flat.concat(Array.isArray(toFlatten) && depth > 1 ? toFlatten.flat(depth - 1) : toFlatten);
    }, []);
  }
});

var createCsvWriter = require('csv-writer').createObjectCsvWriter;

fs.unlink('cui_concept.csv', function (err) {
  if (err) {
    console.log("file already deleted");
  }

  ;
  console.log('cui_concept.csv was deleted');
});
fs.unlink('cui_def.csv', function (err) {
  if (err) {
    console.log("file already deleted");
  }

  ;
  console.log('cui_def.csv was deleted');
});
var concept_cui_csvWriter = createCsvWriter({
  path: 'cui_concept.csv',
  header: [{
    id: 'text',
    title: 'Text'
  }, {
    id: 'cuis',
    title: 'CUIS'
  }]
});
var cui_def_csvWriter = createCsvWriter({
  path: 'cui_def.csv',
  header: [{
    id: 'cui',
    title: 'CUI'
  }, {
    id: 'matchedtext',
    title: 'matchedText'
  }, {
    id: 'preferred',
    title: 'preferred'
  }, {
    id: 'hasmsh',
    title: 'hasMSH'
  }, {
    id: 'semTypes',
    title: 'semTypes'
  }]
});

function listFiles(_x) {
  return _listFiles.apply(this, arguments);
}

function _listFiles() {
  _listFiles = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(directoryPath) {
    var files;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            files = new Promise(function (resolve, reject) {
              fs.readdir(directoryPath + "HTML_TABLES", function (err, fils) {
                //handling error
                if (err) {
                  reject(err);
                }

                resolve(fils);
              });
            });
            _context.next = 3;
            return files;

          case 3:
            return _context.abrupt("return", _context.sent);

          case 4:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _listFiles.apply(this, arguments);
}

function cleanTerm(term) {
  term = term.toLowerCase().replace(/[^A-z0-9 ]/gi, " ").replace(/[0-9]+/gi, " $nmbr$ ").replace(/ +/gi, " ").trim();
  return term;
}

function extractMMData(r) {
  try {
    r = JSON.parse(r); // debugger

    r = r.AllDocuments[0].Document.Utterances.map(function (utterances) {
      return utterances.Phrases.map(function (phrases) {
        return phrases.Mappings.map(function (mappings) {
          return mappings.MappingCandidates.map(function (candidate) {
            return {
              CUI: candidate.CandidateCUI,
              matchedText: candidate.CandidateMatched,
              preferred: candidate.CandidatePreferred,
              hasMSH: candidate.Sources.indexOf("MSH") > -1,
              semTypes: candidate.SemTypes.join(";")
            };
          });
        });
      });
    }).flat().flat().flat(); // This removes duplicate cuis

    r = r.reduce(function (acc, el) {
      if (acc.cuis.indexOf(el.CUI) < 0) {
        acc.cuis.push(el.CUI);
        acc.data.push(el);
      }

      ;
      return acc;
    }, {
      cuis: [],
      data: []
    }).data;
    return r;
  } catch (e) {
    return [];
  }
}

function askMM(_x2) {
  return _askMM.apply(this, arguments);
}

function _askMM() {
  _askMM = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee2(term) {
    var mm_concepts;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            // debugger
            mm_concepts = new Promise(function (resolve, reject) {
              var dir = exec('curl -X POST -d "input=' + term + '&args=-AsItd+ --JSONf 2 --prune 2 -V USAbase" "http://localhost:8080/form" | tail -n +3 ', function (err, stdout, stderr) {
                if (err) {
                  reject(err);
                } //console.log(stdout)


                resolve(extractMMData(stdout));
              });
              dir.on('exit', function (code) {// exit code is code
              });
            });
            _context2.next = 3;
            return mm_concepts;

          case 3:
            return _context2.abrupt("return", _context2.sent);

          case 4:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _askMM.apply(this, arguments);
}

function main() {
  return _main.apply(this, arguments);
} // {CUI: "C0027051", matchedText: "Infarction, Myocardial", preferred: "Myocardial Infarction", hasMSH: true}


function _main() {
  _main = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee3() {
    var files, td_strings, f, file_exists, $, concepts, w, conps, cuis, e;
    return _regenerator["default"].wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return listFiles(directoryPath);

          case 2:
            files = _context3.sent;
            td_strings = [];
            _context3.t0 = _regenerator["default"].keys(files);

          case 5:
            if ((_context3.t1 = _context3.t0()).done) {
              _context3.next = 14;
              break;
            }

            f = _context3.t1.value;
            _context3.next = 9;
            return fs.existsSync(directoryPath + "/HTML_TABLES_OVERRIDE/" + files[f]);

          case 9:
            file_exists = _context3.sent;

            if (file_exists) {
              // console.log("from override")
              $ = cheerio.load(fs.readFileSync(directoryPath + "/HTML_TABLES_OVERRIDE/" + files[f]));
            } else {
              $ = cheerio.load(fs.readFileSync(directoryPath + "/HTML_TABLES/" + files[f]));
            }

            $("td").each(function (i, elem) {
              var term = cleanTerm($(this).text());
              td_strings[td_strings.length] = term;
            });
            _context3.next = 5;
            break;

          case 14:
            td_strings = Array.from(new Set(td_strings));
            concepts = [];
            _context3.t2 = _regenerator["default"].keys(td_strings);

          case 17:
            if ((_context3.t3 = _context3.t2()).done) {
              _context3.next = 31;
              break;
            }

            w = _context3.t3.value;

            if (!(td_strings[w].length < 2 && td_strings[w].split(" ").length > 12)) {
              _context3.next = 21;
              break;
            }

            return _context3.abrupt("continue", 17);

          case 21:
            console.log(td_strings[w] + " --: " + w + " / " + td_strings.length);
            _context3.next = 24;
            return askMM(td_strings[w]);

          case 24:
            conps = _context3.sent;
            concepts = [].concat((0, _toConsumableArray2["default"])(concepts), (0, _toConsumableArray2["default"])(conps));
            cuis = [];

            for (e in conps) {
              cuis.push(conps[e].CUI);
              cui_def_csvWriter.writeRecords([{
                cui: conps[e].CUI,
                matchedtext: conps[e].matchedText,
                preferred: conps[e].preferred,
                hasmsh: conps[e].hasMSH,
                semTypes: conps[e].semTypes
              }]).then(function () {//console.log("'"+conps[e].CUI+"','"+conps[e].matchedText+"','"+conps[e].preferred+"','"+conps[e].hasMSH+"'")
              });
            }

            concept_cui_csvWriter.writeRecords([{
              text: td_strings[w],
              cuis: cuis.join(";")
            }]).then(function () {//console.log( td_strings[w]+ ', '+cuis.join(";") );
            });
            _context3.next = 17;
            break;

          case 31:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));
  return _main.apply(this, arguments);
}

main(); //
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