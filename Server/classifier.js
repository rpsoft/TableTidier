"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _taggedTemplateLiteral2 = _interopRequireDefault(require("@babel/runtime/helpers/taggedTemplateLiteral"));

var _metamap = require("./metamap.js");

function _templateObject3() {
  var data = (0, _taggedTemplateLiteral2["default"])(["\n        groupedPredict(", ")\n      "]);

  _templateObject3 = function _templateObject3() {
    return data;
  };

  return data;
}

function _templateObject2() {
  var data = (0, _taggedTemplateLiteral2["default"])(["\n        groupedPredict(", ")\n      "]);

  _templateObject2 = function _templateObject2() {
    return data;
  };

  return data;
}

function _templateObject() {
  var data = (0, _taggedTemplateLiteral2["default"])(["\n  import warnings\n  warnings.filterwarnings(\"ignore\", category=FutureWarning)\n  warnings.filterwarnings(\"ignore\", category=UserWarning)\n  import pandas as pd\n  import pickle\n  import sys\n\n  model = pickle.load(open(", ", 'rb'))\n\n  def predict(data):\n\n      c = ['clean_concept', 'is_bold', 'is_italic', 'is_indent', 'is_empty_row',\n          'is_empty_row_p', 'cuis', 'semanticTypes']\n\n      customPredict = pd.DataFrame(\n          data = data,\n          columns = c)\n\n      customPredict = customPredict[['clean_concept', 'is_bold', 'is_italic',\n          'is_indent', 'is_empty_row', 'is_empty_row_p', 'semanticTypes']]\n\n      return (model[\"target_codec\"].inverse_transform(model[\"trained_model\"].predict(customPredict)))\n\n  def groupedPredict( data ):\n\n      c = ['clean_concept',\n          'is_bold', 'is_italic', 'is_indent', 'is_empty_row',\n          'is_empty_row_p', 'cuis', 'semanticTypes']\n\n      customPredict = pd.DataFrame(\n          data = data,\n          columns = c)\n\n      predictions = (model[\"target_codec\"].inverse_transform(model[\"trained_model\"].predict(customPredict)))\n\n      terms = []\n      classes = []\n\n      for t in range(0,len(data)):\n          terms.append(data[t][0])\n          classes.append(\";\".join(predictions[t]))\n\n      return({\"terms\": terms, \"classes\" : classes})\n\n  def printAll(data):\n    print(data)\n    return data\n"]);

  _templateObject = function _templateObject() {
    return data;
  };

  return data;
}

var assert = require('assert');

var pythonBridge = require('python-bridge');

var python = pythonBridge({
  python: 'python3'
});

var CONFIG = require('./config.json');

var classifierFile = CONFIG.system_path + "Classifier/trained/umls_full.model"; // For python debugging remove this.

python.ex(_templateObject(), classifierFile);

function classify(_x) {
  return _classify.apply(this, arguments);
}

function _classify() {
  _classify = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(terms) {
    var result;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            result = new Promise(function (resolve, reject) {
              if (terms.length > 0) {
                python(_templateObject2(), terms).then(function (x) {
                  return resolve(x);
                })["catch"](python.Exception, function (e) {
                  console.log("python error: " + e);
                  resolve({});
                });
              } else {
                resolve({});
              }
            });
            _context.next = 3;
            return result;

          case 3:
            result = _context.sent;
            if (result.terms) result = result.terms.reduce(function (acc, item, i) {
              if (item.length > 0) {
                acc[item] = result.classes[i];
              }

              return acc;
            }, {});
            return _context.abrupt("return", result);

          case 6:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _classify.apply(this, arguments);
}

function grouped_predictor(_x2) {
  return _grouped_predictor.apply(this, arguments);
}

function _grouped_predictor() {
  _grouped_predictor = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(terms) {
    var res, t, result;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            res = [];

            for (t in terms) {
              res.push([terms[t], 0, 0, 0, 0, 0, "", ""]);
            }

            result = new Promise(function (resolve, reject) {
              if (res.length > 0) {
                python(_templateObject3(), res).then(function (x) {
                  return resolve(x);
                })["catch"](python.Exception, function (e) {
                  return console.log("python error: " + e);
                });
              } else {
                resolve({});
              }
            });
            return _context2.abrupt("return", result);

          case 4:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _grouped_predictor.apply(this, arguments);
}

function feature_extraction(_x3) {
  return _feature_extraction.apply(this, arguments);
}

function _feature_extraction() {
  _feature_extraction = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(lines) {
    var predictions, allowedFormatKeys, l, currentLine, terms, cellClasses, cellClass, total_cols, terms_features, c, term, currentTDclass, childrenClasses, is_bold, is_italic, is_indent, cuis, semanticTypes, mm, feats, emptyRow, comb, emptyRow_pvalue, pred_class;
    return _regenerator["default"].wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            predictions = new Array(lines.length);
            allowedFormatKeys = ["bold", "italic", "indent"];
            l = 0;

          case 3:
            if (!(l < lines.length)) {
              _context3.next = 49;
              break;
            }

            currentLine = cheerio(lines[l]);
            terms = [];
            cellClasses = [];
            cellClass = "";
            total_cols = currentLine.children().length;
            terms_features = [];
            c = 0;

          case 11:
            if (!(c < total_cols)) {
              _context3.next = 37;
              break;
            }

            term = prepare_cell_text(cheerio(currentLine.children()[c]).text()); //.trim().replace(/\n/g, " ").toLowerCase()

            term = term.replace(/([^A-z0-9 ])/g, " ").replace(/[0-9]+/g, ' $nmbr$ ').replace(/ +/g, " ").replace(/nmbr/g, "$nmbr$").trim().toLowerCase();
            terms[terms.length] = term;
            currentTDclass = (currentLine.children()[c].attribs["class"] || "").replace(/[0-9]+/g, '').split(" ");
            childrenClasses = Array.from(new Set(cheerio(currentLine.children()[c]).find("*").toArray().map(function (i, el) {
              return i.attribs["class"] || "";
            }).join(" ").replace(/[0-9]+/g, '').split(" ")));
            cellClass = Array.from(new Set([].concat((0, _toConsumableArray2["default"])(currentTDclass), (0, _toConsumableArray2["default"])(childrenClasses)))).filter(function (el) {
              return el.length > 0;
            });
            cellClass = cellClass.filter(function (el) {
              return allowedFormatKeys.indexOf(el) > -1;
            });
            cellClasses[cellClasses.length] = (term.length > 0 ? cellClass.join(" ") : "").trim(); //
            // pos_start = c == 0 ? 1 : 0,
            //     pos_middle = c > 0 && c < (total_cols-1) ? 1 : 0,
            //     pos_end = c == (total_cols-1) ? 1 : 0,
            //
            // debugger

            is_bold = cellClasses[cellClasses.length - 1].indexOf("bold") > -1 ? 1 : 0, is_italic = cellClasses[cellClasses.length - 1].indexOf("italic") > -1 ? 1 : 0, is_indent = cellClasses[cellClasses.length - 1].indexOf("indent") > -1 ? 1 : 0, cuis = umls_data_buffer.cui_concept[term] || "", semanticTypes = cuis.split(";").map(function (item) {
              return umls_data_buffer.cui_def[item] ? umls_data_buffer.cui_def[item].semTypes : [];
            }).join(";");

            if (!(cuis.trim().length == "" && term.length > 1)) {
              _context3.next = 32;
              break;
            }

            if (!(term.replace(/\$nmbr\$/g, "").trim().toLowerCase().length > 0)) {
              _context3.next = 32;
              break;
            }

            if (!(umls_data_buffer.cui_concept[term] == undefined)) {
              _context3.next = 32;
              break;
            }

            // really get terms that do not exist, I.e ignore those we have tried but got nothing back from metamap (empty)
            console.log("looking up: " + term);
            _context3.next = 27;
            return (0, _metamap.metamap)(term);

          case 27:
            mm = _context3.sent;
            cuis = mm.map(function (item) {
              return item.CUI;
            }).join(";");
            semanticTypes = mm.map(function (item) {
              return item.semTypes;
            }).join(";"); // Now add missing CUIS to buffer to speed up computation.

            mm.map(function (item) {
              umls_data_buffer.cui_def[item.CUI] = {
                matchedText: item.matchedText,
                preferred: item.preferred,
                hasMSH: item.hasMSH,
                semTypes: item.semTypes
              };
            });
            umls_data_buffer.cui_concept[term] = cuis;

          case 32:
            feats = [term, is_bold, is_italic, is_indent, cuis, semanticTypes];
            terms_features[terms_features.length] = [term, is_bold, is_italic, is_indent, cuis, semanticTypes];

          case 34:
            c++;
            _context3.next = 11;
            break;

          case 37:
            emptyRow = terms.join("") == terms[0];
            comb = terms[0] + terms[terms.length - 1];
            emptyRow_pvalue = terms.join("") == comb && comb.length > terms[0].length;
            cellClasses[0] = (cellClasses[0].length > 0 ? cellClasses[0] + " " : "") + ((emptyRow ? " empty_row" : "") + (emptyRow_pvalue ? " empty_row_with_p_value" : "")).trim();
            terms_features = terms_features.map(function (item) {
              return [].concat((0, _toConsumableArray2["default"])(item.slice(0, 4)), [emptyRow ? 1 : 0, emptyRow_pvalue ? 1 : 0], (0, _toConsumableArray2["default"])(item.slice(4, 6)));
            });
            _context3.next = 44;
            return classify(terms_features);

          case 44:
            pred_class = _context3.sent;
            predictions[l] = {
              pred_class: pred_class,
              terms: terms,
              cellClasses: cellClasses,
              terms_features: terms_features
            };

          case 46:
            l++;
            _context3.next = 3;
            break;

          case 49:
            return _context3.abrupt("return", predictions);

          case 50:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));
  return _feature_extraction.apply(this, arguments);
}

function attempt_predictions(_x4) {
  return _attempt_predictions.apply(this, arguments);
}

function _attempt_predictions() {
  _attempt_predictions = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5(actual_table) {
    var result;
    return _regenerator["default"].wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            result = new Promise( /*#__PURE__*/function () {
              var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(resolve, reject) {
                var a, lines, predictions;
                return _regenerator["default"].wrap(function _callee4$(_context4) {
                  while (1) {
                    switch (_context4.prev = _context4.next) {
                      case 0:
                        try {
                          a = cheerio.load(actual_table);
                          lines = a("tr");
                          predictions = feature_extraction(lines);
                          resolve(predictions);
                        } catch (e) {
                          reject(e);
                        }

                      case 1:
                      case "end":
                        return _context4.stop();
                    }
                  }
                }, _callee4);
              }));

              return function (_x5, _x6) {
                return _ref.apply(this, arguments);
              };
            }());
            return _context5.abrupt("return", result);

          case 2:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5);
  }));
  return _attempt_predictions.apply(this, arguments);
}

module.exports = {
  attempt_predictions: attempt_predictions,
  classify: classify,
  grouped_predictor: grouped_predictor
};