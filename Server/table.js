"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classifier = require("./classifier.js");

// import {getAnnotationResults} from "./network_functions.js"
var fs = require('fs');

var path = require('path');

var dbDriver = null; // Set driver

var tableDBDriverSet = function tableDBDriverSet(driver) {
  return dbDriver = driver;
};

console.log("Loading Classifier");

function refreshDocuments() {
  return _refreshDocuments.apply(this, arguments);
}

function _refreshDocuments() {
  _refreshDocuments = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5() {
    var res;
    return _regenerator["default"].wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.next = 2;
            return prepareAvailableDocuments();

          case 2:
            res = _context5.sent;
            available_documents = res.available_documents;
            abs_index = res.abs_index;
            DOCS = res.DOCS;

          case 6:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5);
  }));
  return _refreshDocuments.apply(this, arguments);
}

var readyTable = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(docname, page, collection_id) {
    var enablePrediction,
        docid,
        htmlFolder,
        htmlFile,
        override_file_exists,
        result,
        _args2 = arguments;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            enablePrediction = _args2.length > 3 && _args2[3] !== undefined ? _args2[3] : false;
            _context2.prev = 1;
            docid = docname + "_" + page + ".html";
            htmlFolder = path.join(global.tables_folder, collection_id); //global.tables_folder+"/",

            htmlFile = docid; //If an override file exists then use it!. Overrides are those produced by the editor.

            _context2.next = 7;
            return fs.existsSync(path.join(global.tables_folder_override, collection_id, docid));

          case 7:
            override_file_exists = _context2.sent;

            if (override_file_exists) {
              htmlFolder = path.join(global.tables_folder_override, collection_id); //"HTML_TABLES_OVERRIDE/"
            }

            console.log("Loading Table: " + docid + " " + (override_file_exists ? " [Override Folder]" : ""));
            result = new Promise(function (resolve, reject) {
              try {
                fs.readFile(path.join(htmlFolder, htmlFile), //already has collection_id in html_folder
                "utf8", function (err, data) {
                  if (!data || data.trim().length < 1) {
                    resolve({
                      status: "failed",
                      tableTitle: "",
                      tableBody: "",
                      predictedAnnotation: {}
                    });
                    return;
                  }

                  fs.readFile(path.join(global.cssFolder, "stylesheet.css"), "utf8", /*#__PURE__*/function () {
                    var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(err2, data_ss) {
                      var tablePage, tableEdited, firstColContent, spaceRow, htmlHeader, findHeader, possible_tags_for_title, t, htmlHeaderText, actual_table, colum_with_numbers, styles, formattedPage, predicted;
                      return _regenerator["default"].wrap(function _callee$(_context) {
                        while (1) {
                          switch (_context.prev = _context.next) {
                            case 0:
                              _context.prev = 0;
                              // data = data.replace(/[^\x20-\x7E]+/g, "")  This removes any non-printable characters
                              tablePage = cheerio.load(data.replace(/[^\x20-\x7E]+/g, ""));

                              if (!(!tablePage || data.trim().length < 1)) {
                                _context.next = 5;
                                break;
                              }

                              // resolve({htmlHeader: "",formattedPage : "", title: "" }) //Failed or empty
                              resolve({
                                status: "failed",
                                tableTitle: "",
                                tableBody: "",
                                predictedAnnotation: {}
                              });
                              return _context.abrupt("return");

                            case 5:
                              tableEdited = false;

                              if (tablePage('table').text().length > 0) {
                                _context.next = 9;
                                break;
                              }

                              // Prevents infinite loop caused when no tables are present.
                              resolve({
                                status: "failed no table tag found ",
                                tableTitle: "",
                                tableBody: "",
                                predictedAnnotation: {}
                              });
                              return _context.abrupt("return");

                            case 9:
                              // Remove all empty rows from the top.
                              while (tablePage('table').text().length > 0 && tablePage('table tr:nth-child(1)').text().trim().length == 0) {
                                tablePage('table tr:nth-child(1)').remove();
                                tableEdited = true;
                              } // "remove NCT column on the fly"


                              firstColContent = tablePage('table tr td:nth-child(1)').text().trim();

                              if (firstColContent.indexOf("NCT") == 0) {
                                tablePage('table tr td:nth-child(1)').remove();
                                tablePage('table tr td:nth-child(1)').remove();
                                tableEdited = true;
                              }

                              if (tablePage("strong").length > 0 || tablePage("b").length > 0 || tablePage("i").length > 0) {
                                // fixing strong, b and i tags on the fly. using "bold" and "italic" classes is preferred
                                tablePage("strong").closest("td").addClass("bold");
                                tablePage("strong").map(function (i, el) {
                                  var content = cheerio(el).html();
                                  var parent = cheerio(el).parent();
                                  cheerio(el).remove();
                                  parent.append(content);
                                });
                                tablePage("b").closest("td").addClass("bold");
                                tablePage("b").map(function (i, el) {
                                  var content = cheerio(el).html();
                                  var parent = cheerio(el).parent();
                                  cheerio(el).remove();
                                  parent.append(content);
                                });
                                tablePage("i").closest("td").addClass("italic");
                                tablePage("i").map(function (i, el) {
                                  var content = cheerio(el).html();
                                  var parent = cheerio(el).parent();
                                  cheerio(el).remove();
                                  parent.append(content);
                                });
                                tableEdited = true; // fs.writeFile(htmlFolder+htmlFile,  tablePage.html(), function (err) {
                                //   if (err) throw err;
                                //   console.log('Substituted strong tags by "bold" class for: '+htmlFolder+htmlFile);
                                // });
                              }

                              if (tableEdited) {
                                console.log('Table corrected on the fly: ' + path.join(htmlFolder, htmlFile));
                                fs.writeFile(path.join(htmlFolder, htmlFile), tablePage.html(), function (err) {
                                  if (err) throw err;
                                  console.log('Table corrected on the fly: ' + path.join(htmlFolder, htmlFile));
                                });
                              }

                              _context.next = 20;
                              break;

                            case 16:
                              _context.prev = 16;
                              _context.t0 = _context["catch"](0);
                              // console.log(JSON.stringify(e)+" -- " + JSON.stringify(data))
                              resolve({
                                htmlHeader: "",
                                formattedPage: "",
                                title: ""
                              });
                              return _context.abrupt("return");

                            case 20:
                              spaceRow = -1;
                              htmlHeader = "";

                              findHeader = function findHeader(tablePage, tag) {
                                var totalTextChars = 0;
                                var headerNodes = [cheerio(tablePage(tag)[0]).remove()];
                                var htmlHeader = "";

                                for (var h in headerNodes) {
                                  // cheerio(headerNodes[h]).css("font-size","20px");
                                  var headText = cheerio(headerNodes[h]).text().trim();
                                  var textLimit = 400;
                                  var actualText = headText.length > textLimit ? headText.slice(0, textLimit - 1) + " [...] " : headText;
                                  totalTextChars += actualText.length;
                                  htmlHeader = htmlHeader + '<tr ><td style="font-size:20px; font-weight:bold; white-space: normal;">' + actualText + "</td></tr>";
                                }

                                return {
                                  htmlHeader: htmlHeader,
                                  totalTextChars: totalTextChars
                                };
                              };

                              possible_tags_for_title = [".headers", ".caption", ".captions", ".article-table-caption"];
                              _context.t1 = _regenerator["default"].keys(possible_tags_for_title);

                            case 25:
                              if ((_context.t2 = _context.t1()).done) {
                                _context.next = 32;
                                break;
                              }

                              t = _context.t2.value;
                              htmlHeader = findHeader(tablePage, possible_tags_for_title[t]);

                              if (!(htmlHeader.totalTextChars > 0)) {
                                _context.next = 30;
                                break;
                              }

                              return _context.abrupt("break", 32);

                            case 30:
                              _context.next = 25;
                              break;

                            case 32:
                              htmlHeader = "<table>" + htmlHeader.htmlHeader + "</table>";
                              htmlHeaderText = cheerio(htmlHeader).find("td").text();
                              actual_table = tablePage("table").parent().html();
                              actual_table = cheerio.load(actual_table); // The following lines remove, line numbers present in some tables, as well as positions in headings derived from the excel sheets  if present.

                              colum_with_numbers = actual_table("tr > td:nth-child(1), tr > td:nth-child(2), tr > th:nth-child(1), tr > th:nth-child(2)");

                              if (colum_with_numbers.text().replace(/[0-9]/gi, "").replace(/\s+/g, "").toLowerCase() === "row/col") {
                                colum_with_numbers.remove();
                              }

                              if (actual_table("thead").text().trim().indexOf("1(A)") > -1) {
                                actual_table("thead").remove();
                              } ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                              // Correction here for bold


                              actual_table = actual_table.html(); // var ss = "<style>"+data_ss+" td {width: auto;} tr:hover {background: aliceblue} td:hover {background: #82c1f8} col{width:100pt} </style>"

                              styles = actual_table.indexOf('<style type="text/css">.indent0') > -1 ? "" : "<style>" + data_ss + "</style>";
                              formattedPage = actual_table.indexOf("tr:hover" < 0) ? "<div>" + styles + actual_table + "</div>" : actual_table;
                              predicted = {};

                              if (!enablePrediction) {
                                _context.next = 48;
                                break;
                              }

                              console.log("predicting");
                              _context.next = 47;
                              return attemptPrediction(actual_table);

                            case 47:
                              predicted = _context.sent;

                            case 48:
                              resolve({
                                status: "good",
                                tableTitle: htmlHeader,
                                tableBody: formattedPage,
                                predictedAnnotation: predicted
                              });

                            case 49:
                            case "end":
                              return _context.stop();
                          }
                        }
                      }, _callee, null, [[0, 16]]);
                    }));

                    return function (_x4, _x5) {
                      return _ref2.apply(this, arguments);
                    };
                  }());
                });
              } catch (e) {
                console.log(e);
                reject({
                  status: "bad"
                });
              }
            });
            return _context2.abrupt("return", result);

          case 14:
            _context2.prev = 14;
            _context2.t0 = _context2["catch"](1);
            console.log(_context2.t0);
            return _context2.abrupt("return", {
              status: "bad"
            });

          case 18:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, null, [[1, 14]]);
  }));

  return function readyTable(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

var attemptPrediction = /*#__PURE__*/function () {
  var _ref3 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(actual_table) {
    var predictions, terms_matrix, preds_matrix, format_matrix, feature_matrix, content_type_matrix, cleanModifier, isTermNumber, getColumnAsArray, getFreqs, getMatchingIndices, getElementsByIndices, getTopDescriptors, isMostlyNumbers, max_col, max_row, col_top_descriptors, row_top_descriptors, format_units, f, format_key, format_unit, col, col_array, indices_w_format, pred_array, predictions_w_format, content_array, descriptors, row, row_predictions, rowFirstCellEmpty, is_empty_or_P, sanitiseItemRepetition, reduceFormatRedundancy, predicted;
    return _regenerator["default"].wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return (0, _classifier.attempt_predictions)(actual_table);

          case 2:
            predictions = _context3.sent;
            terms_matrix = predictions.map(function (e) {
              return e.terms.map(function (term) {
                return term;
              });
            });
            preds_matrix = predictions.map(function (e) {
              return e.terms.map(function (term) {
                return e.pred_class[term];
              });
            });
            format_matrix = predictions.map(function (e) {
              return e.cellClasses.map(function (cellClass) {
                return cellClass;
              });
            });
            feature_matrix = predictions.map(function (e) {
              return e.terms_features.map(function (term) {
                return term;
              });
            }); // values in this matrix represent the cell contents, and can be: "text", "numeric" or ""

            content_type_matrix = predictions.map(function (e) {
              return e.terms.map(function (term) {
                var term = term.replace(/\$nmbr\$/g, 0);
                var numberless_size = term.replace(/([^A-z0-9 ])/g, "").replace(/[0-9]+/g, '').replace(/ +/g, " ").trim().length;
                var spaceless_size = term.replace(/([^A-z0-9 ])/g, "").replace(/ +/g, " ").trim().length;
                return spaceless_size == 0 ? "" : numberless_size >= spaceless_size / 2 ? "text" : "numeric";
              });
            });

            cleanModifier = function cleanModifier(modifier) {
              modifier = modifier ? modifier : ""; //prevent blow up

              return modifier.replace("firstCol", "empty_row").replace("firstLastCol", "empty_row_with_p_value").replace("indent0", "indent").replace("indent1", "indent").replace("indent2", "indent").replace("indent3", "indent").replace("indent4", "indent").trim();
            };

            isTermNumber = function isTermNumber(term) {
              term = term ? term : ""; // Just in case term is undefined

              var statsRelated = ["nmbr", "mean", "median", "percent", "mode", "std", "nan", "na", "nr"];
              var stats = term.toLowerCase().replace(/[^A-z0-9 ]/gi, " ").replace(/ +/gi, " ").trim().split(" ").filter(function (el) {
                return el.length > 1;
              }).reduce(function (acc, term) {
                if (statsRelated.indexOf(term) > -1) {
                  acc.numbers++;
                }

                ;
                acc.total++;
                return acc;
              }, {
                numbers: 0,
                total: 0
              });
              return stats.numbers > stats.total / 2;
            };

            getColumnAsArray = function getColumnAsArray(matrix, c) {
              return matrix.map(function (row, r) {
                return row[c];
              });
            };

            getFreqs = function getFreqs(elements) {
              return elements.reduce(function (countMap, word) {
                countMap.freqs[word] = ++countMap.freqs[word] || 1;
                var max = countMap["max"] || 0;
                countMap["max"] = max < countMap.freqs[word] ? countMap.freqs[word] : max;
                countMap["total"] = ++countMap["total"] || 1;
                return countMap;
              }, {
                total: 0,
                freqs: {}
              });
            };

            getMatchingIndices = function getMatchingIndices(elements, items) {
              return elements.reduce(function (indices, el, i) {
                if (items.indexOf(el) > -1) {
                  indices.push(i);
                }

                return indices;
              }, []);
            };

            getElementsByIndices = function getElementsByIndices(elements, indices) {
              return elements.reduce(function (res, el, i) {
                if (indices.indexOf(i) > -1) {
                  res.push(elements[i]);
                }

                return res;
              }, []);
            };

            getTopDescriptors = function getTopDescriptors(freqs) {
              var rowFirstCellEmpty = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

              if (rowFirstCellEmpty) {
                delete freqs[""];
              }

              var sum = Object.values(freqs).reduce(function (total, i) {
                return total + i;
              }, 0);
              var avg = sum / Object.values(freqs).length * 0.85; // just a bit under the average

              return Object.keys(freqs).reduce(function (acc, k, i) {
                var exclude = ["undefined", undefined, ""];

                if (freqs[k] >= avg && exclude.indexOf(k) < 0) {
                  acc.push(k);
                }

                return acc;
              }, []);
            };
            /*
              Used to check if more than half elements in the column/row are just numbers.
              This is useful as they can be detected as characteristic_level by the classifier.
              We use this function to not accept predictions if most elements are just numbers, I.e very likely a results column/row
            */


            isMostlyNumbers = function isMostlyNumbers(all_terms) {
              var equals = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
              var numberTerms_number = all_terms.map(function (term) {
                return isTermNumber(term);
              }).reduce(function (sum, isNumber) {
                return isNumber ? sum + 1 : sum;
              }, 0);
              return equals ? numberTerms_number >= all_terms.length / 2 : numberTerms_number > all_terms.length / 2;
            };

            max_col = preds_matrix.reduce(function (acc, n) {
              return n.length > acc ? n.length : acc;
            }, 0);
            max_row = preds_matrix.length; //Estimate column predictions.

            col_top_descriptors = [];
            row_top_descriptors = [];
            format_units = Array.from(new Set(format_matrix.flat()));
            _context3.t0 = _regenerator["default"].keys(format_units);

          case 22:
            if ((_context3.t1 = _context3.t0()).done) {
              _context3.next = 47;
              break;
            }

            f = _context3.t1.value;
            format_key = format_units[f];
            format_unit = {};
            col = 0;

          case 27:
            if (!(col < max_col)) {
              _context3.next = 45;
              break;
            }

            col_array = getColumnAsArray(format_matrix, col);
            indices_w_format = getMatchingIndices(col_array, [format_key]); // If the cells with this formatting are rare. then ignore.

            if (!(format_key.indexOf("empty_row") < 0 && indices_w_format.length <= 2)) {
              _context3.next = 32;
              break;
            }

            return _context3.abrupt("continue", 42);

          case 32:
            if (!isMostlyNumbers(getColumnAsArray(terms_matrix, col))) {
              _context3.next = 34;
              break;
            }

            return _context3.abrupt("continue", 42);

          case 34:
            pred_array = getColumnAsArray(preds_matrix, col);
            predictions_w_format = getElementsByIndices(pred_array, indices_w_format);
            predictions_w_format = predictions_w_format.join(";").split(";");
            content_array = getColumnAsArray(content_type_matrix, col);

            if (!(getFreqs(content_array).freqs["text"] < content_array.length / 2)) {
              _context3.next = 40;
              break;
            }

            return _context3.abrupt("continue", 42);

          case 40:
            descriptors = getTopDescriptors(getFreqs(predictions_w_format).freqs);

            if (descriptors.length > 0) {
              col_top_descriptors[col_top_descriptors.length] = {
                descriptors: descriptors,
                c: col,
                unique_modifier: format_key.split(" ").join(";")
              };
            }

          case 42:
            col++;
            _context3.next = 27;
            break;

          case 45:
            _context3.next = 22;
            break;

          case 47:
            row = 0;

          case 48:
            if (!(row < max_row)) {
              _context3.next = 66;
              break;
            }

            if (!isMostlyNumbers(terms_matrix[row])) {
              _context3.next = 51;
              break;
            }

            return _context3.abrupt("continue", 63);

          case 51:
            row_predictions = preds_matrix[row];
            row_predictions = row_predictions.join(";").split(";");
            content_array = content_type_matrix[row];
            content_array = content_array.reduce(function (acc, it) {
              if (it.length > 0) {
                acc.push(it);
              }

              ;
              return acc;
            }, []);

            if (!(getFreqs(content_array).freqs["text"] < content_array.length / 2)) {
              _context3.next = 57;
              break;
            }

            return _context3.abrupt("continue", 63);

          case 57:
            rowFirstCellEmpty = terms_matrix[row][0].trim() == ""; // very likely to be a heading row, since the first empty cell indicates a indentation.

            descriptors = getTopDescriptors(getFreqs(row_predictions).freqs, rowFirstCellEmpty);
            is_empty_or_P = format_matrix[row][0].indexOf("empty_row") > -1;

            if (!is_empty_or_P) {
              _context3.next = 62;
              break;
            }

            return _context3.abrupt("continue", 63);

          case 62:
            if (descriptors.length > 0) {
              row_top_descriptors[row_top_descriptors.length] = {
                descriptors: descriptors,
                c: row,
                unique_modifier: ""
              };
            }

          case 63:
            row++;
            _context3.next = 48;
            break;

          case 66:
            // Estimate row predictions
            // NEed some sanitation here.
            // If many rows, or many columns, chose only top one.
            // col_top_descriptors[col_top_descriptors.length] = {descriptors, c , unique_modifier}
            // row_top_descriptors[row_top_descriptors.length] = {descriptors, c : r , unique_modifier:""}
            // Eliminates rows/cols given a descriptor set that exceeds the amount allowed by the threshold w.r.t. the total.
            sanitiseItemRepetition = function sanitiseItemRepetition(top_descriptors, total) {
              var threshold = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0.40;
              var similarRowCounts = top_descriptors.reduce(function (acc, row_item, r) {
                var thekey = row_item.descriptors.join(";");
                var storedRow = acc[thekey];

                if (storedRow) {
                  storedRow.push(row_item.c);
                } else {
                  storedRow = [row_item.c];
                }

                acc[thekey] = storedRow;
                return acc;
              }, {});
              var clean_top_descriptors = [];

              for (var d in top_descriptors) {
                var thekey = top_descriptors[d].descriptors.join(";");

                for (var r in similarRowCounts) {
                  if (similarRowCounts[thekey].length < total * threshold) {
                    clean_top_descriptors.push(top_descriptors[d]);
                    break;
                  }
                }
              }

              return clean_top_descriptors;
            };

            row_top_descriptors = sanitiseItemRepetition(row_top_descriptors, max_row);

            reduceFormatRedundancy = function reduceFormatRedundancy(descriptors) {
              var references = {};
              var finalDescriptors = [];

              for (var c in descriptors) {
                if (descriptors[c].unique_modifier == "") {
                  references[descriptors[c].c] = descriptors[c].descriptors.join(";");
                  finalDescriptors.push(descriptors[c]);
                }
              }

              for (var c in descriptors) {
                if (descriptors[c].descriptors.join(";") != references[descriptors[c].c]) {
                  finalDescriptors.push(descriptors[c]);
                }
              }

              return finalDescriptors;
            };

            col_top_descriptors = reduceFormatRedundancy(col_top_descriptors);
            predicted = {
              cols: col_top_descriptors,
              rows: row_top_descriptors,
              predictions: predictions
            };
            return _context3.abrupt("return", predicted);

          case 72:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));

  return function attemptPrediction(_x6) {
    return _ref3.apply(this, arguments);
  };
}();

var prepareAvailableDocuments = /*#__PURE__*/function () {
  var _ref4 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(collection_id) {
    var ftop, ftyp, fgroup, flgroup, hua, type_lookup, i, filtered_docs_ttype, allAnnotations, all_annotated_docids, ordered_Splits, ordered_docs_to_label, allLabelled, selected_group_docs, group_index, selected_label_docs, label_index, results;
    return _regenerator["default"].wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            if (dbDriver) {
              _context4.next = 2;
              break;
            }

            throw new Error('Required DB Driver');

          case 2:
            ftop = [];
            ftyp = [];
            fgroup = [];
            flgroup = [];
            hua = false;
            type_lookup = {
              "Baseline Characteristics": "baseline_table",
              "Results with subgroups": "result_table_subgroup",
              "Results without subgroups": "result_table_without_subgroup",
              "Other": "other_table",
              "Unassigned": "NA"
            };

            for (i = 0; i < ftyp.length; i++) {
              ftyp[i] = type_lookup[ftyp[i]];
            }

            filtered_docs_ttype = [];
            _context4.next = 12;
            return dbDriver.annotationResultsGet();

          case 12:
            allAnnotations = _context4.sent;
            all_annotated_docids = Array.from(new Set(allAnnotations.rows.reduce(function (acc, ann) {
              acc = acc ? acc : [];
              acc.push(ann.docid + "_" + ann.page);
              return acc;
            }, [])));

            if (ftop.length + ftyp.length > 0) {
              filtered_docs_ttype = allAnnotations.rows.reduce(function (acc, ann) {
                acc = acc ? acc : [];

                if (ann.tableType != "" && ftyp.indexOf(ann.tableType) > -1) {
                  acc.push(ann.docid + "_" + ann.page);
                }

                return acc;
              }, []);
              filtered_docs_ttype = Array.from(new Set(filtered_docs_ttype));
            }

            ordered_Splits = [];
            ordered_docs_to_label = [];
            allLabelled = [];
            allLabelled = allLabelled.map(function (d) {
              return d + ".html";
            });
            selected_group_docs = [];

            if (fgroup == "all" || fgroup.indexOf("all") > -1) {
              selected_group_docs = ordered_Splits.flat();
            } else {
              for (i in fgroup) {
                group_index = parseInt(fgroup[i]) - 1;
                selected_group_docs = [].concat((0, _toConsumableArray2["default"])(selected_group_docs), (0, _toConsumableArray2["default"])(ordered_Splits[group_index]));
              }
            }

            selected_label_docs = [];

            if (flgroup == "all" || flgroup.indexOf("all") > -1) {
              selected_label_docs = ordered_docs_to_label.flat();
            } else {
              for (i in flgroup) {
                label_index = parseInt(flgroup[i]) - 1;
                selected_label_docs = [].concat((0, _toConsumableArray2["default"])(selected_label_docs), (0, _toConsumableArray2["default"])(ordered_docs_to_label[label_index]));
              }
            }

            selected_group_docs = selected_group_docs.flat();
            results = new Promise(function (resolve, reject) {
              var available_documents = {};
              var abs_index = [];
              var DOCS = [];

              var fixVersionOrder = function fixVersionOrder(a) {
                var i = a.indexOf("v");

                if (i > -1) {
                  return a.slice(0, i) + a.slice(i + 2, a.length) + a.slice(i, i + 2);
                } else {
                  return a;
                }
              };

              fs.readdir(path.join(tables_folder, collection_id), function (err, items) {
                var label_filters = flgroup;
                var unannotated = ordered_Splits;

                if (selected_group_docs.length > 0) {
                  DOCS = selected_group_docs;
                }

                if (selected_label_docs.length > 0) {
                  DOCS = selected_label_docs;
                }

                if (DOCS.length < 1) {
                  if (!items) {
                    items = [];
                  }

                  items = items.reduce(function (acc, filename) {
                    var doc_path = path.join(tables_folder, collection_id, filename);

                    if (fs.existsSync(doc_path) && !fs.lstatSync(doc_path).isDirectory()) {
                      acc.push(filename);
                    }

                    return acc;
                  }, []);
                  DOCS = items.sort(function (a, b) {
                    return fixVersionOrder(a).localeCompare(fixVersionOrder(b));
                  });
                }

                DOCS = DOCS.sort(function (a, b) {
                  a = a.match(/([\w\W]*)_([0-9]*).html/);
                  b = b.match(/([\w\W]*)_([0-9]*).html/);
                  var st_a = {
                    docid: a[1],
                    page: a[2]
                  };
                  var st_b = {
                    docid: b[1],
                    page: b[2]
                  };
                  var dd = st_a.docid.localeCompare(st_b.docid);
                  return dd == 0 ? parseInt(st_a.page) - parseInt(st_b.page) : dd;
                });
                DOCS = DOCS.reduce(function (acc, docfile) {
                  var file_parts = docfile.match(/([\w\W]*)_([0-9]*).html/);
                  var docid = file_parts[1];
                  var docid_V = file_parts[1];
                  var page = file_parts[2];

                  if (ftop.length + ftyp.length > 0 && msh_categories && msh_categories.catIndex) {
                    var topic_enabled = ftop.length > 0;
                    var topic_intersection = ftop.reduce(function (acc, cat) {
                      return acc || msh_categories.catIndex[cat].indexOf(docid) > -1;
                    }, false);

                    if (ftop.indexOf("NA") > -1) {
                      if (msh_categories.pmids_w_cat.indexOf(docid) < 0) {
                        topic_intersection = true;
                      }
                    }

                    var type_enabled = ftyp.length > 0;
                    var type_intersection = type_enabled && filtered_docs_ttype.length > 0 && filtered_docs_ttype.indexOf(docid_V + "_" + page) > -1;
                    var isAnnotated = all_annotated_docids.indexOf(docid_V + "_" + page) > -1;
                    var show_not_annotated = !hua;
                    var accept_docid = false; // Logic to control the filter. It depends in many variables with many controlled outcomes, so it looks a bit complicated

                    if (topic_enabled && type_enabled) {
                      accept_docid = topic_intersection ? true : accept_docid;
                      accept_docid = type_intersection || show_not_annotated && !isAnnotated ? accept_docid : false;
                    } else if (topic_enabled && !type_enabled) {
                      accept_docid = topic_intersection ? true : accept_docid;
                      accept_docid = !show_not_annotated ? isAnnotated && topic_intersection : accept_docid;
                    } else if (!topic_enabled && type_enabled) {
                      accept_docid = type_intersection || show_not_annotated && !isAnnotated ? true : false;
                    } else if (!topic_enabled && !type_enabled) {
                      accept_docid = !show_not_annotated ? isAnnotated : true;
                    } // End of filter logic.


                    if (accept_docid) {
                      acc.push(docfile);
                    }
                  } else {
                    // Default path when no filters are enabled
                    if (!hua) {
                      // The document is not annotated, so always add.
                      acc.push(docfile);
                    } else {
                      if (all_annotated_docids.indexOf(docid_V + "_" + page) > -1) {
                        acc.push(docfile);
                      }
                    }
                  }

                  return acc;
                }, []);
                DOCS = Array.from(new Set(DOCS));

                try {
                  for (var d in DOCS) {
                    var docfile = DOCS[d];
                    var fileElements = docfile.match(/([\w\W]*)_([0-9]*).html/);
                    var docid = fileElements[1];
                    var page = fileElements[2]; //.split(".")[0]

                    var extension = ".html"; //fileElements[1].split(".")[1]

                    if (available_documents[docid]) {
                      var prev_data = available_documents[docid];
                      prev_data.pages[prev_data.pages.length] = page;
                      prev_data.abs_pos[prev_data.abs_pos.length] = abs_index.length;
                      prev_data.maxPage = page > prev_data.maxPage ? page : prev_data.maxPage;
                      available_documents[docid] = prev_data;
                    } else {
                      available_documents[docid] = {
                        abs_pos: [abs_index.length],
                        pages: [page],
                        extension: extension,
                        maxPage: page
                      };
                    }

                    abs_index[abs_index.length] = {
                      docid: docid,
                      page: page,
                      extension: extension,
                      docfile: docfile
                    };
                  }

                  resolve({
                    available_documents: available_documents,
                    abs_index: abs_index,
                    DOCS: DOCS
                  });
                } catch (e) {
                  console.log("FAILED: " + JSON.stringify(e));
                  reject(e);
                }
              });
            });
            _context4.next = 27;
            return results;

          case 27:
            return _context4.abrupt("return", _context4.sent);

          case 28:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));

  return function prepareAvailableDocuments(_x7) {
    return _ref4.apply(this, arguments);
  };
}();

module.exports = {
  tableDBDriverSet: tableDBDriverSet,
  refreshDocuments: refreshDocuments,
  readyTable: readyTable,
  prepareAvailableDocuments: prepareAvailableDocuments
};