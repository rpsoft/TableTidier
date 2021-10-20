"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var cheerio = require('cheerio');

var axios = require('axios');

var fs = require('fs');

var clone = require('just-clone');

var _require = require('process'),
    mainModule = _require.mainModule;

function getFileResults(_x, _x2) {
  return _getFileResults.apply(this, arguments);
} // async function main () {
//     const annotation = {"annotations":
//         [
//             {"location":"Row","content":{"arms":true,"measures":true},"qualifiers":{},"number":"2","subAnnotation":false},
//             {"location":"Row","content":{"measures":true,"p-interaction":true},"qualifiers":{},"number":"3","subAnnotation":false},
//             {"location":"Row","content":{"arms":true,"measures":true},"qualifiers":{},"number":"17","subAnnotation":false},
//             {"location":"Row","content":{"measures":true,"p-interaction":true},"qualifiers":{},"number":"18","subAnnotation":false},
//             {"location":"Col","content":{"characteristic_name":true, "characteristic_level":true },"qualifiers":{},"number":"1","subAnnotation":false},
//             {"location":"Col","content":{"measures":true, "p-interaction":true },"qualifiers":{"empty_row_with_p_value":true},"number":"2","subAnnotation":false},
//             {"location":"Col","content":{"characteristic_name":true, "characteristic_level":true },"qualifiers":{"bold":true},"number":"2","subAnnotation":false},
//             {"location":"Col","content":{"characteristic_level":true},"qualifiers":{},"number":"2","subAnnotation":true}
//         ]}
//     var results = await getFileResults(annotation, "exampleTable.html")
//     debugger
// }


function _getFileResults() {
  _getFileResults = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(annotation, filePath) {
    var tableData, $, maxColumn, maxRows, matrix, c, space, count, currentSpace, r, format, headerRows, headerCols, existingHeadersCount, existingHeaders, colHeadersBuffer, colPositions, dataResults;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (!(annotation == null)) {
              _context.next = 2;
              break;
            }

            return _context.abrupt("return", []);

          case 2:
            annotation.annotations.map(function (ann, a) {
              ann.pos = a;
            });
            tableData = new Promise(function (resolve, reject) {
              fs.readFile(filePath, "utf8", function (err, data) {
                if (err) {
                  reject(err);
                }

                resolve(data);
              });
            });
            _context.t0 = cheerio;
            _context.next = 7;
            return tableData;

          case 7:
            _context.t1 = _context.sent;
            $ = _context.t0.load.call(_context.t0, _context.t1);
            maxColumn = $("tr").toArray().reduce(function (acc, item, i) {
              return $(item).children().length > acc ? $(item).children().length : acc;
            }, 0);
            maxRows = $("tr").toArray().length;
            matrix = Array.from({
              length: maxRows
            }, function (e) {
              return Array(maxColumn).fill({
                colcontent: {},
                rowcontent: {},
                text: new String("")
              });
            });
            matrix = clone(matrix); // debugger

            $("tr").toArray().map(function (row, r) {
              var coffset = 0;
              $(row).children().toArray().map(function (col, c) {
                var _$$attr, _$$attr$toLowerCase, _$$attr2, _$$attr2$toLowerCase, _$$attr3, _$$attr3$toLowerCase;

                c = c + coffset;
                var emptyOffset = 0;

                while (matrix[r][c].text.trim().length > 0) {
                  emptyOffset = emptyOffset + 1;
                  c = c + 1;

                  if (c >= maxColumn) {
                    return;
                  }
                } //<em>


                var format = [];

                if ($(col).find("[class*=indent]").length > 0 || ((_$$attr = $(col).attr("class")) === null || _$$attr === void 0 ? void 0 : (_$$attr$toLowerCase = _$$attr.toLowerCase()) === null || _$$attr$toLowerCase === void 0 ? void 0 : _$$attr$toLowerCase.indexOf("indent")) > -1) {
                  format.push("indented");
                } // debugger


                if ($(col).find("[style*=bold]").length > 0 || ((_$$attr2 = $(col).attr("class")) === null || _$$attr2 === void 0 ? void 0 : (_$$attr2$toLowerCase = _$$attr2.toLowerCase()) === null || _$$attr2$toLowerCase === void 0 ? void 0 : _$$attr2$toLowerCase.indexOf("bold")) > -1) {
                  format.push("bold");
                }

                if ($(col).find("[style*=italic]").length > 0 || ((_$$attr3 = $(col).attr("class")) === null || _$$attr3 === void 0 ? void 0 : (_$$attr3$toLowerCase = _$$attr3.toLowerCase()) === null || _$$attr3$toLowerCase === void 0 ? void 0 : _$$attr3$toLowerCase.indexOf("italic")) > -1 || $(col).html().replaceAll(" ", "").indexOf("<em>") > -1) {
                  format.push("italic");
                }

                matrix[r][c] = _objectSpread(_objectSpread({}, matrix[r][c]), {}, {
                  text: $(col).text().replaceAll(/  |\t|\r\n|\n|\r/gm, "").trim(),
                  format: format
                });
                var colspan = $(col).attr("colspan") - 1;

                if (colspan > 0) {
                  for (var cspan = 1; cspan <= colspan; cspan++) {
                    matrix[r][c + cspan] = matrix[r][c];
                  }

                  coffset = coffset + colspan;
                }

                var rowspan = $(col).attr("rowspan") - 1;

                if (rowspan > 0) {
                  for (var rspan = 1; rspan <= rowspan; rspan++) {
                    if (r + rspan < matrix.length) {
                      matrix[r + rspan][c] = matrix[r][c];
                    }
                  }
                }
              }); // Out of the columns what's the max column number containing a header?

              var maxColHeader = Math.max.apply(Math, (0, _toConsumableArray2["default"])(annotation.annotations.filter(function (el) {
                return el.location == "Col";
              }).map(function (el) {
                return parseInt(el.number) - 1;
              }))); // here we check if the content is exactly the same across row cells. Since we spread the out in the previous steps, if an empty row, all cells should be the same.

              var isEmptyRow = matrix[r].slice(maxColHeader + 1).map(function (c) {
                return c.text;
              }).join("").length < 1; // Find the index position of the first and last non empty cells.

              var firstAndLast = matrix[r].map(function (col) {
                return col.text;
              }).reduce(function (acc, col, i, mat) {
                if (i + 1 < mat.length && col.length > 0 && mat[i + 1].length < 1 && acc.first < 0) {
                  acc.first = i;
                }

                if (i > 0 && col.length > 0 && mat[i - 1].length < 1) {
                  acc.last = i;
                }

                return acc;
              }, {
                first: -1,
                last: -1
              });
              var isEmptyRowWithPValue = firstAndLast.first > -1 && firstAndLast.last > -1 && firstAndLast.last - firstAndLast.first > 1;
              matrix[r].map(function (col, c) {
                var format = matrix[r][c].format ? (0, _toConsumableArray2["default"])(matrix[r][c].format) : [];

                if (isEmptyRow) {
                  format.push("empty_row");
                }

                if (isEmptyRowWithPValue) {
                  format.push("empty_row_with_p_value");
                }

                matrix[r][c] = _objectSpread(_objectSpread({}, matrix[r][c]), {}, {
                  format: format
                });
              });
            }); //normalise trailing spaces to facilitate indent detection

            _context.t2 = _regenerator["default"].keys((0, _toConsumableArray2["default"])(new Array(maxColumn).keys()));

          case 15:
            if ((_context.t3 = _context.t2()).done) {
              _context.next = 32;
              break;
            }

            c = _context.t3.value;
            space = null;
            count = 0;
            _context.t4 = _regenerator["default"].keys((0, _toConsumableArray2["default"])(new Array(maxRows).keys()));

          case 20:
            if ((_context.t5 = _context.t4()).done) {
              _context.next = 28;
              break;
            }

            r = _context.t5.value;

            if (!(matrix[r][c].text.trim().length < 1)) {
              _context.next = 24;
              break;
            }

            return _context.abrupt("continue", 20);

          case 24:
            currentSpace = matrix[r][c].text.match(/(^\s*)/g) && matrix[r][c].text.match(/(^\s*)/g)[0];

            if (space == null || space.length > currentSpace.length) {
              space = currentSpace;
            }

            _context.next = 20;
            break;

          case 28:
            for (r in (0, _toConsumableArray2["default"])(new Array(maxRows).keys())) {
              currentSpace = matrix[r][c].text.match(/(^\s*)/g) && matrix[r][c].text.match(/(^\s*)/g)[0];

              if (space == currentSpace || matrix[r][c].length == undefined) {
                count++;
              }
            }

            if (count == maxRows) {
              for (r in (0, _toConsumableArray2["default"])(new Array(maxRows).keys())) {
                if (matrix[r][c].text.trim().length < 1) {
                  // clean up empty cells from any spaces.
                  matrix[r][c].text = matrix[r][c].text.trim();
                }

                matrix[r][c].text = matrix[r][c].text.replace(space, "");
                currentSpace = matrix[r][c].text.match(/(^\s*)/g) && matrix[r][c].text.match(/(^\s*)/g)[0];

                if (currentSpace.length > 0) {
                  format = matrix[r][c].format;
                  format.push("indented");
                  matrix[r][c] = _objectSpread(_objectSpread({}, matrix[r][c]), {}, {
                    format: format
                  });
                }
              }
            }

            _context.next = 15;
            break;

          case 32:
            headerRows = [];
            headerCols = [];
            existingHeadersCount = {};
            existingHeaders = {};
            annotation.annotations.map(function (el) {
              var key = Object.keys(el.content).sort().reverse().join(";");
              existingHeadersCount[key] = existingHeadersCount[key] ? existingHeadersCount[key] + 1 : 1;
              el.annotationKey = key + "@" + existingHeadersCount[key];
              existingHeaders[key + "@" + existingHeadersCount[key]] = "";
            }); // here we order the annotations from more complex to simpler. This allows simpler computations later on.

            annotation.annotations = annotation.annotations.sort(function (A, B) {
              return A.number - B.number == 0 ? Object.keys(B.qualifiers).length - Object.keys(A.qualifiers).length : A.number - B.number;
            }); // debugger
            // Spread row header values

            annotation.annotations.filter(function (el) {
              return el.location == "Row";
            }).map(function (el) {
              matrix[el.number - 1].map(function (mc, c) {
                if (c > 0 && mc.text.trim().length < 1) {
                  matrix[el.number - 1][c].text = matrix[el.number - 1][c - 1].text; //clone(matrix[el.number-1][c-1])
                }

                var rowcontent = _objectSpread({}, matrix[el.number - 1][c].rowcontent);

                rowcontent[el.annotationKey] = matrix[el.number - 1][c].text.replace(/\s+/g, ' ').trim();
                matrix[el.number - 1][c].rowcontent = rowcontent;
                headerRows = Array.from(new Set([].concat((0, _toConsumableArray2["default"])(headerRows), [el.number - 1])));
              });
            }); // Spread col header values??? Need to revise what this does.

            annotation.annotations.filter(function (el) {
              return el.location == "Col";
            }).map(function (el) {
              matrix.map(function (row, r) {
                if (headerRows.indexOf(r) < 0 && r > Math.min.apply(Math, (0, _toConsumableArray2["default"])(headerRows))) {
                  if (r > 0 && matrix[r][el.number - 1].text.trim().length == 0) {
                    // Fill space in column with previous row element. Spreading headings over the columns
                    matrix[r][el.number - 1] = clone(matrix[r - 1][el.number - 1]);
                    matrix[r][el.number - 1].rowcontent = {};
                  }

                  if (Object.keys(el.qualifiers).length > 0) {
                    if (Object.keys(el.qualifiers).reduce(function (acc, ele) {
                      return acc && matrix[r][el.number - 1].format.indexOf(ele) > -1;
                    }, true)) {
                      if (Object.keys(matrix[r][el.number - 1].colcontent).length == 0) matrix[r][el.number - 1].colcontent[el.annotationKey] = matrix[r][el.number - 1].text.replace(/\s+/g, ' ').trim();
                    }
                  } else {
                    if (Object.keys(matrix[r][el.number - 1].colcontent).length == 0) matrix[r][el.number - 1].colcontent[el.annotationKey] = matrix[r][el.number - 1].text.replace(/\s+/g, ' ').trim();
                  }

                  headerCols = Array.from(new Set([].concat((0, _toConsumableArray2["default"])(headerCols), [el.number - 1])));
                }
              });
            });
            colHeadersBuffer = annotation.annotations.filter(function (el) {
              return el.location == "Col";
            }).reduce(function (acc, el) {
              acc[el.annotationKey] = "";
              return acc;
            }, {});
            colPositions = annotation.annotations.filter(function (el) {
              return el.location == "Col";
            }).reduce(function (acc, ann, a) {
              acc[ann.annotationKey] = {
                pos: ann.pos,
                subAnnotation: ann.subAnnotation
              };
              return acc;
            }, {});
            dataResults = matrix.reduce(function (acc, row, r) {
              var cpos = colPositions;

              if (headerRows.indexOf(r) < 0) {
                for (var h in headerCols) {
                  var hcol = headerCols[h];
                  Object.keys(matrix[r][hcol].colcontent).map(function (chead) {
                    var pos = colPositions[chead].pos;
                    var colHeadersToEmpty = Object.keys(colPositions).filter(function (chead) {
                      return colPositions[chead].subAnnotation && colPositions[chead].pos > pos;
                    });
                    colHeadersToEmpty.map(function (chead) {
                      colHeadersBuffer[chead] = "";
                    });
                  });
                  colHeadersBuffer = _objectSpread(_objectSpread({}, colHeadersBuffer), matrix[r][hcol].colcontent); // console.log(colHeadersBuffer)
                }
              }

              row.map(function (currentCell, c) {
                if (r >= Math.min.apply(Math, (0, _toConsumableArray2["default"])(headerRows)) && c > Math.max.apply(Math, (0, _toConsumableArray2["default"])(headerCols))) {
                  var newHeaders = _objectSpread(_objectSpread({}, newHeaders), colHeadersBuffer);

                  var headerGroups = headerRows.filter(function (hr) {
                    return hr < r;
                  }).reduce(function (acc, hrow) {
                    if (acc.buffer.length == 0) {
                      acc.buffer.push(hrow);
                    } else {
                      if (hrow - acc.buffer[acc.buffer.length - 1] == 1) {
                        acc.buffer.push(hrow);
                      } else {
                        acc.groups.push(clone(acc.buffer));
                        acc.buffer = [hrow];
                      }
                    }

                    return acc;
                  }, {
                    groups: [],
                    buffer: []
                  });
                  headerGroups = [].concat((0, _toConsumableArray2["default"])(headerGroups.groups), [headerGroups.buffer]);

                  for (var h in headerGroups[headerGroups.length - 1]) {
                    var hrow = headerGroups[headerGroups.length - 1][h];
                    newHeaders = _objectSpread(_objectSpread({}, newHeaders), matrix[hrow][c].rowcontent);
                  }

                  acc.push(_objectSpread(_objectSpread(_objectSpread({}, existingHeaders), newHeaders), {}, {
                    col: c,
                    row: r,
                    value: currentCell.text.replace(/\s+/g, ' ').trim()
                  }));
                }
              });
              return acc;
            }, []);
            dataResults = dataResults.filter(function (res) {
              var anyPresent = Object.keys(colHeadersBuffer).reduce(function (acc, hcol) {
                return acc || res[hcol] == res.value;
              }, false);
              return res.value.length > 0 && !anyPresent && headerRows.indexOf(res.row) < 0;
            });
            return _context.abrupt("return", dataResults);

          case 45:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _getFileResults.apply(this, arguments);
}

module.exports = {
  getFileResults: getFileResults
};