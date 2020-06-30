"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var sys = require('util');

var exec = require('child_process').exec;

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
    // debugger

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

function metamap(_x) {
  return _metamap.apply(this, arguments);
}

function _metamap() {
  _metamap = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(term) {
    var mm_concepts;
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            // removing single characters in the term/phrase
            term = term.split(" ").map(function (item) {
              return item.length > 1 && item !== "$nmbr$" ? item : "";
            }).join(""); // debugger

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
            _context.next = 4;
            return mm_concepts;

          case 4:
            return _context.abrupt("return", _context.sent);

          case 5:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));
  return _metamap.apply(this, arguments);
}

module.exports = {
  metamap: metamap
};