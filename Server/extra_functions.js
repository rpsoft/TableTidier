"use strict";

global.sleep = function (ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
};

Object.defineProperty(Array.prototype, 'flat', {
  value: function value() {
    var depth = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
    return this.reduce(function (flat, toFlatten) {
      return flat.concat(Array.isArray(toFlatten) && depth > 1 ? toFlatten.flat(depth - 1) : toFlatten);
    }, []);
  }
}); //Important to use this function for all text extracted from the tables.

global.prepare_cell_text = function (text) {
  return text.replace(/([^A-z0-9 ])/g, " $1 ").replace(/[0-9]+/g, ' $nmbr$ ').replace(/ +/g, " ").trim().toLowerCase();
}; //
// var cleanTerm = (term) => {
//
//   term = term.replace(/[^A-z0-9 ]/gi, " ").replace(/[0-9]+/gi, " $nmbr$ " ).replace(/ +/gi," ").trim().toLowerCase()
//
//   return term
// }


function extractMMData(r) {
  try {
    r = JSON.parse(r);
    r = r.AllDocuments[0].Document.Utterances.map(function (utterances) {
      return utterances.Phrases.map(function (phrases) {
        return phrases.Mappings.map(function (mappings) {
          return mappings.MappingCandidates.map(function (candidate) {
            return {
              CUI: candidate.CandidateCUI,
              matchedText: candidate.CandidateMatched,
              preferred: candidate.CandidatePreferred,
              hasMSH: candidate.Sources.indexOf("MSH") > -1
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