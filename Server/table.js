"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _network_functions = require("./network_functions.js");

var _classifier = require("./classifier.js");

var fs = require('fs');

var path = require('path');

var buffer_tables = {};
console.log("Loading Classifier");

var readyTableData =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(docid, page, method) {
    var htmlFolder, htmlFile, file_exists, result;
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;
            docid = docid + "_" + page + ".html", htmlFolder = tables_folder + "/", htmlFile = docid; //If an override file exists then use it!. Overrides are those produced by the editor.

            _context2.next = 4;
            return fs.existsSync("HTML_TABLES_OVERRIDE/" + docid);

          case 4:
            file_exists = _context2.sent;

            if (file_exists) {
              htmlFolder = "HTML_TABLES_OVERRIDE/";
            }

            console.log("Loading Table: " + docid + " " + (file_exists ? " [Override Folder]" : ""));
            result = new Promise(function (resolve, reject) {
              if (buffer_tables[docid]) {
                // early exit if buffer already has it.
                resolve(buffer_tables[docid]);
              }

              try {
                fs.readFile(htmlFolder + htmlFile, "utf8", function (err, data) {
                  fs.readFile(cssFolder + "/" + "stylesheet.css", "utf8",
                  /*#__PURE__*/
                  function () {
                    var _ref2 = (0, _asyncToGenerator2.default)(
                    /*#__PURE__*/
                    _regenerator.default.mark(function _callee(err2, data_ss) {
                      var tablePage, tableEdited, firstColContent, spaceRow, htmlHeader, findHeader, possible_tags_for_title, t, htmlHeaderText, actual_table, colum_with_numbers, styles, formattedPage, predictions, terms_matrix, preds_matrix, format_matrix, feature_matrix, content_type_matrix, cleanModifier, isTermNumber, getColumnAsArray, getFreqs, getMatchingIndices, getElementsByIndices, getTopDescriptors, isMostlyNumbers, max_col, max_row, col_top_descriptors, row_top_descriptors, format_units, f, format_key, format_unit, col, col_array, indices_w_format, pred_array, predictions_w_format, content_array, descriptors, row, row_predictions, rowFirstCellEmpty, is_empty_or_P, sanitiseItemRepetition, reduceFormatRedundancy, predicted;
                      return _regenerator.default.wrap(function _callee$(_context) {
                        while (1) {
                          switch (_context.prev = _context.next) {
                            case 0:
                              _context.prev = 0;
                              tablePage = cheerio.load(data);
                              tableEdited = false; // tablePage("col").removeAttr('style');

                              if (tablePage) {
                                _context.next = 6;
                                break;
                              }

                              resolve({
                                htmlHeader: "",
                                formattedPage: "",
                                title: ""
                              });
                              return _context.abrupt("return");

                            case 6:
                              // Remove all empty rows from the top.
                              while (tablePage('table tr:nth-child(1)').text().trim().length == 0) {
                                tablePage('table tr:nth-child(1)').remove();
                                tableEdited = true;
                              } //
                              // debugger
                              // "remove NCT column on the fly"


                              firstColContent = tablePage('table tr td:nth-child(1)').text().trim();

                              if (firstColContent.indexOf("NCT") == 0) {
                                tablePage('table tr td:nth-child(1)').remove();
                                tablePage('table tr td:nth-child(1)').remove();
                                tableEdited = true;
                              } // debugger


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
                                }); // debugger

                                tableEdited = true; // fs.writeFile(htmlFolder+htmlFile,  tablePage.html(), function (err) {
                                //   if (err) throw err;
                                //   console.log('Substituted strong tags by "bold" class for: '+htmlFolder+htmlFile);
                                // });
                              }

                              if (tableEdited) {
                                console.log('Table corrected on the fly: ' + htmlFolder + htmlFile);
                                fs.writeFile(htmlFolder + htmlFile, tablePage.html(), function (err) {
                                  if (err) throw err;
                                  console.log('Table corrected on the fly: ' + htmlFolder + htmlFile);
                                });
                              } // debugger


                              _context.next = 17;
                              break;

                            case 13:
                              _context.prev = 13;
                              _context.t0 = _context["catch"](0);
                              // console.log(JSON.stringify(e)+" -- " + JSON.stringify(data))
                              resolve({
                                htmlHeader: "",
                                formattedPage: "",
                                title: ""
                              });
                              return _context.abrupt("return");

                            case 17:
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
                                  htmlHeader = htmlHeader + '<tr ><td style="font-size:20px; font-weight:bold; white-space: normal;">' + encodeURI(actualText) + "</td></tr>";
                                }

                                return {
                                  htmlHeader: htmlHeader,
                                  totalTextChars: totalTextChars
                                };
                              };

                              possible_tags_for_title = [".headers", ".caption", ".captions", ".article-table-caption"];
                              _context.t1 = _regenerator.default.keys(possible_tags_for_title);

                            case 22:
                              if ((_context.t2 = _context.t1()).done) {
                                _context.next = 29;
                                break;
                              }

                              t = _context.t2.value;
                              htmlHeader = findHeader(tablePage, possible_tags_for_title[t]);

                              if (!(htmlHeader.totalTextChars > 0)) {
                                _context.next = 27;
                                break;
                              }

                              return _context.abrupt("break", 29);

                            case 27:
                              _context.next = 22;
                              break;

                            case 29:
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
                              _context.next = 41;
                              return (0, _classifier.attempt_predictions)(actual_table);

                            case 41:
                              predictions = _context.sent;
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
                                  var spaceless_size = term.replace(/([^A-z0-9 ])/g, "").replace(/ +/g, " ").trim().length; // debugger

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
                              _context.t3 = _regenerator.default.keys(format_units);

                            case 61:
                              if ((_context.t4 = _context.t3()).done) {
                                _context.next = 86;
                                break;
                              }

                              f = _context.t4.value;
                              format_key = format_units[f];
                              format_unit = {};
                              col = 0;

                            case 66:
                              if (!(col < max_col)) {
                                _context.next = 84;
                                break;
                              }

                              col_array = getColumnAsArray(format_matrix, col);
                              indices_w_format = getMatchingIndices(col_array, [format_key]); // debugger
                              // If the cells with this formatting are rare. then ignore.

                              if (!(format_key.indexOf("empty_row") < 0 && indices_w_format.length <= 2)) {
                                _context.next = 71;
                                break;
                              }

                              return _context.abrupt("continue", 81);

                            case 71:
                              if (!isMostlyNumbers(getColumnAsArray(terms_matrix, col))) {
                                _context.next = 73;
                                break;
                              }

                              return _context.abrupt("continue", 81);

                            case 73:
                              pred_array = getColumnAsArray(preds_matrix, col);
                              predictions_w_format = getElementsByIndices(pred_array, indices_w_format);
                              predictions_w_format = predictions_w_format.join(";").split(";");
                              content_array = getColumnAsArray(content_type_matrix, col); // debugger

                              if (!(getFreqs(content_array).freqs["text"] < content_array.length / 2)) {
                                _context.next = 79;
                                break;
                              }

                              return _context.abrupt("continue", 81);

                            case 79:
                              descriptors = getTopDescriptors(getFreqs(predictions_w_format).freqs);

                              if (descriptors.length > 0) {
                                col_top_descriptors[col_top_descriptors.length] = {
                                  descriptors: descriptors,
                                  c: col,
                                  unique_modifier: format_key.split(" ").join(";")
                                };
                              }

                            case 81:
                              col++;
                              _context.next = 66;
                              break;

                            case 84:
                              _context.next = 61;
                              break;

                            case 86:
                              row = 0;

                            case 87:
                              if (!(row < max_row)) {
                                _context.next = 105;
                                break;
                              }

                              if (!isMostlyNumbers(terms_matrix[row])) {
                                _context.next = 90;
                                break;
                              }

                              return _context.abrupt("continue", 102);

                            case 90:
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
                                _context.next = 96;
                                break;
                              }

                              return _context.abrupt("continue", 102);

                            case 96:
                              rowFirstCellEmpty = terms_matrix[row][0].trim() == ""; // very likely to be a heading row, since the first empty cell indicates a indentation.

                              descriptors = getTopDescriptors(getFreqs(row_predictions).freqs, rowFirstCellEmpty);
                              is_empty_or_P = format_matrix[row][0].indexOf("empty_row") > -1;

                              if (!is_empty_or_P) {
                                _context.next = 101;
                                break;
                              }

                              return _context.abrupt("continue", 102);

                            case 101:
                              if (descriptors.length > 0) {
                                // debugger
                                row_top_descriptors[row_top_descriptors.length] = {
                                  descriptors: descriptors,
                                  c: row,
                                  unique_modifier: ""
                                };
                              }

                            case 102:
                              row++;
                              _context.next = 87;
                              break;

                            case 105:
                              // Estimate row predictions
                              // NEed some sanitation here.
                              // If many rows, or many columns, chose only top one.
                              // col_top_descriptors[col_top_descriptors.length] = {descriptors, c , unique_modifier}
                              // row_top_descriptors[row_top_descriptors.length] = {descriptors, c : r , unique_modifier:""}
                              //debugger
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
                              resolve({
                                status: "good",
                                htmlHeader: htmlHeader,
                                formattedPage: formattedPage,
                                title: "",
                                predicted: predicted
                              });

                            case 111:
                            case "end":
                              return _context.stop();
                          }
                        }
                      }, _callee, this, [[0, 13]]);
                    }));

                    return function (_x4, _x5) {
                      return _ref2.apply(this, arguments);
                    };
                  }());
                });
              } catch (e) {
                reject({
                  status: "bad"
                });
              }
            }); // buffer_tables = {}
            // buffer_tables[docid] = result

            return _context2.abrupt("return", result);

          case 11:
            _context2.prev = 11;
            _context2.t0 = _context2["catch"](0);
            return _context2.abrupt("return", {
              status: "bad"
            });

          case 14:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this, [[0, 11]]);
  }));

  return function readyTableData(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

var prepareAvailableDocuments =
/*#__PURE__*/
function () {
  var _ref3 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee3(filter_topic, filter_type, hua, filter_group, filter_labelgroup) {
    var ftop, ftyp, fgroup, flgroup, type_lookup, i, filtered_docs_ttype, allAnnotations, all_annotated_docids, ordered_Splits, ordered_docs_to_label, exclude_pmids, with_corrupted_text, allLabelled, selected_group_docs, group_index, selected_label_docs, label_index, results;
    return _regenerator.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            ftop = filter_topic ? filter_topic : [];
            ftyp = filter_type ? filter_type : [];
            fgroup = filter_group ? filter_group : [];
            flgroup = filter_labelgroup ? filter_labelgroup : [];
            hua = hua;
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
            _context3.next = 10;
            return (0, _network_functions.getAnnotationResults)();

          case 10:
            allAnnotations = _context3.sent;
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

            ordered_Splits = [["30936738_1.html", "30936738_2.html", "30936738_3.html", "30936738_4.html", "30936738_5.html", "16508926_6.html", "27744141_2.html", "27098404_1.html", "30341453_1.html", "30341453_2.html"], ["16495392fig_2.html", "24907147_2.html", "24907147_3.html", "24907147_4.html", "24907147_5.html", "27502582_2.html", "30473179_3.html", "25047021_1.html", "27165179_2.html", "29338762_2.html"], ["27493790_2.html", "29299340_2.html", "30696483_2.html", "29409133_1.html", "28968735_2.html", "28968735_3.html", "29045207_2.html", "29685860fig_1.html", "20484828_2.html", "26589819_1.html"], ["19515181_2.html", "25414932_1.html", "26833744_2.html", "26833744_3.html", "30287422_2.html", "29937431_2.html", "25881510_2.html", "25772548_2.html", "29941478fig_1.html", "30425095_1.html"], ["30425095b_1.html", "27161178_2.html", "30609212_1.html", "30609212_2.html", "19210140_2.html", "26579834_1.html", "26579834_5.html", "26580237_3.html", "27299675_1.html", "29777264fig_1.html"], ["30393950_2.html", "19614946_2.html", "19614946_3.html", "26934128_2.html", "30614616_1.html", "30571562_2.html", "26786577_2.html", "18284434_2.html", "22672586_2.html", "30851070_1.html"], ["30830724_1.html", "30830724_2.html", "25468945_2.html", "25629790_2.html", "30882238_1.html", "19508464_1.html", "19508464_2.html", "30566006fig_1.html", "30566004_2.html", "30392095_2.html"], ["19650752_2.html", "30953107_1.html", "30953107_2.html", "21545947fig_2.html", "19917888app_1.html", "19917888fig_2.html", "17384437fig_1.html", "9036306_1.html", "18371559_1.html", "27395349_2.html"], ["27354044_3.html", "26541915_6.html", "26027630fig_1.html", "30183102fig_1.html", "15639688_2.html", "17560879_2.html", "27619750_3.html", "24411003_1.html", "25743173_2.html", "25743173_3.html"], ["19166691_2.html", "27956003_2.html", "27846344fig_2.html", "25135178_2.html", "25282519_2.html", "19190658_2.html", "20670726_2.html", "22747613_2.html", "22747613_3.html", "21925996_2.html"], ["21925996_3.html", "21925996_4.html", "24067881_2.html", "22504093_2.html", "30203005_2.html", "29857145_3.html", "29857145_4.html", "29857145_5.html", "29857145_6.html", "29857145_7.html"], ["21723220_1.html", "21723220_2.html", "21723220_3.html", "16267322_2.html", "22704916_2.html", "17634459_2.html", "20491747_2.html", "29909019_2.html", "29797519_1.html", "24120253_4.html"], ["20429821_2.html", "20429821_3.html", "20429821_4.html", "21227674_2.html", "20463178_2.html", "27609408_2.html", "24966672_3.html", "30815468_1.html", "30815468_2.html", "30815468_3.html"], ["27087007_1.html", "27316465_2.html", "27316465_3.html", "27316465_4.html", "27316465_5.html", "27215749_3.html", "27715335_2.html", "18511702_2.html", "21627828_2.html", "21627828_3.html"], ["27039236_2.html", "21586508_2.html", "28558833_2.html", "28558833_3.html", "29413502_2.html", "21875546_2.html", "23040786_2.html", "28903864_2.html", "30053967fig_1.html", "20925534_2.html"], ["20925534_3.html", "29073947_2.html", "26994121_2.html", "25787199_2.html", "24727254_2.html", "26059896fig_2.html", "20385930fig_2.html", "19389561fig_2.html", "21816478_2.html", "7997016_1.html"], ["9603532_1.html", "9848888_2.html", "18479744_2.html", "24780614_3.html", "17244641_2.html", "26630143_2.html", "26304934_2.html", "19915221_2.html", "8950879_1.html", "30659410_1.html"], ["30659410_2.html", "30659410_3.html", "30465321_2.html", "30465321_3.html", "30465321_4.html", "30465321_5.html", "30465321_6.html", "26547918_2.html", "22316106_2.html", "22436129_2.html"], ["22709460_2.html", "23564919_2.html", "23683134_2.html", "24251359_3.html", "26093161_1.html", "26578849_2.html", "27103795_1.html", "27207971_1.html", "27387994_1.html", "27496855_1.html"]]; // Second Session docids

            ordered_Splits = [["30936738_1.html", "30936738_2.html", "30936738_3.html", "30936738_4.html", "30936738_5.html", "16508926_6.html", "27744141_2.html", "16495392fig_2.html", "24907147_2.html", "24907147_3.html"], ["24907147_4.html", "24907147_5.html", "27502582_2.html", "30473179_3.html", "25047021_1.html", "27165179_2.html", "29338762_2.html", "29299340_2.html", "30696483_2.html", "29409133_1.html"], ["28968735_2.html", "28968735_3.html", "29045207_2.html", "29685860fig_1.html", "19515181_2.html", "25414932_1.html", "26833744_2.html", "26833744_3.html", "30287422_2.html", "29937431_2.html"], ["25881510_2.html", "25772548_2.html", "30425095_1.html", "30425095b_1.html", "30609212_1.html", "30609212_2.html", "19210140_2.html", "26579834_1.html", "26579834_5.html", "26580237_3.html"], ["27299675_1.html", "30393950_2.html", "19614946_2.html", "19614946_3.html", "30614616_1.html", "26786577_2.html", "18284434_2.html", "22672586_2.html", "30830724_1.html", "30830724_2.html"], ["25468945_2.html", "25629790_2.html", "30566006fig_1.html", "30392095_2.html", "19650752_2.html", "30953107_1.html", "30953107_2.html", "21545947fig_2.html", "19917888app_1.html", "17384437fig_1.html"], ["9036306_1.html", "18371559_1.html", "26541915_6.html", "26027630fig_1.html", "15639688_2.html", "17560879_2.html", "27619750_3.html", "24411003_1.html", "25743173_2.html", "25743173_3.html"], ["19166691_2.html", "27956003_2.html", "27846344fig_2.html", "25282519_2.html", "19190658_2.html", "21925996_2.html", "21925996_3.html", "21925996_4.html", "24067881_2.html", "22504093_2.html"], ["30203005_2.html", "29857145_3.html", "29857145_4.html", "29857145_5.html", "29857145_6.html", "29857145_7.html", "16267322_2.html", "17634459_2.html", "20491747_2.html", "29909019_2.html"], ["29797519_1.html", "24120253_4.html", "21227674_2.html", "20463178_2.html", "27609408_2.html", "24966672_3.html", "30815468_1.html", "30815468_2.html", "30815468_3.html", "27087007_1.html"], ["27316465_2.html", "27316465_3.html", "27316465_4.html", "27316465_5.html", "27215749_3.html", "27715335_2.html", "18511702_2.html", "21627828_2.html", "21627828_3.html", "21586508_2.html"], ["28558833_2.html", "28558833_3.html", "29413502_2.html", "21875546_2.html", "23040786_2.html", "28903864_2.html", "30053967fig_1.html", "20925534_2.html", "20925534_3.html", "29073947_2.html"], ["26994121_2.html", "24727254_2.html", "26059896fig_2.html", "19389561fig_2.html", "21816478_2.html", "7997016_1.html", "9603532_1.html", "9848888_2.html", "18479744_2.html", "24780614_3.html"], ["17244641_2.html", "26630143_2.html", "26304934_2.html", "19915221_2.html", "8950879_1.html", "26547918_2.html", "22316106_2.html", "22436129_2.html", "22709460_2.html", "23564919_2.html"], ["23683134_2.html", "24251359_3.html", "26578849_2.html", "27103795_1.html", "27496855_1.html"]];
            ordered_docs_to_label = [["25277614_2.html", "19336502_4.html", "24001888_2.html", "28544533_2.html", "28544533_3.html", "27965257_2.html", "30564451_2.html", "18823986_2.html", "17965424_2.html", "19560810_1.html"], ["29463520_2.html", "30121827_3.html", "18821708_3.html", "26238672_1.html", "26238672_2.html", "20937671_2.html", "28405473_2.html", "28153828_2.html", "26139005_2.html", "29908670_1.html"], ["26275429_2.html", "22873530_2.html", "22052584_2.html", "25779603_2.html", "22378566_2.html", "28215362_2.html", "26097039_2.html", "26097039_3.html", "29415145_1.html", "29415145_2.html"], ["27028914_2.html", "30191421_2.html", "24339179_2.html", "29556416_2.html", "29556416_3.html", "29880010_1.html", "30522501_1.html", "30871355_3.html", "30871355_4.html", "24245566_2.html"], ["23501976_2.html", "23396280_2.html", "30165610_3.html", "23810874_2.html", "30146932_2.html", "30146931_2.html", "30146931_3.html", "30590387_2.html", "30590387_3.html", "28531241_2.html"], ["27893045_2.html", "19001024_1.html", "19125778_2.html", "27033025_2.html", "23339726_2.html", "26132939_2.html", "26132939_3.html", "26132939_4.html", "26744025_2.html", "28237263_2.html"], ["28237263_3.html", "29145215_2.html", "29145215_3.html", "22193143_2.html", "26774608_2.html", "26774608_3.html", "29064626_2.html", "28246236_2.html", "27289121_2.html", "25765696_2.html"], ["25765696_3.html", "23706759_2.html", "28753486_2.html", "28753486_3.html", "28605608_2.html", "29941478_1.html", "29941478_2.html", "29937267_2.html", "29526832_2.html", "22686416_2.html"], ["26681720_2.html", "24898834_2.html", "24898834_3.html", "23656980_2.html", "23564916_2.html", "23564916_3.html", "23564916_4.html", "30203580_2.html", "28842165_2.html", "28842165_3.html"], ["22913891_3.html", "22913891_4.html", "22913891_5.html", "22913891_6.html", "17878242_1.html", "22234149_2.html", "27252787_2.html", "28327140_2.html", "27977934_2.html", "28197834_2.html"], ["26373629_2.html", "26373629_3.html", "24918789_2.html", "26580237_2.html", "28904068_2.html", "28666775_2.html", "28666775_3.html", "28386035_1.html", "28386035_2.html", "27299675_2.html"], ["26378978_2.html", "26378978_3.html", "30586757_3.html", "29777264_1.html", "28910237_2.html", "18223031_2.html", "18223031_3.html", "28921862_3.html", "25795432_2.html", "25795432_3.html"], ["25592197_2.html", "26179619_2.html", "19688336_2.html", "18539916_1.html", "18539916_2.html", "17765963_2.html", "30571562_3.html", "22369287_2.html", "26524706_2.html", "26524706_3.html"], ["26358285_2.html", "25758769_2.html", "25552421_2.html", "25552421_3.html", "25189213_1.html", "25189213_2.html", "23992601_2.html", "23992601_3.html", "17980928_3.html", "30474818_2.html"], ["29766634_2.html", "21682834_2.html", "27484756_2.html", "23909985_2.html", "24067431_2.html", "29103664_2.html", "26121561_2.html", "22509859_1.html", "19097665_2.html", "19097665_3.html"], ["30882239_2.html", "30415602_2.html", "30547388_2.html", "30547388_3.html", "30547388_4.html", "29159457_2.html", "25852208_2.html", "20228403_2.html", "20228403_3.html", "20228403_4.html"], ["20228402_2.html", "20228402_3.html", "20228402_4.html", "29790415_1.html", "29790415_2.html", "27502307_2.html", "29748996_1.html", "27742728_2.html", "27437883_2.html", "28035868_2.html"], ["27977392_2.html", "27977392_3.html", "25271206_2.html", "27684308_2.html", "23129601_2.html", "23963895_2.html", "27295427_2.html", "28854085_2.html", "29279300_2.html", "30566006_1.html"], ["30566006_2.html", "30566004_1.html", "30354517_1.html", "30586723_2.html", "30586723_3.html", "30418475_2.html", "21428766_2.html", "18094675_2.html", "18094675_3.html", "18094675_4.html"], ["18199798_2.html", "24206457_2.html", "21332627_2.html", "21332627_3.html", "26620248_2.html", "27406394_2.html", "25352655_2.html", "25352655_3.html", "28432746_1.html", "28432746_2.html"], ["28386990_1.html", "28386990_2.html", "28386990_3.html", "30218434_1.html", "30291013_2.html", "28263812_2.html", "29664406_2.html", "29228101_2.html", "29148144_2.html", "28359411_2.html"], ["26475142_2.html", "24281137_3.html", "29431256_2.html", "28948656_2.html", "28402745_2.html", "27842179_2.html", "27395349_3.html", "27354044_2.html", "26915374_2.html", "26754626_3.html"], ["26541915_3.html", "26541915_5.html", "29661699_2.html", "20487050_2.html", "26027630_2.html", "30183102_1.html", "30183102_2.html", "19660610_2.html", "27639753_2.html", "27639753_3.html"], ["27639753_4.html", "15781429_2.html", "17560879_1.html", "22913893_2.html", "21174145_2.html", "20953684_2.html", "27619750_2.html", "28844508_2.html", "28844508_3.html", "26330422_2.html"], ["28391886_2.html", "17058629_2.html", "23040830_2.html", "15924587_2.html", "16709304_2.html", "16709304_3.html", "16709304_4.html", "29263150_2.html", "29263150_3.html", "29151034_2.html"], ["29151034_3.html", "29151034_4.html", "29151034_5.html", "28972004_1.html", "28972004_2.html", "28972004_3.html", "28231942_2.html", "29903515_2.html", "29903515_3.html", "29903515_4.html"], ["20151997_2.html", "17022864_3.html", "30336824_2.html", "30336824_3.html", "17011942_2.html", "22573644_2.html", "21815708_1.html", "21815708_2.html", "19423108_2.html", "19104004_3.html"], ["18172039_2.html", "18172039_3.html", "30415628_1.html", "28905478_1.html", "28905478_2.html", "28905478_3.html", "16116047_3.html", "16116047_4.html", "16116047_5.html", "16139123_3.html"], ["16139123_4.html", "18259029_2.html", "19139391_2.html", "16537662_2.html", "18498915_2.html", "18498915_3.html", "30175930_2.html", "25031188_2.html", "23733198_2.html", "23110471_1.html"], ["23110471_3.html", "22799613_1.html", "22799613_2.html", "20678674_2.html", "20469975_2.html", "18326958_2.html", "18615004_2.html", "18657652_2.html", "18375982_2.html", "15381674_2.html"], ["22248871_2.html", "19751115_2.html", "26066644_1.html", "23307827_2.html", "19596014_3.html", "21933100_2.html", "24120253_3.html", "26704701_2.html", "28877027_2.html", "26100349_2.html"], ["26100349_3.html", "21428765_2.html", "25045258_2.html", "23020650_2.html", "22177371_2.html", "26563670_2.html", "27796912_2.html", "28720336_2.html", "27616196_2.html", "27616196_3.html"], ["27616196_5.html", "23714653_2.html", "20418083_2.html", "20185426_2.html", "19716598_2.html", "18836213_2.html", "30290801_2.html", "30290801_3.html", "27215502_2.html", "30139780_2.html"], ["29409951_2.html", "29409951_3.html", "24966672_2.html", "28416587_2.html", "27767328_1.html", "27767328_2.html", "27767328_3.html", "27767328_4.html", "30587959_3.html", "30587959_4.html"], ["30587959_5.html", "30587959_6.html", "30584583_2.html", "30584583_3.html", "23471469_2.html", "23471469_3.html", "24156566_2.html", "25248764_2.html", "28278391_2.html", "27181606_2.html"], ["29925383_2.html", "27912982_2.html", "27912982_3.html", "27912982_4.html", "17605774_2.html", "17605774_3.html", "27993292_2.html", "27993292_3.html", "26112656_3.html", "25573406_2.html"], ["19443528_2.html", "20685748_2.html", "25490706_2.html", "25736990_2.html", "28159511_2.html", "29782217_2.html", "29782217_3.html", "24383720_2.html", "26233481_2.html", "26233481_3.html"], ["26233481_4.html", "29128192_3.html", "27609406_2.html", "22544891_2.html", "28395936_2.html", "27056586_2.html", "28848879_2.html", "28385353_2.html", "28385353_3.html", "28385353_4.html"], ["28385353_5.html", "28385353_6.html", "28385353_7.html", "24321804_2.html", "29429593_2.html", "23040786_1.html", "24253831_3.html", "24596459_2.html", "30053967_1.html", "30053967_2.html"], ["28720132_2.html", "28720132_3.html", "29713156_2.html", "29671280_2.html", "22259009_2.html", "27576774_2.html", "27046159_2.html", "26586780_2.html", "30354781_2.html", "23121439_2.html"], ["23121439_3.html", "25037988_2.html", "25037988_3.html", "24097439_2.html", "30166073_3.html", "15590586_2.html", "15590586_3.html", "15590586_4.html", "15998890_2.html", "15753114_2.html"], ["11442551_2.html", "25475110_2.html", "21673005_2.html", "18835953_2.html", "18339679_2.html", "24727254_3.html", "16801465_2.html", "19332455_2.html", "26059896_1.html", "26059896_2.html"], ["26059896_3.html", "26059896_4.html", "20385930_2.html", "20385930_3.html", "20357382_2.html", "20357382_3.html", "19389561_2.html", "19389561_3.html", "19349325_2.html", "20136164_1.html"], ["20136164_2.html", "20136164_3.html", "20136164_4.html", "20136164_5.html", "25670362_2.html", "25670362_3.html", "9892586_3.html", "9892586_4.html", "9841303_2.html", "23473396_2.html"], ["25161043_2.html", "15451146_2.html", "15337732_2.html", "27581531_2.html", "20400762_1.html", "24780614_2.html", "28844990_2.html", "18499565_2.html", "19850249_1.html", "19850249_2.html"], ["19850248_2.html", "19850248_3.html", "21060071_2.html", "25175921_2.html", "25175921_3.html", "30302940_4.html", "28939567_2.html", "16214597_2.html", "16214597_3.html", "16905022_2.html"], ["26762481_2.html", "25775052_2.html", "25775052_3.html", "25775052_4.html", "25775052_5.html", "27043082_2.html", "26321103_2.html", "19332467_2.html", "20582594_2.html", "21545942_2.html"], ["26271059_2.html", "21780946_2.html", "29447769_2.html", "24247616_2.html", "24247616_3.html", "15758000_2.html", "25523533_2.html", "24076283_2.html", "20200926_2.html", "27612281_4.html"], ["27612281_5.html", "27612281_6.html", "19776408_2.html", "28827011_2.html", "28924103_2.html", "26486868_2.html", "25657183_2.html", "16537663_2.html", "19717844_2.html", "19966341_2.html"], ["20194881_2.html", "20370912_2.html", "21059484_2.html", "21147728_2.html", "21576658_2.html", "21576658_3.html", "22084332_2.html", "22700854_2.html", "23271794_2.html", "23271794_3.html"], ["23743976_2.html", "23770182_1.html", "23770182_2.html", "23770182_3.html", "23991658_2.html", "23991658_3.html", "24251359_2.html", "24323795_2.html", "24842985_2.html", "25769357_2.html"], ["25769357_3.html", "26065986_2.html", "26093161_2.html", "26179767_2.html", "27358434_2.html", "27609678_2.html", "27807306_2.html", "28213368_2.html", "28302288_2.html", "28520924_2.html"], ["28520924_3.html", "28666993_2.html", "28689179_2.html", "29248859_2.html", "30012318_3.html"]];
            ordered_docs_to_label = [["25277614_2.html", "19336502_4.html", "24001888_2.html", "27965257_2.html", "30564451_2.html", "18823986_2.html", "17965424_2.html", "19560810_1.html", "29463520_2.html", "30121827_3.html"], ["18821708_3.html", "20937671_2.html", "28405473_2.html", "28153828_2.html", "26139005_2.html", "29908670_1.html", "26275429_2.html", "22873530_2.html", "22052584_2.html", "25779603_2.html"], ["22378566_2.html", "28215362_2.html", "26097039_2.html", "26097039_3.html", "29415145_1.html", "29415145_2.html", "27028914_2.html", "24339179_2.html", "29556416_2.html", "29556416_3.html"], ["29880010_1.html", "30522501_1.html", "30871355_3.html", "30871355_4.html", "24245566_2.html", "23396280_2.html", "30165610_3.html", "23810874_2.html", "30146932_2.html", "30146931_2.html"], ["30146931_3.html", "30590387_2.html", "30590387_3.html", "27893045_2.html", "19125778_2.html", "27033025_2.html", "23339726_2.html", "26132939_2.html", "26132939_3.html", "26132939_4.html"], ["28237263_2.html", "28237263_3.html", "29145215_2.html", "29145215_3.html", "26774608_2.html", "26774608_3.html", "29064626_2.html", "28246236_2.html", "27289121_2.html", "23706759_2.html"], ["28753486_2.html", "28753486_3.html", "28605608_2.html", "29937267_2.html", "29526832_2.html", "22686416_2.html", "26681720_2.html", "24898834_2.html", "24898834_3.html", "23656980_2.html"], ["23564916_2.html", "23564916_3.html", "23564916_4.html", "28842165_2.html", "28842165_3.html", "22913891_3.html", "22913891_4.html", "22913891_5.html", "22913891_6.html", "17878242_1.html"], ["22234149_2.html", "27252787_2.html", "28327140_2.html", "27977934_2.html", "28197834_2.html", "26373629_2.html", "26373629_3.html", "24918789_2.html", "26580237_2.html", "28904068_2.html"], ["28666775_2.html", "28666775_3.html", "28386035_1.html", "28386035_2.html", "27299675_2.html", "26378978_2.html", "26378978_3.html", "30586757_3.html", "28910237_2.html", "18223031_2.html"], ["18223031_3.html", "28921862_3.html", "25795432_2.html", "25795432_3.html", "25592197_2.html", "26179619_2.html", "18539916_1.html", "18539916_2.html", "17765963_2.html", "22369287_2.html"], ["26358285_2.html", "25189213_1.html", "25189213_2.html", "23992601_2.html", "23992601_3.html", "17980928_3.html", "30474818_2.html", "29766634_2.html", "21682834_2.html", "27484756_2.html"], ["23909985_2.html", "24067431_2.html", "29103664_2.html", "26121561_2.html", "19097665_2.html", "19097665_3.html", "30882239_2.html", "30415602_2.html", "30547388_2.html", "30547388_3.html"], ["30547388_4.html", "29159457_2.html", "25852208_2.html", "20228403_2.html", "20228403_3.html", "20228403_4.html", "20228402_2.html", "20228402_3.html", "20228402_4.html", "29790415_1.html"], ["29790415_2.html", "27502307_2.html", "29748996_1.html", "27742728_2.html", "27437883_2.html", "28035868_2.html", "27977392_2.html", "27977392_3.html", "25271206_2.html", "27684308_2.html"], ["23129601_2.html", "23963895_2.html", "27295427_2.html", "28854085_2.html", "29279300_2.html", "30566006_1.html", "30566006_2.html", "30586723_2.html", "30586723_3.html", "30418475_2.html"], ["21428766_2.html", "18094675_2.html", "18094675_3.html", "18094675_4.html", "18199798_2.html", "24206457_2.html", "26620248_2.html", "27406394_2.html", "25352655_2.html", "25352655_3.html"], ["28432746_1.html", "28432746_2.html", "28386990_1.html", "28386990_2.html", "28386990_3.html", "30218434_1.html", "30291013_2.html", "28263812_2.html", "29228101_2.html", "29148144_2.html"], ["28359411_2.html", "26475142_2.html", "24281137_3.html", "28402745_2.html", "27842179_2.html", "26915374_2.html", "26754626_3.html", "26541915_3.html", "26541915_5.html", "20487050_2.html"], ["26027630_2.html", "19660610_2.html", "27639753_2.html", "27639753_3.html", "27639753_4.html", "15781429_2.html", "17560879_1.html", "22913893_2.html", "21174145_2.html", "20953684_2.html"], ["27619750_2.html", "28844508_2.html", "28844508_3.html", "26330422_2.html", "28391886_2.html", "23040830_2.html", "15924587_2.html", "16709304_2.html", "16709304_3.html", "16709304_4.html"], ["29263150_2.html", "29263150_3.html", "28972004_1.html", "28972004_2.html", "28972004_3.html", "17022864_3.html", "30336824_2.html", "30336824_3.html", "17011942_2.html", "21815708_1.html"], ["21815708_2.html", "19423108_2.html", "19104004_3.html", "18172039_2.html", "18172039_3.html", "30415628_1.html", "28905478_1.html", "28905478_2.html", "28905478_3.html", "19139391_2.html"], ["16537662_2.html", "18498915_2.html", "18498915_3.html", "30175930_2.html", "25031188_2.html", "23733198_2.html", "23110471_1.html", "23110471_3.html", "20678674_2.html", "20469975_2.html"], ["18326958_2.html", "18615004_2.html", "18657652_2.html", "18375982_2.html", "15381674_2.html", "19751115_2.html", "26066644_1.html", "23307827_2.html", "19596014_3.html", "21933100_2.html"], ["24120253_3.html", "28877027_2.html", "26100349_2.html", "26100349_3.html", "21428765_2.html", "25045258_2.html", "23020650_2.html", "22177371_2.html", "26563670_2.html", "27616196_2.html"], ["27616196_3.html", "27616196_5.html", "23714653_2.html", "20185426_2.html", "18836213_2.html", "30290801_2.html", "30290801_3.html", "27215502_2.html", "30139780_2.html", "29409951_2.html"], ["29409951_3.html", "24966672_2.html", "28416587_2.html", "27767328_1.html", "27767328_2.html", "27767328_3.html", "27767328_4.html", "30587959_3.html", "30587959_4.html", "30587959_5.html"], ["30587959_6.html", "30584583_2.html", "30584583_3.html", "23471469_2.html", "23471469_3.html", "24156566_2.html", "25248764_2.html", "28278391_2.html", "27181606_2.html", "29925383_2.html"], ["17605774_2.html", "17605774_3.html", "27993292_2.html", "27993292_3.html", "26112656_3.html", "25573406_2.html", "19443528_2.html", "20685748_2.html", "25490706_2.html", "25736990_2.html"], ["28159511_2.html", "29782217_2.html", "29782217_3.html", "24383720_2.html", "26233481_2.html", "26233481_3.html", "26233481_4.html", "27609406_2.html", "22544891_2.html", "28395936_2.html"], ["27056586_2.html", "28848879_2.html", "28385353_2.html", "28385353_3.html", "28385353_4.html", "28385353_5.html", "28385353_6.html", "28385353_7.html", "24321804_2.html", "29429593_2.html"], ["23040786_1.html", "24253831_3.html", "24596459_2.html", "30053967_1.html", "30053967_2.html", "28720132_2.html", "28720132_3.html", "29713156_2.html", "29671280_2.html", "22259009_2.html"], ["27576774_2.html", "27046159_2.html", "26586780_2.html", "30354781_2.html", "23121439_2.html", "23121439_3.html", "25037988_2.html", "25037988_3.html", "24097439_2.html", "30166073_3.html"], ["15590586_2.html", "15590586_3.html", "15590586_4.html", "15998890_2.html", "15753114_2.html", "11442551_2.html", "25475110_2.html", "21673005_2.html", "18835953_2.html", "18339679_2.html"], ["24727254_3.html", "19332455_2.html", "26059896_1.html", "26059896_2.html", "26059896_3.html", "26059896_4.html", "20357382_2.html", "20357382_3.html", "19389561_2.html", "19389561_3.html"], ["20136164_1.html", "20136164_2.html", "20136164_3.html", "20136164_4.html", "20136164_5.html", "25670362_2.html", "25670362_3.html", "9892586_3.html", "9892586_4.html", "9841303_2.html"], ["23473396_2.html", "25161043_2.html", "15451146_2.html", "15337732_2.html", "27581531_2.html", "20400762_1.html", "24780614_2.html", "28844990_2.html", "18499565_2.html", "19850249_1.html"], ["19850249_2.html", "19850248_2.html", "19850248_3.html", "21060071_2.html", "25175921_2.html", "25175921_3.html", "16214597_2.html", "16214597_3.html", "16905022_2.html", "25775052_2.html"], ["25775052_3.html", "25775052_4.html", "25775052_5.html", "27043082_2.html", "26321103_2.html", "19332467_2.html", "20582594_2.html", "21545942_2.html", "26271059_2.html", "21780946_2.html"], ["24247616_2.html", "24247616_3.html", "15758000_2.html", "25523533_2.html", "24076283_2.html", "20200926_2.html", "27612281_4.html", "27612281_5.html", "27612281_6.html", "19776408_2.html"], ["28827011_2.html", "26486868_2.html", "16537663_2.html", "19717844_2.html", "19966341_2.html", "20194881_2.html", "20370912_2.html", "21147728_2.html", "21576658_2.html", "21576658_3.html"], ["22700854_2.html", "23271794_2.html", "23271794_3.html", "23770182_1.html", "23770182_2.html", "23770182_3.html", "23991658_2.html", "23991658_3.html", "24251359_2.html", "24842985_2.html"], ["26065986_2.html", "27358434_2.html", "27807306_2.html", "28302288_2.html", "28666993_2.html", "29248859_2.html", "30012318_3.html"]];
            ordered_docs_to_label = [["25277614_2.html", "30564451_2.html", "19560810_1.html", "18821708_3.html", "28405473_2.html", "22378566_2.html", "26097039_2.html", "26097039_3.html", "29880010_1.html", "30522501_1.html"], ["30165610_3.html", "30590387_2.html", "30590387_3.html", "29145215_2.html", "27289121_2.html", "29937267_2.html", "22686416_2.html", "24898834_2.html", "24898834_3.html", "23656980_2.html"], ["23564916_2.html", "28842165_2.html", "17878242_1.html", "28327140_2.html", "26373629_2.html", "26373629_3.html", "28666775_2.html", "28386035_2.html", "27299675_2.html", "30586757_3.html"], ["28910237_2.html", "28921862_3.html", "25795432_2.html", "25795432_3.html", "25592197_2.html", "26179619_2.html", "18539916_1.html", "27484756_2.html", "24067431_2.html", "29103664_2.html"], ["30882239_2.html", "30547388_2.html", "30547388_3.html", "30547388_4.html", "29159457_2.html", "20228403_2.html", "20228403_3.html", "20228403_4.html", "20228402_2.html", "20228402_3.html"], ["20228402_4.html", "29790415_1.html", "27437883_2.html", "25271206_2.html", "29279300_2.html", "30566006_1.html", "30418475_2.html", "18094675_4.html", "24206457_2.html", "28432746_2.html"], ["28386990_1.html", "30218434_1.html", "28263812_2.html", "29228101_2.html", "24281137_3.html", "26915374_2.html", "26754626_3.html", "26541915_3.html", "26541915_5.html", "20487050_2.html"], ["19660610_2.html", "27639753_4.html", "21174145_2.html", "20953684_2.html", "27619750_2.html", "17022864_3.html", "17011942_2.html", "21815708_1.html", "21815708_2.html", "19423108_2.html"], ["18172039_2.html", "28905478_1.html", "25031188_2.html", "23110471_1.html", "15381674_2.html", "23307827_2.html", "19596014_3.html", "24120253_3.html", "21428765_2.html", "26563670_2.html"], ["27616196_2.html", "27616196_3.html", "20185426_2.html", "30290801_3.html", "29409951_2.html", "29409951_3.html", "24966672_2.html", "27767328_1.html", "27767328_2.html", "27767328_3.html"], ["27767328_4.html", "30587959_3.html", "30587959_4.html", "30587959_6.html", "23471469_2.html", "24156566_2.html", "25248764_2.html", "28278391_2.html", "17605774_2.html", "17605774_3.html"], ["26112656_3.html", "19443528_2.html", "28159511_2.html", "22544891_2.html", "24321804_2.html", "29429593_2.html", "24253831_3.html", "30053967_2.html", "28720132_3.html", "15998890_2.html"], ["18339679_2.html", "26059896_1.html", "19389561_2.html", "25670362_2.html", "25670362_3.html", "23473396_2.html", "18499565_2.html", "19850249_1.html", "19332467_2.html", "20582594_2.html"], ["24247616_3.html", "19776408_2.html", "28827011_2.html", "26486868_2.html", "16537663_2.html", "22700854_2.html", "23271794_2.html", "23271794_3.html", "23991658_3.html", "24251359_2.html"], ["27807306_2.html", "28302288_2.html"]];
            exclude_pmids = ["19508464", "30659410", "30571562", "27576559", "12205648", "16139123", "26589819", "22747613", "27672117", "25135178", "29143919", "26524706", "22193143", "30465321", "16278257", "21332627", "27912982", "20723849", "28720336", "22084332", "20883926", "23812596", "11937179", "22396585", "19349325", "26093161", "18537526", "25681464", "28300867", "27046160", "30302940", "30851070", "28948656", "26523993", "17058629", "11104295", "22704916", "30191421", "27395349", "18676075", "22490878", "16801465", "29941478", "19001024", "29431256", "27039236", "22432932", "30203580", "19447387", "19716598", "12803733", "25765696", "20801495", "30882238", "19917888", "27609678", "23117723", "30354517", "28520924", "27796912", "18000186", "18370800", "22573644", "23279632", "25787199", "19688336", "26238672", "29406853", "29903515", "20436046", "20484828", "23501976", "27098404", "29777264", "21059484", "27387994", "15734614", "28679611", "22932716", "30566004", "29447769", "24323795", "25552421", "27493790", "16116047", "28231942", "19704100", "20707767", "27708114", "27267268", "30341453", "29661699", "20151997", "28924103", "25657183", "21723220", "21939839", "29307087", "30183102", "27589414", "28531241", "27448534", "27161178", "24742013", "28801539", "27207971", "20670726", "28213368", "27502866", "25758769", "17060377", "17065671", "17392541", "19793357", "24842697", "23219284", "20429821", "26934128", "21502969", "21680990", "22913890", "23672632", "30425195", "26039935", "30729456", "25354738", "29743836", "30200078", "29128192", "25406305", "23743976", "22248871", "26179767", "27600862", "27313282", "26704701", "27482610", "27354044", "12409542", "23529173", "20385930", "20418083", "29151034", "18259029", "26762525", "28939567", "26762481", "22470539", "28637881", "18813219", "28544533", "15811979", "29664406", "22799613", "17846352", "22509859", "26744025", "28689179", "25769357", "15103313", "26400827"];
            with_corrupted_text = allAnnotations.rows.reduce(function (acc, tab) {
              if (tab.corrupted_text.trim().length > 0 && tab.corrupted_text.trim() != 'undefined') {
                acc[tab.docid + "_" + tab.page + ".html"] = tab.corrupted_text;
              }

              return acc;
            }, {}); // var docs_w_issues = ordered_docs_to_label.flat().filter( tab => {return Object.keys(with_corrupted_text).indexOf(tab) > -1 } )

            allLabelled = ["21128814_2", "12899584_1", "26446706_1", "25465417_2", "18972097_1", "27144849_1", "17304660_2", "10438259_2", "20484828_1", "19847908_2", "26792812_2", "21871706_2", "15851647_3", "22576673_2", "30734043_2", "27647847_2", "29685860_2", "15659722_2", "17984166_2", "12479763_1", "15051694_2", "15049402_2", "28473423_2", "24119319_2", "25681464_2", "15537681_2", "25792124_2", "23726159_2", "18398080_2", "29793629_2", "27589414_2", "18227370_4", "18757090_2", "19704100_2", "20801495_2", "20801500_2", "23564916_3", "17470434_2", "18227370_5", "19001508_2", "19717850_2", "20883926_2", "21216833_2", "22235820_2", "28968735_2", "17384437_1", "26699168_2", "19470885_2", "23992602_2", "21128814_3", "26491109_2", "27659566_2", "30371334_6", "12803733_2", "15998891_2", "25775052_3", "26338971_2", "23500237_2", "27659566_3", "16651474_1", "18676075_2", "29045207_2", "27046160_2", "18821708_2", "18537526_2", "15238590_1", "30586757_6", "20979470_3", "14724302_2", "27959607_2", "30352894_2", "12456232_2", "19336502_2", "27046162_2", "18753639_2", "26886418_2", "28382371_2", "21502549_2", "27576775_2", "28573499_2", "17456819_2", "29299340_2", "15883637_2", "10789664_1", "30586757_5", "27708114_2", "26135703_2", "21332630_2", "22305835_2", "28382371_3", "29409133_1", "19369667_2", "22335737_1", "27765312_2", "28573499_3", "28189475_2", "16380589_2", "16508926_3", "28844192_2", "28573499_4", "28801539_2", "30465321_3", "29941478_2", "28818881_2", "25046337_2", "30465321_4", "20707767_1", "8121459_2", "27418597_2", "24664227_2", "30465321_5", "23325525_1", "16508926_4", "28300867_2", "18753638_2", "28801539_3", "30865796_2", "25352655_3", "23216615_2", "28316279_2", "10438259_1", "12243636_1", "30830724_5", "29132879_2", "23473369_2", "12803733_5", "23735746_2", "15579515_2", "30586757_4", "26054553_2", "30696483_1", "15028365_1", "28968735_3", "12456232_3", "27190009_2", "30830724_6", "28882235_2", "16508926_5", "17097378_1", "26471380_2", "28882235_3", "29490509_2", "30591006_2", "23812596_2", "29406853_2", "19336502_3", "19409693_2", "29132879_3", "20136164_5", "29307087_2", "12205648_2", "25175921_2", "23451835_2", "30465321_2", "30882239_5", "30882239_4", "30851070_2", "30830724_4", "21642014_3", "22337213_2", "30465321_6", "22672586_2", "30882239_3", "17097378_2", "30609212_2", "23425163_2", "27612281_2", "20163842_2", "19567517_2", "27465265_2", "30696483_2", "27616196_4", "20436046_2", "17804843_2", "27144849_5", "17113426_2", "18753639_3", "20393175_3", "30851070_3", "27576559_2", "24839241_2", "28801539_4", "28902593_2", "30830724_3", "25354738_2", "29132879_4", "28801539_5", "17846352_2", "23425163_3", "23465037_2", "30882238_2", "30614616_2", "27612281_3", "28432746_1", "27672117_2", "19726772_2", "28847206_2", "29132880_2", "27935736_2", "17634458_2", "25698905_2", "17292766_3", "24184169_2", "20979470_2", "29937267_2", "20678878_2", "28246237_2", "27335114_2", "30654882_1", "19683639_2", "28467869_2", "28467869_3", "29028981_3", "28279891_2", "22443427_2", "27144849_2", "30667279_1", "29146124_2", "11527638_1", "18000186_2", "18757089_2", "28753486_3", "29431256_2", "25698905_3", "26400827_3", "12803733_4", "18227370_2", "22443427_3", "17292766_4", "20925544_2", "21545947_3", "22235820_3", "22396585_2", "22470539_2", "22490878_1", "22490878_2", "22490878_3", "24283598_2", "17398308_2", "24621834_2", "24716680_3", "11419425_2", "28975241_2", "26523993_2", "15659722_1", "20883926_3", "30525116_2", "19850525_2", "26523993_3", "17846352_3", "18227370_3", "19917888_2", "20801495_3", "17292766_5", "26653621_2", "20925544_3", "23529173_2", "30525116_3", "25773268_2", "29544870_2", "30525116_4", "29146124_3", "16714187_2", "22932716_2", "29544870_3", "25399274_2", "16533938_2", "29084736_2", "29544870_4", "22085343_1", "29685860_1", "27144849_4", "26151264_2", "26762525_2", "18032739_2", "25465416_2", "26762525_3", "20621900_2", "27313282_2", "19917888_3", "12601075_2", "23529173_3", "26052984_2", "17060377_2", "30609212_3", "30591006_3", "28118533_2", "15028365_2", "30729456_2", "26547918_2", "27589414_1", "26627989_2", "27639327_2", "29028981_2", "12803733_3", "16572114_2", "17259484_2", "16495392_2", "23964932_2", "21645018_2", "25728587_2", "19201775_2", "19596014_2", "25182247_2", "19447387_2", "28899222_2", "30248105_2", "30248105_3", "30248105_4", "30026335_2", "27144849_3", "19447387_3", "18674411_2", "24727258_2", "25728587_3", "30026335_3", "23128104_2", "17470824_2", "30352894_1", "20436046_3", "27767328_4", "29925383_2", "29671280_2", "18451347_2", "20393175_4", "21209123_2", "17065671_2", "14657064_2", "15851647_2", "12899584_2", "28753486_2", "18667204_2", "17060377_3", "29429593_2", "23307827_2", "25037988_2", "20357382_2", "28844990_2", "25775052_2", "24842697_3", "24842697_2", "25002161_2", "25176136_2", "25406305_2", "25455006_2", "23040786_1", "25637937_2", "26374849_2", "26475142_3", "26541915_2", "20393175_2", "27993292_2", "27767328_1", "25775052_4", "26754626_2", "25277614_2", "22259009_2", "21673005_2", "15590586_2", "24383720_2", "25037988_3", "25175921_3", "19336502_4", "24001888_2", "29263150_2", "27612281_4", "30290801_2", "19332455_2", "28544533_2", "28544533_3", "27965257_2", "30564451_2", "18823986_2", "17965424_2", "19560810_1", "15590586_3", "28153828_2", "30936738_2", "30936738_3", "30936738_4", "30936738_5", "16508926_6", "27744141_2", "27098404_1", "30341453_1", "30341453_2", "19917888app_1", "29463520_2", "30121827_3", "18821708_3", "26275429_2", "23501976_2", "23396280_2", "27893045_2", "27581531_2", "16905022_2", "26233481_2", "28237263_3", "23810874_2", "27028914_2", "25769357_3", "29145215_2", "30584583_2", "25775052_5", "15590586_4", "19125778_2", "29145215_3", "30146932_2", "22873530_2", "24253831_3", "26065986_2", "29880010_1", "19389561_3", "27616196_2", "26233481_3", "22193143_2", "30146931_2", "26586780_2", "16214597_2", "30191421_2", "22052584_2", "30146931_3", "25779603_2", "24339179_2", "26774608_2", "27033025_2", "27358434_2", "27993292_3", "28215362_2", "28520924_3", "26774608_3", "25670362_2", "23339726_2", "29556416_2", "28213368_2", "28689179_2", "28531241_2", "28520924_2", "29064626_2", "26093161_2", "29415145_1", "20400762_1", "28246236_2", "26132939_3", "26132939_2", "29415145_2", "26132939_4", "29248859_2", "25765696_3", "26744025_2", "23743976_2", "30012318_3", "23706759_2", "28237263_2", "27289121_2", "29556416_3", "25765696_2", "22913891_3", "20194881_2", "28605608_2", "24097439_2", "26233481_4", "27767328_2", "30587959_3", "11442551_2", "20370912_2", "23770182_1", "24596459_2", "24780614_2", "30584583_3", "26139005_2", "22913891_4", "21059484_2", "30871355_3", "22913891_5", "23770182_2", "30871355_4", "22913891_6", "21147728_2", "29526832_2", "21576658_2", "26373629_2", "24245566_2", "19596014_3", "24842985_2", "23473396_2", "29908670_1", "30587959_4", "18339679_2", "30053967_1", "21576658_3", "23564916_4", "29941478_1", "23770182_3", "27043082_2", "30587959_5", "28385353_4", "30166073_3", "16214597_3", "17878242_1", "30203580_2", "26373629_3", "23471469_3", "25475110_2", "28159511_2", "19850249_2", "28848879_2", "26378978_2", "26378978_3", "24918789_2", "26112656_3", "21933100_2", "25573406_2", "19688336_2", "30571562_3", "24120253_3", "30354781_2", "25670362_3", "23020650_2", "15998890_2", "26100349_2", "26321103_2", "22234149_2", "28842165_3", "28385353_2", "18539916_2", "28720132_2", "27215502_2", "28385353_3", "27609406_2", "25161043_2", "26059896_1", "26580237_2", "29777264_1", "27252787_2", "22084332_2", "28327140_2", "28904068_2", "27977934_2", "27612281_5", "28666775_2", "17765963_2", "19332467_2", "29782217_2", "15753114_2", "20685748_2", "9892586_3", "28910237_2", "27612281_6", "22369287_2", "28197834_2", "18223031_2", "18223031_3", "28666775_3", "23991658_2", "28386035_1", "26524706_2", "25795432_3", "26524706_3", "26681720_2", "30053967_2", "28278391_2", "22544891_2", "30415602_2", "21682834_2", "26358285_2", "19850248_2", "25758769_2", "25552421_2", "27484756_2", "19717844_2", "27576774_2", "26100349_3", "20582594_2", "27767328_3", "9892586_4", "25552421_3", "19966341_2", "24206457_2", "28905478_3", "28385353_5", "15451146_2", "28666993_2", "21332627_3", "21332627_2", "26620248_2", "27406394_2", "25352655_2", "28386990_1", "28386990_2", "28386990_3", "30218434_1", "28395936_2", "30566006_2", "30291013_2", "30354517_1", "30586723_2", "25045258_2", "19850248_3", "28263812_2", "30586723_3", "21428765_2", "19139391_2", "29664406_2", "29228101_2", "29148144_2", "28385353_6", "28359411_2", "26475142_2", "28948656_2", "21060071_2", "25490706_2", "28402745_2", "27842179_2", "27395349_3", "27354044_2", "26754626_3", "25189213_2", "22378566_2", "23909985_2", "23129601_2", "23963895_2", "29790415_2", "30547388_4", "27295427_2", "25189213_1", "29782217_3", "30139780_2", "27502307_2", "24247616_2", "29103664_2", "23992601_2", "21545942_2", "26121561_2", "29748996_1", "26059896_2", "23992601_3", "19097665_2", "24247616_3", "15758000_2", "24727254_3", "26271059_2", "25523533_2", "25736990_2", "29159457_2", "17980928_3", "25852208_2", "24076283_2", "27181606_2", "30474818_2", "27742728_2", "26027630_2", "28385353_7", "29766634_2", "28854085_2", "28844508_2", "19097665_3", "28035868_2", "28844508_3", "19443528_2", "27639753_3", "27977392_2", "26330422_2", "28905478_2", "9841303_2", "29790415_1", "29279300_2", "17560879_1", "30882239_2", "28720132_3", "23121439_2", "28391886_2", "28405473_2", "20200926_2", "22913893_2", "23040830_2", "29263150_3", "22177371_2", "27056586_2", "30547388_2", "27977392_3", "20953684_2", "30547388_3", "15924587_2", "27639753_2", "15781429_2", "16709304_2", "25271206_2", "21780946_2", "27684308_2", "16537662_2", "15337732_2", "18498915_2", "18498915_3", "21815708_2", "28972004_1", "20937671_2", "27046159_2", "20136164_2", "18835953_2", "19423108_2", "30175930_2", "18326958_2", "16709304_3", "20136164_1", "29713156_2", "16709304_4", "19104004_3", "18199798_2", "18615004_2", "21428766_2", "27616196_3", "28972004_2", "18094675_2", "20136164_3", "25031188_2", "23121439_3", "26059896_3", "26059896_4", "18172039_2", "18094675_3", "18657652_2", "28972004_3", "27616196_5", "18375982_2", "23733198_2", "18172039_3", "23110471_1", "17022864_3", "23110471_3", "24966672_2", "23714653_2", "20678674_2", "20469975_2", "30336824_2", "30336824_3", "26066644_1", "15381674_2", "28877027_2", "17011942_2", "19751115_2", "21815708_1", "20136164_4", "20357382_3", "18836213_2", "30415628_1", "28416587_2"];
            allLabelled = allLabelled.map(function (d) {
              return d + ".html";
            });
            selected_group_docs = [];

            if (fgroup == "all" || fgroup.indexOf("all") > -1) {
              selected_group_docs = ordered_Splits.flat();
            } else {
              for (i in fgroup) {
                group_index = parseInt(fgroup[i]) - 1;
                selected_group_docs = (0, _toConsumableArray2.default)(selected_group_docs).concat((0, _toConsumableArray2.default)(ordered_Splits[group_index]));
              }
            }

            selected_label_docs = [];

            if (flgroup == "all" || flgroup.indexOf("all") > -1) {
              selected_label_docs = ordered_docs_to_label.flat();
            } else {
              for (i in flgroup) {
                label_index = parseInt(flgroup[i]) - 1;
                selected_label_docs = (0, _toConsumableArray2.default)(selected_label_docs).concat((0, _toConsumableArray2.default)(ordered_docs_to_label[label_index]));
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

              fs.readdir(tables_folder, function (err, items) {
                var label_filters = flgroup;
                var unannotated = ordered_Splits;

                if (selected_group_docs.length > 0) {
                  DOCS = selected_group_docs;
                }

                if (selected_label_docs.length > 0) {
                  DOCS = selected_label_docs;
                }

                if (DOCS.length < 1) {
                  items = items.reduce(function (acc, filename) {
                    var doc_path = path.join(tables_folder, filename);

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
                    page: b[2] // debugger

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
                  } // console.log("YAY")


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
            _context3.next = 30;
            return results;

          case 30:
            return _context3.abrupt("return", _context3.sent);

          case 31:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function prepareAvailableDocuments(_x6, _x7, _x8, _x9, _x10) {
    return _ref3.apply(this, arguments);
  };
}();

module.exports = {
  readyTableData: readyTableData,
  prepareAvailableDocuments: prepareAvailableDocuments
};