"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _files = require("./files.js");

var _security = _interopRequireWildcard(require("./security.js"));

var _table = require("./table.js");

var _metamap = require("./metamap.js");

var _tabuliser = require("./tabuliser.js");

var _extra_functions = _interopRequireDefault(require("./extra_functions.js"));

var _network_functions = require("./network_functions.js");

var express = require('express');

var bodyParser = require('body-parser');

var html = require("html");

var request = require("request");

var multer = require('multer');

var fs = require('fs');

var path = require('path');

var _require = require('pg'),
    Pool = _require.Pool,
    Client = _require.Client,
    Query = _require.Query;

var csv = require('csv-parser');

var CsvReadableStream = require('csv-reader'); //NODE R CONFIGURATION.


var R = require("r-script");

var cors = require('cors'); // I want to access cheerio from everywhere.


global.cheerio = require('cheerio');
global.CONFIG = require('./config.json');
global.available_documents = {};
global.abs_index = [];
global.tables_folder = "HTML_TABLES";
global.tables_folder_override = "HTML_TABLES_OVERRIDE";
global.tables_folder_deleted = "HTML_TABLES_DELETED";
global.cssFolder = "HTML_STYLES";
global.DOCS = [];
global.msh_categories = {
  catIndex: {},
  allcats: [],
  pmids_w_cat: []
};
global.PRED_METHOD = "grouped_predictor";
global.umls_data_buffer = {}; // TTidier subsystems load.

console.log("Loading Files Management");
console.log("Loading Security");
console.log("Loading Table Libs");
console.log("Loading MetaMap Docker Comms Module");
console.log("Loading Tabuliser Module");
console.log("Loading Extra Functions");
console.log("Loading Search Module");

var easysearch = require('@sephir/easy-search');

console.log("Configuring DB client: Postgres"); // Postgres configuration.

global.pool = new Pool({
  user: CONFIG.db.user,
  host: CONFIG.db.createUserhost,
  database: CONFIG.db.database,
  password: CONFIG.db.password,
  port: CONFIG.db.port
}); //Network functions

console.log("Configuring Server");
var app = express();
app.use(cors("*"));
app.options('*', cors());
app.use(bodyParser.json({
  limit: '50mb'
}));
app.use(bodyParser.urlencoded({
  limit: '50mb',
  parameterLimit: 100000,
  extended: true
}));
app.use(_security["default"].initialize());
app.post(CONFIG.api_base_url + '/login', function (req, res, next) {
  _security["default"].authenticate('custom', function (err, user, info) {
    // console.log("login_req",JSON.stringify(req))
    if (err) {
      res.json({
        status: "failed",
        payload: null
      });
    } else if (!user) {
      res.json({
        status: "unauthorised",
        payload: null
      });
    } else {
      res.json({
        status: "success",
        payload: user
      });
    }
  })(req, res, next);
});
app.post(CONFIG.api_base_url + '/createUser', /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(req, res) {
    var result;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return (0, _security.createUser)(req.body);

          case 3:
            result = _context.sent;
            res.json({
              status: "success",
              payload: result
            });
            _context.next = 10;
            break;

          case 7:
            _context.prev = 7;
            _context.t0 = _context["catch"](0);
            res.json({
              status: "failed",
              payload: ""
            });

          case 10:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[0, 7]]);
  }));

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
}()); // const storage = multer.memoryStorage();

var storage = multer.diskStorage({
  destination: function destination(req, file, cb) {
    cb(null, 'uploads');
  },
  filename: function filename(req, file, cb) {
    cb(null, file.originalname);
  }
});

var moveFileToCollection = function moveFileToCollection(filedata, coll) {
  var tables_folder_target = coll.indexOf("delete") > -1 ? global.tables_folder_deleted : global.tables_folder;
  fs.mkdirSync(path.join(tables_folder_target, coll), {
    recursive: true
  });
  fs.renameSync(filedata.path, path.join(tables_folder_target, coll, filedata.originalname));
};

app.get("/api/test", function (req, res) {
  res.send("here we are");
});

var tableSplitter = /*#__PURE__*/function () {
  var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(tablePath) {
    var tablesHTML;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            tablesHTML = new Promise(function (accept, reject) {
              fs.readFile(tablePath, "utf8", function (err, data) {
                var tablePage = cheerio.load(data);
                var tables = tablePage("table");
                var tablesHTML = []; // If only one table in the file, just return the whole file. Let the user clean up

                if (tables.length <= 1) {
                  tablesHTML.push(data);
                } else {
                  // we attempt automatic splitting here.
                  for (var t = 0; t < tables.length; t++) {
                    tablesHTML.push("<table>" + tablePage(tables[t]).html() + "</table>");
                  }
                }

                accept(tablesHTML);
              });
            });
            _context2.next = 3;
            return tablesHTML;

          case 3:
            tablesHTML = _context2.sent;
            return _context2.abrupt("return", tablesHTML);

          case 5:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));

  return function tableSplitter(_x3) {
    return _ref2.apply(this, arguments);
  };
}();

app.post(CONFIG.api_base_url + '/tableUploader', /*#__PURE__*/function () {
  var _ref3 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5(req, res) {
    var upload;
    return _regenerator["default"].wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            upload = multer({
              storage: storage
            }).array('fileNames');
            upload(req, res, /*#__PURE__*/function () {
              var _ref4 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(err) {
                var files, index, len, results, tables_html, cleanFilename, file_elements, extension, baseFilename;
                return _regenerator["default"].wrap(function _callee4$(_context4) {
                  while (1) {
                    switch (_context4.prev = _context4.next) {
                      case 0:
                        files = req.files;
                        results = []; // Loop through all the uploaded files and return names to frontend

                        index = 0, len = files.length;

                      case 3:
                        if (!(index < len)) {
                          _context4.next = 24;
                          break;
                        }

                        _context4.prev = 4;
                        _context4.next = 7;
                        return tableSplitter(files[index].path);

                      case 7:
                        tables_html = _context4.sent;
                        cleanFilename = files[index].originalname.replaceAll("_", "-");
                        file_elements = cleanFilename.split(".");
                        extension = file_elements.pop();
                        baseFilename = file_elements.join(".");
                        fs.mkdirSync(path.join(global.tables_folder, req.body.collection_id), {
                          recursive: true
                        });
                        tables_html.map( /*#__PURE__*/function () {
                          var _ref5 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(table, t) {
                            var page, docid, newTableFilename;
                            return _regenerator["default"].wrap(function _callee3$(_context3) {
                              while (1) {
                                switch (_context3.prev = _context3.next) {
                                  case 0:
                                    page = t + 1;
                                    docid = baseFilename;
                                    newTableFilename = docid + "_" + page + "." + extension;
                                    fs.writeFileSync(path.join(global.tables_folder, req.body.collection_id, newTableFilename), table);
                                    _context3.next = 6;
                                    return createTable(docid, page, req.body.username_uploader, req.body.collection_id, newTableFilename);

                                  case 6:
                                    results.push({
                                      filename: newTableFilename,
                                      status: "success"
                                    });

                                  case 7:
                                  case "end":
                                    return _context3.stop();
                                }
                              }
                            }, _callee3);
                          }));

                          return function (_x7, _x8) {
                            return _ref5.apply(this, arguments);
                          };
                        }());
                        _context4.next = 21;
                        break;

                      case 16:
                        _context4.prev = 16;
                        _context4.t0 = _context4["catch"](4);
                        console.log(_context4.t0);
                        console.log("file: " + files[index].originalname + " failed to process");
                        results.push({
                          filename: files[index].originalname,
                          status: "failed"
                        });

                      case 21:
                        ++index;
                        _context4.next = 3;
                        break;

                      case 24:
                        res.send(results);

                      case 25:
                      case "end":
                        return _context4.stop();
                    }
                  }
                }, _callee4, null, [[4, 16]]);
              }));

              return function (_x6) {
                return _ref4.apply(this, arguments);
              };
            }());

          case 2:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5);
  }));

  return function (_x4, _x5) {
    return _ref3.apply(this, arguments);
  };
}());

function UMLSData() {
  return _UMLSData.apply(this, arguments);
}

function _UMLSData() {
  _UMLSData = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee60() {
    var semtypes, cui_def, cui_concept;
    return _regenerator["default"].wrap(function _callee60$(_context60) {
      while (1) {
        switch (_context60.prev = _context60.next) {
          case 0:
            semtypes = new Promise(function (resolve, reject) {
              var inputStream = fs.createReadStream(CONFIG.system_path + "Tools/metamap_api/" + 'cui_def.csv', 'utf8');
              var result = {};
              inputStream.pipe(new CsvReadableStream({
                parseNumbers: true,
                parseBooleans: true,
                trim: true,
                skipHeader: true
              })).on('data', function (row) {
                //console.log('A row arrived: ', row);
                row[4].split(";").map(function (st) {
                  result[st] = result[st] ? result[st] + 1 : 1;
                });
              }).on('end', function (data) {
                resolve(result);
              });
            });
            _context60.next = 3;
            return semtypes;

          case 3:
            semtypes = _context60.sent;
            cui_def = new Promise(function (resolve, reject) {
              var inputStream = fs.createReadStream(CONFIG.system_path + "Tools/metamap_api/" + 'cui_def.csv', 'utf8');
              var result = {};
              inputStream.pipe(new CsvReadableStream({
                parseNumbers: true,
                parseBooleans: true,
                trim: true,
                skipHeader: true
              })).on('data', function (row) {
                //console.log('A row arrived: ', row);
                result[row[0]] = {
                  "matchedText": row[1],
                  "preferred": row[2],
                  "hasMSH": row[3],
                  "semTypes": row[4]
                };
              }).on('end', function (data) {
                resolve(result);
              });
            });
            _context60.next = 7;
            return cui_def;

          case 7:
            cui_def = _context60.sent;
            cui_concept = new Promise(function (resolve, reject) {
              var inputStream = fs.createReadStream(CONFIG.system_path + "Tools/metamap_api/" + 'cui_concept.csv', 'utf8');
              var result = {};
              inputStream.pipe(new CsvReadableStream({
                parseNumbers: true,
                parseBooleans: true,
                trim: true,
                skipHeader: true
              })).on('data', function (row) {
                //console.log('A row arrived: ', row);
                result[row[0]] = row[1];
              }).on('end', function (data) {
                resolve(result);
              });
            });
            _context60.next = 11;
            return cui_concept;

          case 11:
            cui_concept = _context60.sent;
            return _context60.abrupt("return", {
              semtypes: semtypes,
              cui_def: cui_def,
              cui_concept: cui_concept
            });

          case 13:
          case "end":
            return _context60.stop();
        }
      }
    }, _callee60);
  }));
  return _UMLSData.apply(this, arguments);
}

function CUIData() {
  return _CUIData.apply(this, arguments);
} // Gets the labellers associated w ith each document/table.


function _CUIData() {
  _CUIData = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee61() {
    var umlsData, results, rres;
    return _regenerator["default"].wrap(function _callee61$(_context61) {
      while (1) {
        switch (_context61.prev = _context61.next) {
          case 0:
            _context61.next = 2;
            return UMLSData();

          case 2:
            umlsData = _context61.sent;
            _context61.next = 5;
            return (0, _network_functions.getAnnotationResults)();

          case 5:
            results = _context61.sent;
            rres = results.rows.reduce(function (acc, ann, i) {
              var annots = ann.annotation.annotations;
              annots = annots.reduce(function (acc, ann) {
                var loc = ann.location;
                var n = ann.number;
                var descriptors = Object.keys(ann.content).join(";");
                var modifier = Object.keys(ann.qualifiers).join(";");
                acc[loc][n] = {
                  descriptors: descriptors,
                  modifier: modifier
                };
                return acc;
              }, {
                Col: {},
                Row: {}
              });
              acc[ann.docid + "_" + ann.page] = {
                user: ann.user,
                minPos: 1,
                Col: annots.Col,
                Row: annots.Row
              };
              return acc;
            }, {});
            return _context61.abrupt("return", {
              cui_def: umlsData.cui_def,
              cui_concept: umlsData.cui_concept,
              actual_results: rres,
              semtypes: umlsData.semtypes
            });

          case 8:
          case "end":
            return _context61.stop();
        }
      }
    }, _callee61);
  }));
  return _CUIData.apply(this, arguments);
}

function getMetadataLabellers() {
  return _getMetadataLabellers.apply(this, arguments);
} // Returns the annotation for a single document/table


function _getMetadataLabellers() {
  _getMetadataLabellers = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee62() {
    var client, result;
    return _regenerator["default"].wrap(function _callee62$(_context62) {
      while (1) {
        switch (_context62.prev = _context62.next) {
          case 0:
            _context62.next = 2;
            return pool.connect();

          case 2:
            client = _context62.sent;
            _context62.next = 5;
            return client.query("select distinct docid, page, labeller from metadata");

          case 5:
            result = _context62.sent;
            client.release();
            return _context62.abrupt("return", result);

          case 8:
          case "end":
            return _context62.stop();
        }
      }
    }, _callee62);
  }));
  return _getMetadataLabellers.apply(this, arguments);
}

function getAnnotationByID(_x9, _x10, _x11) {
  return _getAnnotationByID.apply(this, arguments);
}

function _getAnnotationByID() {
  _getAnnotationByID = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee63(docid, page, collId) {
    var client, result;
    return _regenerator["default"].wrap(function _callee63$(_context63) {
      while (1) {
        switch (_context63.prev = _context63.next) {
          case 0:
            if (!(docid == "undefined" || page == "undefined" || collId == "undefined")) {
              _context63.next = 2;
              break;
            }

            return _context63.abrupt("return", {
              rows: []
            });

          case 2:
            _context63.next = 4;
            return pool.connect();

          case 4:
            client = _context63.sent;
            _context63.next = 7;
            return client.query("\n    SELECT docid, page, \"user\", notes, collection_id, file_path, \"tableType\", \"table\".tid, completion, annotation\n    FROM \"table\"\n    LEFT JOIN annotations\n    ON  \"table\".tid = annotations.tid\n    WHERE docid=$1 AND page=$2 AND collection_id = $3 ", [docid, page, collId]);

          case 7:
            result = _context63.sent;
            client.release();
            return _context63.abrupt("return", result);

          case 10:
          case "end":
            return _context63.stop();
        }
      }
    }, _callee63);
  }));
  return _getAnnotationByID.apply(this, arguments);
}

var rebuildSearchIndex = /*#__PURE__*/function () {
  var _ref6 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6() {
    var tables, tables_folder_override;
    return _regenerator["default"].wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            tables = fs.readdirSync(path.join(global.tables_folder)).map(function (dir) {
              return path.join(global.tables_folder, dir);
            });
            tables_folder_override = fs.readdirSync(path.join(global.tables_folder_override)).map(function (dir) {
              return path.join(global.tables_folder_override, dir);
            });
            _context6.next = 4;
            return easysearch.indexFolder([].concat((0, _toConsumableArray2["default"])(tables), (0, _toConsumableArray2["default"])(tables_folder_override)));

          case 4:
            global.searchIndex = _context6.sent;

          case 5:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6);
  }));

  return function rebuildSearchIndex() {
    return _ref6.apply(this, arguments);
  };
}();

var tabularFromAnnotation = /*#__PURE__*/function () {
  var _ref7 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7(annotation) {
    var htmlFile, file_exists, htmlFolder;
    return _regenerator["default"].wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            if (!(annotation.rows.length < 1)) {
              _context7.next = 2;
              break;
            }

            return _context7.abrupt("return");

          case 2:
            annotation = annotation.rows[0];
            htmlFile = annotation.file_path; //If an override file exists then use it!. Overrides are those produced by the editor.

            _context7.next = 6;
            return fs.existsSync(path.join(global.tables_folder_override, annotation.collection_id, htmlFile));

          case 6:
            file_exists = _context7.sent;
            htmlFolder = path.join(global.tables_folder, annotation.collection_id);

            if (file_exists) {
              htmlFolder = path.join(global.tables_folder_override, annotation.collection_id); //"HTML_TABLES_OVERRIDE/"
            }

            try {
              fs.readFile(path.join(htmlFolder, htmlFile), "utf8", function (err, data) {
                var ann = annotation;
                var tablePage = cheerio.load(data);
                var tableData = tablePage("tr").get().map(function (row) {
                  var rowValues = cheerio(row).children().get().map(function (i, e) {
                    return {
                      text: cheerio(i).text(),
                      isIndent: cheerio(i).find('.indent1').length + cheerio(i).find('.indent2').length + cheerio(i).find('.indent3').length + cheerio(i).find('.indent').length > 0,
                      isBold: cheerio(i).find('.bold').length + cheerio(i).find('strong').length > 0,
                      isItalic: cheerio(i).find('em').length > 0
                    };
                  });
                  return rowValues;
                });
              });
            } catch (e) {
              console.log(e);
            }

          case 10:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7);
  }));

  return function tabularFromAnnotation(_x12) {
    return _ref7.apply(this, arguments);
  };
}(); // preinitialisation of components if needed.


function main() {
  return _main.apply(this, arguments);
} // app.get(CONFIG.api_base_url+'/deleteTable', async function(req,res){
//
//   if ( req.query && req.query.docid && req.query.page ){
//
//     var filename = req.query.docid+"_"+req.query.page+".html"
//
//     var delprom = new Promise(function(resolve, reject) {
//         fs.rename( tables_folder+'/'+ filename , tables_folder_deleted+'/'+ filename , (err) => {
//           if (err) { reject("failed")} ;
//           console.log('Move complete : '+filename);
//           resolve("done");
//         });
//     });
//
//     await delprom;
//     // await refreshDocuments();
//
//     res.send("table deleted")
//   } else {
//     res.send("table not deleted")
//   }
//
// });
//
// app.get(CONFIG.api_base_url+'/recoverTable', async function(req,res){
//     if ( req.query && req.query.docid && req.query.page ){
//
//       var filename = req.query.docid+"_"+req.query.page+".html"
//
//       fs.rename( tables_folder_deleted+'/'+ filename , tables_folder+'/'+ filename , (err) => {
//         if (err) throw err;
//           console.log('Move complete : '+filename);
//       });
//     }
//
//     res.send("table recovered")
// });


function _main() {
  _main = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee64() {
    return _regenerator["default"].wrap(function _callee64$(_context64) {
      while (1) {
        switch (_context64.prev = _context64.next) {
          case 0:
            _context64.next = 2;
            return rebuildSearchIndex();

          case 2:
            _context64.next = 4;
            return UMLSData();

          case 4:
            umls_data_buffer = _context64.sent;
            _context64.next = 7;
            return (0, _security.initialiseUsers)();

          case 7:
          case "end":
            return _context64.stop();
        }
      }
    }, _callee64);
  }));
  return _main.apply(this, arguments);
}

app.get(CONFIG.api_base_url + '/listDeletedTables', /*#__PURE__*/function () {
  var _ref8 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee8(req, res) {
    return _regenerator["default"].wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            fs.readdir(tables_folder_deleted, function (err, items) {
              if (err) {
                res.send("failed listing " + err);
              } else {
                res.send(items);
              }
            });

          case 1:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8);
  }));

  return function (_x13, _x14) {
    return _ref8.apply(this, arguments);
  };
}());
app.get(CONFIG.api_base_url + '/modifyCUIData', /*#__PURE__*/function () {
  var _ref9 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee10(req, res) {
    var modifyCUIData, result;
    return _regenerator["default"].wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            modifyCUIData = /*#__PURE__*/function () {
              var _ref10 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee9(cui, preferred, adminApproved, prevcui) {
                var client, result, q;
                return _regenerator["default"].wrap(function _callee9$(_context9) {
                  while (1) {
                    switch (_context9.prev = _context9.next) {
                      case 0:
                        _context9.next = 2;
                        return pool.connect();

                      case 2:
                        client = _context9.sent;
                        _context9.next = 5;
                        return client.query("UPDATE cuis_index SET cui=$1, preferred=$2, admin_approved=$3 WHERE cui = $4", [cui, preferred, adminApproved, prevcui]);

                      case 5:
                        result = _context9.sent;

                        if (!(result && result.rowCount)) {
                          _context9.next = 11;
                          break;
                        }

                        q = new Query("UPDATE metadata SET cuis = array_to_string(array_replace(regexp_split_to_array(cuis, ';'), $2, $1), ';'), cuis_selected = array_to_string(array_replace(regexp_split_to_array(cuis_selected, ';'), $2, $1), ';')", [cui, prevcui]);
                        _context9.next = 10;
                        return client.query(q);

                      case 10:
                        result = _context9.sent;

                      case 11:
                        client.release();
                        return _context9.abrupt("return", result);

                      case 13:
                      case "end":
                        return _context9.stop();
                    }
                  }
                }, _callee9);
              }));

              return function modifyCUIData(_x17, _x18, _x19, _x20) {
                return _ref10.apply(this, arguments);
              };
            }();

            if (!(req.query && req.query.cui && req.query.preferred && req.query.adminApproved && req.query.prevcui)) {
              _context10.next = 8;
              break;
            }

            _context10.next = 4;
            return modifyCUIData(req.query.cui, req.query.preferred, req.query.adminApproved, req.query.prevcui);

          case 4:
            result = _context10.sent;
            res.send(result);
            _context10.next = 9;
            break;

          case 8:
            res.send("UPDATE failed");

          case 9:
          case "end":
            return _context10.stop();
        }
      }
    }, _callee10);
  }));

  return function (_x15, _x16) {
    return _ref9.apply(this, arguments);
  };
}());
app.get(CONFIG.api_base_url + '/cuiDeleteIndex', /*#__PURE__*/function () {
  var _ref11 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee12(req, res) {
    var cuiDeleteIndex;
    return _regenerator["default"].wrap(function _callee12$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:
            cuiDeleteIndex = /*#__PURE__*/function () {
              var _ref12 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee11(cui) {
                var client, done;
                return _regenerator["default"].wrap(function _callee11$(_context11) {
                  while (1) {
                    switch (_context11.prev = _context11.next) {
                      case 0:
                        _context11.next = 2;
                        return pool.connect();

                      case 2:
                        client = _context11.sent;
                        _context11.next = 5;
                        return client.query('delete from cuis_index where cui = $1', [cui]).then(function (result) {
                          return console.log("deleted: " + new Date());
                        })["catch"](function (e) {
                          return console.error(e.stack);
                        }).then(function () {
                          return client.release();
                        });

                      case 5:
                        done = _context11.sent;

                      case 6:
                      case "end":
                        return _context11.stop();
                    }
                  }
                }, _callee11);
              }));

              return function cuiDeleteIndex(_x23) {
                return _ref12.apply(this, arguments);
              };
            }();

            if (!(req.query && req.query.cui)) {
              _context12.next = 7;
              break;
            }

            _context12.next = 4;
            return cuiDeleteIndex(req.query.cui);

          case 4:
            res.send("done");
            _context12.next = 8;
            break;

          case 7:
            res.send("clear failed");

          case 8:
          case "end":
            return _context12.stop();
        }
      }
    }, _callee12);
  }));

  return function (_x21, _x22) {
    return _ref11.apply(this, arguments);
  };
}());
app.get(CONFIG.api_base_url + '/getMetadataForCUI', /*#__PURE__*/function () {
  var _ref13 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee14(req, res) {
    var getCuiTables, meta;
    return _regenerator["default"].wrap(function _callee14$(_context14) {
      while (1) {
        switch (_context14.prev = _context14.next) {
          case 0:
            getCuiTables = /*#__PURE__*/function () {
              var _ref14 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee13(cui) {
                var client, result;
                return _regenerator["default"].wrap(function _callee13$(_context13) {
                  while (1) {
                    switch (_context13.prev = _context13.next) {
                      case 0:
                        _context13.next = 2;
                        return pool.connect();

                      case 2:
                        client = _context13.sent;
                        _context13.next = 5;
                        return client.query("select docid,page,\"user\" from metadata where cuis like $1 ", ["%" + cui + "%"]);

                      case 5:
                        result = _context13.sent;
                        client.release();
                        return _context13.abrupt("return", result);

                      case 8:
                      case "end":
                        return _context13.stop();
                    }
                  }
                }, _callee13);
              }));

              return function getCuiTables(_x26) {
                return _ref14.apply(this, arguments);
              };
            }();

            if (!(req.query && req.query.cui)) {
              _context14.next = 8;
              break;
            }

            _context14.next = 4;
            return getCuiTables(req.query.cui);

          case 4:
            meta = _context14.sent;
            res.send(meta);
            _context14.next = 9;
            break;

          case 8:
            res.send("clear failed");

          case 9:
          case "end":
            return _context14.stop();
        }
      }
    }, _callee14);
  }));

  return function (_x24, _x25) {
    return _ref13.apply(this, arguments);
  };
}());

var clearMetadata = /*#__PURE__*/function () {
  var _ref15 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee15(tid) {
    var client, done;
    return _regenerator["default"].wrap(function _callee15$(_context15) {
      while (1) {
        switch (_context15.prev = _context15.next) {
          case 0:
            _context15.next = 2;
            return pool.connect();

          case 2:
            client = _context15.sent;
            _context15.next = 5;
            return client.query('DELETE FROM metadata WHERE tid = $1', [tid]).then(function (result) {
              return console.log("deleted: " + new Date());
            })["catch"](function (e) {
              return console.error(e.stack);
            }).then(function () {
              return client.release();
            });

          case 5:
            done = _context15.sent;

          case 6:
          case "end":
            return _context15.stop();
        }
      }
    }, _callee15);
  }));

  return function clearMetadata(_x27) {
    return _ref15.apply(this, arguments);
  };
}();

var setMetadata = /*#__PURE__*/function () {
  var _ref16 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee16(metadata) {
    var tid, results, m, key, client, done;
    return _regenerator["default"].wrap(function _callee16$(_context16) {
      while (1) {
        switch (_context16.prev = _context16.next) {
          case 0:
            if (!(Object.keys(metadata).length > 0)) {
              _context16.next = 5;
              break;
            }

            tid = metadata[Object.keys(metadata)[0]].tid;
            console.log("HERE DELETE: " + tid);
            _context16.next = 5;
            return clearMetadata(tid);

          case 5:
            results = [];
            m = 0;

          case 7:
            if (!(m < Object.keys(metadata).length)) {
              _context16.next = 19;
              break;
            }

            key = Object.keys(metadata)[m];
            _context16.next = 11;
            return pool.connect();

          case 11:
            client = _context16.sent;
            _context16.next = 14;
            return client.query("\n        INSERT INTO metadata(concept_source, concept_root, concept, cuis, cuis_selected, qualifiers, qualifiers_selected, istitle, labeller, tid)\n        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)\n        ON CONFLICT (concept_source, concept_root, concept, tid)\n        DO UPDATE SET cuis = $4, cuis_selected = $5, qualifiers = $6, qualifiers_selected = $7, istitle = $8, labeller = $9", [metadata[key].concept_source, metadata[key].concept_root, metadata[key].concept, metadata[key].cuis.join(";"), metadata[key].cuis_selected.join(";"), metadata[key].qualifiers.join(";"), metadata[key].qualifiers_selected.join(";"), metadata[key].istitle, metadata[key].labeller, metadata[key].tid]).then(function (result) {
              return console.log("insert: " + key + " -- " + new Date());
            })["catch"](function (e) {
              console.error(metadata[key].concept + " -- " + "insert failed: " + key + " -- " + new Date());
            }).then(function () {
              return client.release();
            });

          case 14:
            done = _context16.sent;
            results.push(done);

          case 16:
            m++;
            _context16.next = 7;
            break;

          case 19:
            return _context16.abrupt("return", results);

          case 20:
          case "end":
            return _context16.stop();
        }
      }
    }, _callee16);
  }));

  return function setMetadata(_x28) {
    return _ref16.apply(this, arguments);
  };
}();

var getMetadata = /*#__PURE__*/function () {
  var _ref17 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee17(tids) {
    var client, result;
    return _regenerator["default"].wrap(function _callee17$(_context17) {
      while (1) {
        switch (_context17.prev = _context17.next) {
          case 0:
            _context17.next = 2;
            return pool.connect();

          case 2:
            client = _context17.sent;
            _context17.next = 5;
            return client.query("SELECT * FROM metadata WHERE tid = ANY ($1)", [tids]);

          case 5:
            result = _context17.sent;
            client.release();
            return _context17.abrupt("return", result);

          case 8:
          case "end":
            return _context17.stop();
        }
      }
    }, _callee17);
  }));

  return function getMetadata(_x29) {
    return _ref17.apply(this, arguments);
  };
}(); // important. Use this to recover the table id (tid). tid is used as primary key in many tables. uniquely identifying tables across sql tables.


var getTid = /*#__PURE__*/function () {
  var _ref18 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee18(docid, page, collId) {
    var client, result, tid;
    return _regenerator["default"].wrap(function _callee18$(_context18) {
      while (1) {
        switch (_context18.prev = _context18.next) {
          case 0:
            if (!(docid == "undefined" || page == "undefined" || collId == "undefined")) {
              _context18.next = 2;
              break;
            }

            return _context18.abrupt("return", -1);

          case 2:
            _context18.next = 4;
            return pool.connect();

          case 4:
            client = _context18.sent;
            _context18.next = 7;
            return client.query("SELECT tid FROM public.\"table\" WHERE docid = $1 AND page = $2 AND collection_id = $3", [docid, page, collId]);

          case 7:
            result = _context18.sent;
            client.release();

            if (result.rows && result.rows.length > 0) {
              tid = result.rows[0].tid;
            }

            return _context18.abrupt("return", tid);

          case 11:
          case "end":
            return _context18.stop();
        }
      }
    }, _callee18);
  }));

  return function getTid(_x30, _x31, _x32) {
    return _ref18.apply(this, arguments);
  };
}();

app.post(CONFIG.api_base_url + '/metadata', /*#__PURE__*/function () {
  var _ref19 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee19(req, res) {
    var validate_user, collectionPermissions, tid, result, metadata;
    return _regenerator["default"].wrap(function _callee19$(_context19) {
      while (1) {
        switch (_context19.prev = _context19.next) {
          case 0:
            if (!(req.body && !req.body.action)) {
              _context19.next = 3;
              break;
            }

            res.json({
              status: "undefined",
              received: req.body
            });
            return _context19.abrupt("return");

          case 3:
            validate_user = validateUser(req.body.username, req.body.hash);
            _context19.next = 6;
            return getResourcePermissions('collections', validate_user ? req.body.username : "");

          case 6:
            collectionPermissions = _context19.sent;

            if (!(collectionPermissions.read.indexOf(req.body.collId) > -1)) {
              _context19.next = 39;
              break;
            }

            tid = req.body.tid;

            if (!(tid == "undefined")) {
              _context19.next = 13;
              break;
            }

            _context19.next = 12;
            return getTid(req.body.docid, req.body.page, req.body.collId);

          case 12:
            tid = _context19.sent;

          case 13:
            result = {};
            _context19.t0 = req.body.action;
            _context19.next = _context19.t0 === "clear" ? 17 : _context19.t0 === "save" ? 22 : _context19.t0 === "get" ? 28 : _context19.t0 === "get_multiple" ? 32 : 36;
            break;

          case 17:
            if (!(collectionPermissions.write.indexOf(req.body.collId) > -1)) {
              _context19.next = 21;
              break;
            }

            _context19.next = 20;
            return clearMetadata(tid);

          case 20:
            result = _context19.sent;

          case 21:
            return _context19.abrupt("break", 36);

          case 22:
            if (!(collectionPermissions.write.indexOf(req.body.collId) > -1)) {
              _context19.next = 27;
              break;
            }

            metadata = JSON.parse(req.body.payload).metadata;
            _context19.next = 26;
            return setMetadata(metadata);

          case 26:
            result = _context19.sent;

          case 27:
            return _context19.abrupt("break", 36);

          case 28:
            _context19.next = 30;
            return getMetadata([tid]);

          case 30:
            result = _context19.sent.rows;
            return _context19.abrupt("break", 36);

          case 32:
            _context19.next = 34;
            return getMetadata(req.body.tids);

          case 34:
            result = _context19.sent.rows;
            return _context19.abrupt("break", 36);

          case 36:
            // Always return the updated collection details
            // result = await getCollection(req.body.collection_id);
            res.json({
              status: "success",
              data: result
            });
            _context19.next = 40;
            break;

          case 39:
            res.json({
              status: "unauthorised",
              payload: null
            });

          case 40:
          case "end":
            return _context19.stop();
        }
      }
    }, _callee19);
  }));

  return function (_x33, _x34) {
    return _ref19.apply(this, arguments);
  };
}());

var getCUISIndex = /*#__PURE__*/function () {
  var _ref20 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee20() {
    var cuis, client, result;
    return _regenerator["default"].wrap(function _callee20$(_context20) {
      while (1) {
        switch (_context20.prev = _context20.next) {
          case 0:
            cuis = {};
            _context20.next = 3;
            return pool.connect();

          case 3:
            client = _context20.sent;
            _context20.next = 6;
            return client.query("select * from cuis_index ORDER BY preferred ASC");

          case 6:
            result = _context20.sent;
            client.release();
            result.rows.map(function (row) {
              cuis[row.cui] = {
                preferred: row.preferred,
                hasMSH: row.hasMSH,
                userDefined: row.user_defined,
                adminApproved: row.admin_approved
              };
            });
            return _context20.abrupt("return", cuis);

          case 10:
          case "end":
            return _context20.stop();
        }
      }
    }, _callee20);
  }));

  return function getCUISIndex() {
    return _ref20.apply(this, arguments);
  };
}();

app.post(CONFIG.api_base_url + '/cuis', /*#__PURE__*/function () {
  var _ref21 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee21(req, res) {
    var validate_user, result;
    return _regenerator["default"].wrap(function _callee21$(_context21) {
      while (1) {
        switch (_context21.prev = _context21.next) {
          case 0:
            if (!(req.body && !req.body.action)) {
              _context21.next = 3;
              break;
            }

            res.json({
              status: "undefined",
              received: req.body
            });
            return _context21.abrupt("return");

          case 3:
            validate_user = true; //validateUser(req.body.username, req.body.hash);
            // var collectionPermissions = await getResourcePermissions('collections', req.body.username)

            if (!validate_user) {
              _context21.next = 15;
              break;
            }

            result = {};
            _context21.t0 = req.body.action;
            _context21.next = _context21.t0 === "get" ? 9 : 12;
            break;

          case 9:
            _context21.next = 11;
            return getCUISIndex();

          case 11:
            result = _context21.sent;

          case 12:
            res.json({
              status: "success",
              data: result
            });
            _context21.next = 16;
            break;

          case 15:
            res.json({
              status: "unauthorised",
              payload: null
            });

          case 16:
          case "end":
            return _context21.stop();
        }
      }
    }, _callee21);
  }));

  return function (_x35, _x36) {
    return _ref21.apply(this, arguments);
  };
}());
app.get(CONFIG.api_base_url + '/', function (req, res) {
  res.send("TTidier Server running.");
}); // Simple validation

function validateUser(username, hash) {
  var validate_user;

  for (var u in global.records) {
    if (global.records[u].username == username) {
      var user = global.records[u];
      var db_hash = (0, _security.getUserHash)(user);
      validate_user = hash == db_hash.hash ? user : false;
    }
  }

  return validate_user;
} // resource = {type: [collection or table], id: [collection or table id]}


var getResourcePermissions = /*#__PURE__*/function () {
  var _ref22 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee22(resource, user) {
    var _permissions;

    var client, permissions;
    return _regenerator["default"].wrap(function _callee22$(_context22) {
      while (1) {
        switch (_context22.prev = _context22.next) {
          case 0:
            _context22.next = 2;
            return pool.connect();

          case 2:
            client = _context22.sent;
            _context22.t0 = resource;
            _context22.next = _context22.t0 === "collections" ? 6 : _context22.t0 === "table" ? 10 : 11;
            break;

          case 6:
            _context22.next = 8;
            return client.query("select *,\n                                      (owner_username = $1) as write,\n                                      (visibility = 'public' OR owner_username = $1) as read\n                                      from collection", [user]);

          case 8:
            permissions = _context22.sent;
            return _context22.abrupt("break", 11);

          case 10:
            return _context22.abrupt("break", 11);

          case 11:
            client.release();
            return _context22.abrupt("return", (_permissions = permissions) === null || _permissions === void 0 ? void 0 : _permissions.rows.reduce(function (acc, row) {
              var currentRead = acc.read;
              var currentWrite = acc.write;

              if (row.read) {
                currentRead.push(row.collection_id);
              }

              if (row.write) {
                currentWrite.push(row.collection_id);
              }

              acc.read = currentRead;
              acc.write = currentWrite;
              return acc;
            }, {
              read: [],
              write: []
            }));

          case 13:
          case "end":
            return _context22.stop();
        }
      }
    }, _callee22);
  }));

  return function getResourcePermissions(_x37, _x38) {
    return _ref22.apply(this, arguments);
  };
}(); // Collections


var listCollections = /*#__PURE__*/function () {
  var _ref23 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee23() {
    var client, result;
    return _regenerator["default"].wrap(function _callee23$(_context23) {
      while (1) {
        switch (_context23.prev = _context23.next) {
          case 0:
            _context23.next = 2;
            return pool.connect();

          case 2:
            client = _context23.sent;
            _context23.next = 5;
            return client.query("SELECT collection.collection_id, title, description, owner_username, table_n\n       FROM public.collection\n       LEFT JOIN\n       ( SELECT collection_id, count(docid) as table_n FROM\n       ( select distinct docid, page, collection_id from public.table ) as interm\n       group by collection_id ) as coll_counts\n       ON collection.collection_id = coll_counts.collection_id ORDER BY collection_id");

          case 5:
            result = _context23.sent;
            client.release();
            return _context23.abrupt("return", result.rows);

          case 8:
          case "end":
            return _context23.stop();
        }
      }
    }, _callee23);
  }));

  return function listCollections() {
    return _ref23.apply(this, arguments);
  };
}();

var getCollection = /*#__PURE__*/function () {
  var _ref24 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee24(collection_id) {
    var client, result, tables, collectionsList;
    return _regenerator["default"].wrap(function _callee24$(_context24) {
      while (1) {
        switch (_context24.prev = _context24.next) {
          case 0:
            _context24.next = 2;
            return pool.connect();

          case 2:
            client = _context24.sent;
            _context24.next = 5;
            return client.query("SELECT *\n      FROM public.collection WHERE collection_id = $1", [collection_id]);

          case 5:
            result = _context24.sent;
            _context24.next = 8;
            return client.query("SELECT docid, page, \"user\", notes, tid, collection_id, file_path, \"tableType\"\n      FROM public.\"table\" WHERE collection_id = $1 ORDER BY docid,page", [collection_id]);

          case 8:
            tables = _context24.sent;
            _context24.next = 11;
            return client.query("SELECT * FROM public.collection ORDER BY collection_id");

          case 11:
            collectionsList = _context24.sent;
            client.release();

            if (!(result.rows.length == 1)) {
              _context24.next = 18;
              break;
            }

            result = result.rows[0];
            result.tables = tables.rows;
            result.collectionsList = collectionsList.rows;
            return _context24.abrupt("return", result);

          case 18:
            return _context24.abrupt("return", {});

          case 19:
          case "end":
            return _context24.stop();
        }
      }
    }, _callee24);
  }));

  return function getCollection(_x39) {
    return _ref24.apply(this, arguments);
  };
}();

var createCollection = /*#__PURE__*/function () {
  var _ref25 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee25(title, description, owner) {
    var client, result;
    return _regenerator["default"].wrap(function _callee25$(_context25) {
      while (1) {
        switch (_context25.prev = _context25.next) {
          case 0:
            _context25.next = 2;
            return pool.connect();

          case 2:
            client = _context25.sent;
            _context25.next = 5;
            return client.query("INSERT INTO public.collection(\n                                      title, description, owner_username, visibility, completion)\n                                      VALUES ($1, $2, $3, $4, $5);", [title, description, owner, "public", "in progress"]);

          case 5:
            result = _context25.sent;
            _context25.next = 8;
            return client.query("Select * from collection\n                                     ORDER BY collection_id DESC LIMIT 1;");

          case 8:
            result = _context25.sent;
            client.release();
            return _context25.abrupt("return", result);

          case 11:
          case "end":
            return _context25.stop();
        }
      }
    }, _callee25);
  }));

  return function createCollection(_x40, _x41, _x42) {
    return _ref25.apply(this, arguments);
  };
}();

var editCollection = /*#__PURE__*/function () {
  var _ref26 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee26(collData) {
    var client, result;
    return _regenerator["default"].wrap(function _callee26$(_context26) {
      while (1) {
        switch (_context26.prev = _context26.next) {
          case 0:
            _context26.next = 2;
            return pool.connect();

          case 2:
            client = _context26.sent;
            _context26.next = 5;
            return client.query("UPDATE public.collection\n      SET title=$2, description=$3, owner_username=$4, completion=$5, visibility=$6\n      WHERE collection_id=$1", [collData.collection_id, collData.title, collData.description, collData.owner_username, collData.completion, collData.visibility]);

          case 5:
            result = _context26.sent;
            client.release();
            return _context26.abrupt("return", result);

          case 8:
          case "end":
            return _context26.stop();
        }
      }
    }, _callee26);
  }));

  return function editCollection(_x43) {
    return _ref26.apply(this, arguments);
  };
}();

var deleteCollection = /*#__PURE__*/function () {
  var _ref27 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee27(collection_id) {
    var client, tables, result, results;
    return _regenerator["default"].wrap(function _callee27$(_context27) {
      while (1) {
        switch (_context27.prev = _context27.next) {
          case 0:
            _context27.next = 2;
            return pool.connect();

          case 2:
            client = _context27.sent;
            _context27.next = 5;
            return client.query("SELECT docid, page FROM public.\"table\" WHERE collection_id = $1", [collection_id]);

          case 5:
            tables = _context27.sent;
            tables = tables.rows;
            _context27.next = 9;
            return removeTables(tables, collection_id, true);

          case 9:
            result = _context27.sent;
            _context27.next = 12;
            return client.query("DELETE FROM collection WHERE collection_id = $1", [collection_id]);

          case 12:
            results = _context27.sent;
            client.release();

          case 14:
          case "end":
            return _context27.stop();
        }
      }
    }, _callee27);
  }));

  return function deleteCollection(_x44) {
    return _ref27.apply(this, arguments);
  };
}();

var getResults = /*#__PURE__*/function () {
  var _ref28 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee28(tids) {
    var client, result;
    return _regenerator["default"].wrap(function _callee28$(_context28) {
      while (1) {
        switch (_context28.prev = _context28.next) {
          case 0:
            _context28.next = 2;
            return pool.connect();

          case 2:
            client = _context28.sent;
            _context28.next = 5;
            return client.query("SELECT * FROM \"result\" WHERE tid = ANY ($1)", [tids]);

          case 5:
            result = _context28.sent;
            client.release();
            return _context28.abrupt("return", result);

          case 8:
          case "end":
            return _context28.stop();
        }
      }
    }, _callee28);
  }));

  return function getResults(_x45) {
    return _ref28.apply(this, arguments);
  };
}();

app.post(CONFIG.api_base_url + '/collections', /*#__PURE__*/function () {
  var _ref29 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee29(req, res) {
    var validate_user, collectionPermissions, response, result, allCollectionData, tids;
    return _regenerator["default"].wrap(function _callee29$(_context29) {
      while (1) {
        switch (_context29.prev = _context29.next) {
          case 0:
            if (!(req.body && !req.body.action)) {
              _context29.next = 3;
              break;
            }

            res.json({
              status: "undefined",
              received: req.query
            });
            return _context29.abrupt("return");

          case 3:
            validate_user = validateUser(req.body.username, req.body.hash);
            _context29.next = 6;
            return getResourcePermissions('collections', validate_user ? req.body.username : "");

          case 6:
            collectionPermissions = _context29.sent;
            response = {
              status: "failed"
            }; // var available_options = {
            //
            // }
            // if ( validate_user ){

            _context29.t0 = req.body.action;
            _context29.next = _context29.t0 === "list" ? 11 : _context29.t0 === "get" ? 17 : _context29.t0 === "delete" ? 27 : _context29.t0 === "create" ? 35 : _context29.t0 === "edit" ? 44 : _context29.t0 === "download" ? 57 : 69;
            break;

          case 11:
            _context29.next = 13;
            return listCollections();

          case 13:
            result = _context29.sent;
            result = result.filter(function (elm) {
              return collectionPermissions.read.indexOf(elm.collection_id) > -1;
            });
            response = {
              status: "success",
              data: result
            };
            return _context29.abrupt("break", 69);

          case 17:
            if (!(collectionPermissions.read.indexOf(req.body.collection_id) > -1)) {
              _context29.next = 25;
              break;
            }

            _context29.next = 20;
            return getCollection(req.body.collection_id);

          case 20:
            result = _context29.sent;
            result.permissions = {
              read: collectionPermissions.read.indexOf(req.body.collection_id) > -1,
              write: collectionPermissions.write.indexOf(req.body.collection_id) > -1
            };
            response = {
              status: "success",
              data: result
            };
            _context29.next = 26;
            break;

          case 25:
            response = {
              status: "unauthorised operation",
              payload: req.body
            };

          case 26:
            return _context29.abrupt("break", 69);

          case 27:
            if (!(collectionPermissions.write.indexOf(req.body.collection_id) > -1)) {
              _context29.next = 33;
              break;
            }

            _context29.next = 30;
            return deleteCollection(req.body.collection_id);

          case 30:
            response = {
              status: "success",
              data: {}
            };
            _context29.next = 34;
            break;

          case 33:
            response = {
              status: "unauthorised operation",
              payload: req.body
            };

          case 34:
            return _context29.abrupt("break", 69);

          case 35:
            if (!validate_user) {
              _context29.next = 42;
              break;
            }

            _context29.next = 38;
            return createCollection("new collection", "", req.body.username);

          case 38:
            result = _context29.sent;
            response = {
              status: "success",
              data: result
            };
            _context29.next = 43;
            break;

          case 42:
            response = {
              status: "login to create collection",
              payload: req.body
            };

          case 43:
            return _context29.abrupt("break", 69);

          case 44:
            if (!(collectionPermissions.write.indexOf(req.body.collection_id) > -1)) {
              _context29.next = 55;
              break;
            }

            allCollectionData = JSON.parse(req.body.collectionData);
            _context29.next = 48;
            return editCollection(allCollectionData);

          case 48:
            result = _context29.sent;
            _context29.next = 51;
            return getCollection(req.body.collection_id);

          case 51:
            result = _context29.sent;
            response = {
              status: "success",
              data: result
            };
            _context29.next = 56;
            break;

          case 55:
            response = {
              status: "unauthorised operation",
              payload: req.body
            };

          case 56:
            return _context29.abrupt("break", 69);

          case 57:
            //
            tids = JSON.parse(req.body.tid);

            if (!(req.body.target.indexOf("results") > -1)) {
              _context29.next = 64;
              break;
            }

            _context29.next = 61;
            return getResults(tids);

          case 61:
            result = _context29.sent;
            _context29.next = 67;
            break;

          case 64:
            _context29.next = 66;
            return getMetadata(tids);

          case 66:
            result = _context29.sent;

          case 67:
            response = {
              status: "success",
              data: result
            };
            return _context29.abrupt("break", 69);

          case 69:
            //
            // } else {
            //   response = {status:"unauthorised", payload: null}
            // }
            res.json(response);

          case 70:
          case "end":
            return _context29.stop();
        }
      }
    }, _callee29);
  }));

  return function (_x46, _x47) {
    return _ref29.apply(this, arguments);
  };
}()); // Tables

var createTable = /*#__PURE__*/function () {
  var _ref30 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee30(docid, page, user, collection_id, file_path) {
    var client, result;
    return _regenerator["default"].wrap(function _callee30$(_context30) {
      while (1) {
        switch (_context30.prev = _context30.next) {
          case 0:
            _context30.next = 2;
            return pool.connect();

          case 2:
            client = _context30.sent;
            _context30.next = 5;
            return client.query("INSERT INTO public.\"table\"(\n\t       docid, page, \"user\", notes, collection_id, file_path, \"tableType\")\n\t     VALUES ($1, $2, $3, $4, $5, $6, $7);", [docid, page, user, "", collection_id, file_path, ""]);

          case 5:
            result = _context30.sent;
            client.release();
            return _context30.abrupt("return", result);

          case 8:
          case "end":
            return _context30.stop();
        }
      }
    }, _callee30);
  }));

  return function createTable(_x48, _x49, _x50, _x51, _x52) {
    return _ref30.apply(this, arguments);
  };
}();

var removeTables = /*#__PURE__*/function () {
  var _ref31 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee31(tables, collection_id) {
    var fromSelect,
        client,
        i,
        result,
        filename,
        _args31 = arguments;
    return _regenerator["default"].wrap(function _callee31$(_context31) {
      while (1) {
        switch (_context31.prev = _context31.next) {
          case 0:
            fromSelect = _args31.length > 2 && _args31[2] !== undefined ? _args31[2] : false;

            if (!fromSelect) {
              tables = tables.map(function (tab) {
                var _tab$split = tab.split("_"),
                    _tab$split2 = (0, _slicedToArray2["default"])(_tab$split, 2),
                    docid = _tab$split2[0],
                    page = _tab$split2[1];

                return {
                  docid: docid,
                  page: page
                };
              });
            }

            _context31.next = 4;
            return pool.connect();

          case 4:
            client = _context31.sent;
            i = 0;

          case 6:
            if (!(i < tables.length)) {
              _context31.next = 15;
              break;
            }

            _context31.next = 9;
            return client.query("DELETE FROM public.\"table\"\n        \tWHERE docid = $1 AND page = $2 AND collection_id = $3;", [tables[i].docid, tables[i].page, collection_id]);

          case 9:
            result = _context31.sent;
            filename = tables[i].docid + "_" + tables[i].page + ".html";

            try {
              moveFileToCollection({
                originalname: filename,
                path: path.join(global.tables_folder, collection_id, filename)
              }, "deleted");
            } catch (err) {
              console.log("REMOVE FILE DIDN't EXIST: " + JSON.stringify(err));
            }

          case 12:
            i++;
            _context31.next = 6;
            break;

          case 15:
            client.release();
            return _context31.abrupt("return", result);

          case 17:
          case "end":
            return _context31.stop();
        }
      }
    }, _callee31);
  }));

  return function removeTables(_x53, _x54) {
    return _ref31.apply(this, arguments);
  };
}();

var moveTables = /*#__PURE__*/function () {
  var _ref32 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee32(tables, collection_id, target_collection_id) {
    var client, i, result, filename;
    return _regenerator["default"].wrap(function _callee32$(_context32) {
      while (1) {
        switch (_context32.prev = _context32.next) {
          case 0:
            tables = tables.map(function (tab) {
              var _tab$split3 = tab.split("_"),
                  _tab$split4 = (0, _slicedToArray2["default"])(_tab$split3, 2),
                  docid = _tab$split4[0],
                  page = _tab$split4[1];

              return {
                docid: docid,
                page: page
              };
            });
            _context32.next = 3;
            return pool.connect();

          case 3:
            client = _context32.sent;
            i = 0;

          case 5:
            if (!(i < tables.length)) {
              _context32.next = 14;
              break;
            }

            _context32.next = 8;
            return client.query("UPDATE public.\"table\"\n\t       SET collection_id=$4\n         WHERE docid = $1 AND page = $2 AND collection_id = $3;", [tables[i].docid, tables[i].page, collection_id, target_collection_id]);

          case 8:
            result = _context32.sent;
            filename = tables[i].docid + "_" + tables[i].page + ".html";

            try {
              moveFileToCollection({
                originalname: filename,
                path: path.join(global.tables_folder, collection_id, filename)
              }, target_collection_id);
            } catch (err) {
              console.log("MOVE FILE DIDN't EXIST: " + JSON.stringify(err));
            }

          case 11:
            i++;
            _context32.next = 5;
            break;

          case 14:
            client.release();
            return _context32.abrupt("return", result);

          case 16:
          case "end":
            return _context32.stop();
        }
      }
    }, _callee32);
  }));

  return function moveTables(_x55, _x56, _x57) {
    return _ref32.apply(this, arguments);
  };
}();

app.post(CONFIG.api_base_url + '/tables', /*#__PURE__*/function () {
  var _ref33 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee33(req, res) {
    var validate_user, collectionPermissions, result;
    return _regenerator["default"].wrap(function _callee33$(_context33) {
      while (1) {
        switch (_context33.prev = _context33.next) {
          case 0:
            if (!(req.body && !req.body.action)) {
              _context33.next = 3;
              break;
            }

            res.json({
              status: "undefined",
              received: req.query
            });
            return _context33.abrupt("return");

          case 3:
            validate_user = validateUser(req.body.username, req.body.hash);
            _context33.next = 6;
            return getResourcePermissions('collections', validate_user ? req.body.username : "");

          case 6:
            collectionPermissions = _context33.sent;

            if (!validate_user) {
              _context33.next = 28;
              break;
            }

            result = {};
            _context33.t0 = req.body.action;
            _context33.next = _context33.t0 === "remove" ? 12 : _context33.t0 === "move" ? 17 : _context33.t0 === "list" ? 22 : 22;
            break;

          case 12:
            if (!(collectionPermissions.write.indexOf(req.body.collection_id) > -1)) {
              _context33.next = 16;
              break;
            }

            _context33.next = 15;
            return removeTables(JSON.parse(req.body.tablesList), req.body.collection_id);

          case 15:
            result = _context33.sent;

          case 16:
            return _context33.abrupt("break", 22);

          case 17:
            if (!(collectionPermissions.write.indexOf(req.body.collection_id) > -1)) {
              _context33.next = 21;
              break;
            }

            _context33.next = 20;
            return moveTables(JSON.parse(req.body.tablesList), req.body.collection_id, req.body.targetCollectionID);

          case 20:
            result = _context33.sent;

          case 21:
            return _context33.abrupt("break", 22);

          case 22:
            _context33.next = 24;
            return getCollection(req.body.collection_id);

          case 24:
            result = _context33.sent;
            res.json({
              status: "success",
              data: result
            });
            _context33.next = 29;
            break;

          case 28:
            res.json({
              status: "unauthorised",
              payload: null
            });

          case 29:
          case "end":
            return _context33.stop();
        }
      }
    }, _callee33);
  }));

  return function (_x58, _x59) {
    return _ref33.apply(this, arguments);
  };
}());
app.post(CONFIG.api_base_url + '/search', /*#__PURE__*/function () {
  var _ref34 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee34(req, res) {
    var bod, type, validate_user, collectionPermissions, search_results;
    return _regenerator["default"].wrap(function _callee34$(_context34) {
      while (1) {
        switch (_context34.prev = _context34.next) {
          case 0:
            bod = req.body.searchContent;
            type = JSON.parse(req.body.searchType);
            validate_user = validateUser(req.body.username, req.body.hash);
            _context34.next = 5;
            return getResourcePermissions('collections', validate_user ? req.body.username : "");

          case 5:
            collectionPermissions = _context34.sent;
            // if ( collectionPermissions.write.indexOf(req.body.collection_id) > -1 ){
            //if ( validate_user ){
            search_results = easysearch.search(global.searchIndex, bod);
            search_results = search_results.filter(function (elm) {
              return collectionPermissions.read.indexOf(elm.doc.split("/")[0]) > -1;
            });
            console.log("SEARCH: " + search_results.length + " for " + bod); // if ( search_results.length > 100){
            //   search_results = search_results.slice(0,100)
            // }

            res.json(search_results); // } else {
            //   res.json([])
            // }

          case 10:
          case "end":
            return _context34.stop();
        }
      }
    }, _callee34);
  }));

  return function (_x60, _x61) {
    return _ref34.apply(this, arguments);
  };
}());
app.post(CONFIG.api_base_url + '/getTableContent', /*#__PURE__*/function () {
  var _ref35 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee35(req, res) {
    var bod, validate_user, collectionPermissions, collection_data, enablePrediction, tableData, annotation, rows, cols, predAnnotationData;
    return _regenerator["default"].wrap(function _callee35$(_context35) {
      while (1) {
        switch (_context35.prev = _context35.next) {
          case 0:
            bod = req.body.searchContent;
            validate_user = validateUser(req.body.username, req.body.hash);
            _context35.next = 4;
            return getResourcePermissions('collections', validate_user ? req.body.username : "");

          case 4:
            collectionPermissions = _context35.sent;

            if (!(collectionPermissions.read.indexOf(req.body.collId) > -1)) {
              _context35.next = 34;
              break;
            }

            _context35.prev = 6;

            if (!(req.body.docid && req.body.page && req.body.collId)) {
              _context35.next = 25;
              break;
            }

            _context35.next = 10;
            return getCollection(req.body.collId);

          case 10:
            collection_data = _context35.sent;
            enablePrediction = JSON.parse(req.body.enablePrediction);
            _context35.next = 14;
            return (0, _table.readyTable)(req.body.docid, req.body.page, req.body.collId, enablePrediction);

          case 14:
            tableData = _context35.sent;
            _context35.next = 17;
            return getAnnotationByID(req.body.docid, req.body.page, req.body.collId);

          case 17:
            annotation = _context35.sent;
            tableData.collectionData = collection_data;
            tableData.annotationData = annotation && annotation.rows.length > 0 ? annotation.rows[0] : {};

            if (enablePrediction) {
              rows = tableData.predictedAnnotation.rows.map(function (ann) {
                return {
                  location: "Row",
                  content: ann.descriptors.reduce(function (acc, d) {
                    acc[d] = true;
                    return acc;
                  }, {}),
                  number: ann.c + 1 + "",
                  qualifiers: ann.unique_modifier == "" ? {} : ann.unique_modifier.split(";").filter(function (a) {
                    return a.length > 1;
                  }).reduce(function (acc, d) {
                    acc[d] = true;
                    return acc;
                  }, {}),
                  subannotation: false
                };
              });
              cols = tableData.predictedAnnotation.cols.map(function (ann) {
                return {
                  location: "Col",
                  content: ann.descriptors.reduce(function (acc, d) {
                    acc[d] = true;
                    return acc;
                  }, {}),
                  number: ann.c + 1 + "",
                  qualifiers: ann.unique_modifier == "" ? {} : ann.unique_modifier.split(";").filter(function (a) {
                    return a.length > 1;
                  }).reduce(function (acc, d) {
                    acc[d] = true;
                    return acc;
                  }, {}),
                  subannotation: false
                };
              });
              predAnnotationData = tableData.annotationData && tableData.annotationData.annotation ? tableData.annotationData : {
                annotation: {
                  collection_id: req.body.collId,
                  completion: "",
                  docid: req.body.docid,
                  file_path: req.body.docid + "_" + req.body.page + ".html",
                  notes: "",
                  page: req.body.page,
                  tableType: "",
                  tid: tableData.collectionData.tables.filter(function (table) {
                    return table.docid == req.body.docid && table.page == req.body.page;
                  })[0].tid,
                  user: req.body.username
                }
              }; // var tData = tableData.collectionData.tables.filter( ( table ) => { return table.docid == req.body.docid && table.page == req.body.page } )

              predAnnotationData.annotation.annotations = [].concat((0, _toConsumableArray2["default"])(rows), (0, _toConsumableArray2["default"])(cols));
              tableData.annotationData = predAnnotationData;
            }

            tableData.permissions = {
              read: collectionPermissions.read.indexOf(req.body.collId) > -1,
              write: collectionPermissions.write.indexOf(req.body.collId) > -1
            };
            res.json(tableData);
            _context35.next = 26;
            break;

          case 25:
            res.json({
              status: "wrong parameters",
              body: req.body
            });

          case 26:
            _context35.next = 32;
            break;

          case 28:
            _context35.prev = 28;
            _context35.t0 = _context35["catch"](6);
            console.log(_context35.t0);
            res.json({
              status: "getTableContent: probably page out of bounds, or document does not exist",
              body: req.body
            });

          case 32:
            _context35.next = 35;
            break;

          case 34:
            res.json({
              status: "unauthorised",
              body: req.body
            });

          case 35:
          case "end":
            return _context35.stop();
        }
      }
    }, _callee35, null, [[6, 28]]);
  }));

  return function (_x62, _x63) {
    return _ref35.apply(this, arguments);
  };
}()); // Extracts all recommended CUIs from the DB and formats them as per the "recommend_cuis" variable a the bottom of the function.

function getRecommendedCUIS() {
  return _getRecommendedCUIS.apply(this, arguments);
}

function _getRecommendedCUIS() {
  _getRecommendedCUIS = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee66() {
    var cuiRecommend, recommend_cuis, rec_cuis, splitConcepts;
    return _regenerator["default"].wrap(function _callee66$(_context66) {
      while (1) {
        switch (_context66.prev = _context66.next) {
          case 0:
            cuiRecommend = /*#__PURE__*/function () {
              var _ref60 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee65() {
                var client, result;
                return _regenerator["default"].wrap(function _callee65$(_context65) {
                  while (1) {
                    switch (_context65.prev = _context65.next) {
                      case 0:
                        _context65.next = 2;
                        return pool.connect();

                      case 2:
                        client = _context65.sent;
                        _context65.next = 5;
                        return client.query("select * from cuis_recommend");

                      case 5:
                        result = _context65.sent;
                        client.release();
                        return _context65.abrupt("return", result);

                      case 8:
                      case "end":
                        return _context65.stop();
                    }
                  }
                }, _callee65);
              }));

              return function cuiRecommend() {
                return _ref60.apply(this, arguments);
              };
            }();

            recommend_cuis = {};
            _context66.next = 4;
            return cuiRecommend();

          case 4:
            rec_cuis = _context66.sent.rows;

            splitConcepts = function splitConcepts(c) {
              if (c == null) {
                return [];
              }

              var ret = c[0] == ";" ? c.slice(1) : c; // remove trailing ;

              return ret.length > 0 ? ret.split(";") : [];
            };

            rec_cuis ? rec_cuis.map(function (item) {
              var cuis = splitConcepts(item.cuis);
              var rep_cuis = splitConcepts(item.rep_cuis);
              var excluded_cuis = splitConcepts(item.excluded_cuis);
              var rec_cuis = [];
              cuis.forEach(function (cui) {
                if (excluded_cuis.indexOf(cui) < 0) {
                  if (rep_cuis.indexOf(cui) < 0) {
                    rec_cuis.push(cui);
                  }
                }
              });
              recommend_cuis[item.concept] = {
                cuis: rep_cuis.concat(rec_cuis),
                cc: item.cc
              };
            }) : "";
            return _context66.abrupt("return", recommend_cuis);

          case 8:
          case "end":
            return _context66.stop();
        }
      }
    }, _callee66);
  }));
  return _getRecommendedCUIS.apply(this, arguments);
}

app.get(CONFIG.api_base_url + '/cuiRecommend', /*#__PURE__*/function () {
  var _ref36 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee36(req, res) {
    var cuirec;
    return _regenerator["default"].wrap(function _callee36$(_context36) {
      while (1) {
        switch (_context36.prev = _context36.next) {
          case 0:
            _context36.next = 2;
            return getRecommendedCUIS();

          case 2:
            cuirec = _context36.sent;
            res.send(cuirec);

          case 4:
          case "end":
            return _context36.stop();
        }
      }
    }, _callee36);
  }));

  return function (_x64, _x65) {
    return _ref36.apply(this, arguments);
  };
}());

var prepareAnnotationPreview = /*#__PURE__*/function () {
  var _ref37 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee40(docid, page, collId, cachedOnly) {
    var annotations, entry, override_exists, tableResults, tid, client, tableResult, toReturn, final_annotations, r, ann, existing, final_annotations_array, doRequest, plumberResult;
    return _regenerator["default"].wrap(function _callee40$(_context40) {
      while (1) {
        switch (_context40.prev = _context40.next) {
          case 0:
            _context40.next = 2;
            return getAnnotationByID(docid, page, collId);

          case 2:
            annotations = _context40.sent;

            if (!(annotations.rows.length > 0)) {
              _context40.next = 15;
              break;
            }

            entry = annotations.rows[0];
            _context40.next = 7;
            return fs.existsSync(path.join(global.tables_folder_override, entry.collection_id, entry.file_path));

          case 7:
            override_exists = _context40.sent;
            _context40.next = 10;
            return (0, _tabuliser.getFileResults)(entry.annotation, path.join(override_exists ? tables_folder_override : global.tables_folder, entry.collection_id, entry.file_path));

          case 10:
            tableResults = _context40.sent;
            tableResults.map(function (item) {
              item.docid_page = entry.docid + "_" + entry.page;
            });
            return _context40.abrupt("return", {
              "state": "good",
              result: tableResults
            });

          case 15:
            return _context40.abrupt("return", {
              "state": "fail",
              result: []
            });

          case 16:
            // debugge
            tid = annotations.rows.length > 0 ? annotations.rows[0].tid : -1;

            if (!(tid < 0)) {
              _context40.next = 19;
              break;
            }

            return _context40.abrupt("return", {
              status: "wrong parameters (missing tid)"
            });

          case 19:
            _context40.next = 21;
            return pool.connect();

          case 21:
            client = _context40.sent;
            _context40.next = 24;
            return client.query("SELECT tid, \"tableResult\" FROM result WHERE tid = $1", [tid]);

          case 24:
            tableResult = _context40.sent;
            client.release();
            tableResult = tableResult && tableResult.rows.length > 0 ? tableResult.rows[0].tableResult : [];

            if (!(cachedOnly === 'true')) {
              _context40.next = 31;
              break;
            }

            toReturn = {};

            if (tableResult.length > 0) {
              toReturn = {
                "state": "good",
                result: tableResult
              };
            } else {
              toReturn = {
                "state": "good",
                result: []
              };
            } // console.log("Fast reload: "+ req.body.docid +" - "+ req.body.page +" - "+ req.body.collId)


            return _context40.abrupt("return", toReturn);

          case 31:
            final_annotations = {};
            /**
            * There are multiple versions of the annotations. When calling reading the results from the database, here we will return only the latest/ most complete version of the annotation.
            * Independently from the author of it. Completeness here measured as the result with the highest number of annotations and the highest index number (I.e. Newest, but only if it has more information/annotations).
            * May not be the best in some cases.
            *
            */

            for (r in annotations.rows) {
              ann = annotations.rows[r];
              existing = final_annotations[ann.docid + "_" + ann.page];

              if (existing) {
                if (ann.N > existing.N && ann.annotation.annotations.length >= existing.annotation.annotations.length) {
                  final_annotations[ann.docid + "_" + ann.page] = ann;
                }
              } else {
                // Didn't exist so add it.
                final_annotations[ann.docid + "_" + ann.page] = ann;
              }
            }

            final_annotations_array = [];

            for (r in final_annotations) {
              ann = final_annotations[r];
              final_annotations_array[final_annotations_array.length] = ann;
            }

            if (!(final_annotations_array.length > 0)) {
              _context40.next = 49;
              break;
            }

            entry = final_annotations_array[0];
            entry.annotation = !entry.annotation ? [] : entry.annotation.annotations.map(function (v, i) {
              var ann = v;
              ann.content = Object.keys(ann.content).join(";");
              ann.qualifiers = Object.keys(ann.qualifiers).join(";");
              return ann;
            });
            console.log(entry);
            entry.annotation.reduce(function (acc, entry, i) {
              acc[entry.content] = acc[entry.content] ? acc[entry.content] + 1 : 1;
              entry.content = entry.content + "@" + acc[entry.content];
              return acc;
            }, {});
            console.log("TRY: " + 'http://' + CONFIG.plumber_url + '/preview');
            doRequest = new Promise( /*#__PURE__*/function () {
              var _ref38 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee39(accept, reject) {
                return _regenerator["default"].wrap(function _callee39$(_context39) {
                  while (1) {
                    switch (_context39.prev = _context39.next) {
                      case 0:
                        _context39.next = 2;
                        return request({
                          url: 'http://' + CONFIG.plumber_url + '/preview',
                          method: "POST",
                          json: {
                            anns: entry,
                            collId: collId
                          }
                        }, /*#__PURE__*/function () {
                          var _ref39 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee38(error, response, body) {
                            var insertResult;
                            return _regenerator["default"].wrap(function _callee38$(_context38) {
                              while (1) {
                                switch (_context38.prev = _context38.next) {
                                  case 0:
                                    // console.log("pentada"+JSON.stringify(error))
                                    insertResult = /*#__PURE__*/function () {
                                      var _ref40 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee37(tid, tableResult) {
                                        var client, done;
                                        return _regenerator["default"].wrap(function _callee37$(_context37) {
                                          while (1) {
                                            switch (_context37.prev = _context37.next) {
                                              case 0:
                                                _context37.next = 2;
                                                return pool.connect();

                                              case 2:
                                                client = _context37.sent;
                                                _context37.next = 5;
                                                return client.query('INSERT INTO result(tid, "tableResult") VALUES ($1, $2) ON CONFLICT (tid) DO UPDATE SET "tableResult" = $2', [tid, tableResult]).then(function (result) {
                                                  return console.log("insert result: " + new Date());
                                                })["catch"](function (e) {
                                                  return console.error(e.stack);
                                                }).then(function () {
                                                  return client.release();
                                                });

                                              case 5:
                                                done = _context37.sent;

                                              case 6:
                                              case "end":
                                                return _context37.stop();
                                            }
                                          }
                                        }, _callee37);
                                      }));

                                      return function insertResult(_x75, _x76) {
                                        return _ref40.apply(this, arguments);
                                      };
                                    }();

                                    if (!(body && body.tableResult && body.tableResult.length > 0)) {
                                      _context38.next = 8;
                                      break;
                                    }

                                    _context38.next = 4;
                                    return insertResult(body.ann.tid[0], body.tableResult);

                                  case 4:
                                    console.log("tableresults: " + body.tableResult.length);
                                    accept({
                                      "state": "good",
                                      result: body.tableResult
                                    });
                                    _context38.next = 10;
                                    break;

                                  case 8:
                                    console.log("tableresults: empty. Is plumber/R API running, or annotation empty?");
                                    accept({
                                      "state": "good",
                                      result: []
                                    });

                                  case 10:
                                  case "end":
                                    return _context38.stop();
                                }
                              }
                            }, _callee38);
                          }));

                          return function (_x72, _x73, _x74) {
                            return _ref39.apply(this, arguments);
                          };
                        }());

                      case 2:
                      case "end":
                        return _context39.stop();
                    }
                  }
                }, _callee39);
              }));

              return function (_x70, _x71) {
                return _ref38.apply(this, arguments);
              };
            }());
            _context40.next = 44;
            return doRequest;

          case 44:
            plumberResult = _context40.sent;
            plumberResult["backAnnotation"] = annotations;
            return _context40.abrupt("return", plumberResult);

          case 49:
            return _context40.abrupt("return", {
              "state": "empty"
            });

          case 50:
            return _context40.abrupt("return", {
              "state": "whathappened!"
            });

          case 51:
          case "end":
            return _context40.stop();
        }
      }
    }, _callee40);
  }));

  return function prepareAnnotationPreview(_x66, _x67, _x68, _x69) {
    return _ref37.apply(this, arguments);
  };
}(); // Generates the results table live preview, connecting to the R API.


app.post(CONFIG.api_base_url + '/annotationPreview', /*#__PURE__*/function () {
  var _ref41 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee41(req, res) {
    var bod, validate_user, collectionPermissions;
    return _regenerator["default"].wrap(function _callee41$(_context41) {
      while (1) {
        switch (_context41.prev = _context41.next) {
          case 0:
            bod = req.body.searchContent;
            validate_user = validateUser(req.body.username, req.body.hash);
            _context41.next = 4;
            return getResourcePermissions('collections', validate_user ? req.body.username : "");

          case 4:
            collectionPermissions = _context41.sent;

            if (!(collectionPermissions.read.indexOf(req.body.collId) > -1)) {
              _context41.next = 24;
              break;
            }

            _context41.prev = 6;

            if (!(req.body.docid && req.body.page && req.body.collId)) {
              _context41.next = 15;
              break;
            }

            _context41.t0 = res;
            _context41.next = 11;
            return prepareAnnotationPreview(req.body.docid, req.body.page, req.body.collId, req.body.cachedOnly);

          case 11:
            _context41.t1 = _context41.sent;

            _context41.t0.json.call(_context41.t0, _context41.t1);

            _context41.next = 16;
            break;

          case 15:
            res.json({
              status: "wrong parameters",
              body: req.body
            });

          case 16:
            _context41.next = 22;
            break;

          case 18:
            _context41.prev = 18;
            _context41.t2 = _context41["catch"](6);
            console.log(_context41.t2);
            res.json({
              status: "annotationPreview : probably page out of bounds, or document does not exist",
              body: req.body
            });

          case 22:
            _context41.next = 25;
            break;

          case 24:
            res.json([]);

          case 25:
          case "end":
            return _context41.stop();
        }
      }
    }, _callee41, null, [[6, 18]]);
  }));

  return function (_x77, _x78) {
    return _ref41.apply(this, arguments);
  };
}()); // Returns all annotations for all document/tables.

app.get(CONFIG.api_base_url + '/formattedResults', /*#__PURE__*/function () {
  var _ref42 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee42(req, res) {
    var results, finalResults, r, ann, existing, finalResults_array, formattedRes;
    return _regenerator["default"].wrap(function _callee42$(_context42) {
      while (1) {
        switch (_context42.prev = _context42.next) {
          case 0:
            _context42.next = 2;
            return (0, _network_functions.getAnnotationResults)();

          case 2:
            results = _context42.sent;

            if (results) {
              finalResults = {};
              /**
              * There are multiple versions of the annotations. When calling reading the results from the database, here we will return only the latest/ most complete version of the annotation.
              * Independently from the author of it. Completeness here measured as the result with the highest number of annotations and the highest index number (I.e. Newest, but only if it has more information/annotations).
              * May not be the best in some cases.
              */

              for (r in results.rows) {
                ann = results.rows[r];
                existing = finalResults[ann.docid + "_" + ann.page];

                if (existing) {
                  if (ann.N > existing.N && ann.annotation.annotations.length >= existing.annotation.annotations.length) {
                    finalResults[ann.docid + "_" + ann.page] = ann;
                  }
                } else {
                  // Didn't exist so add it.
                  finalResults[ann.docid + "_" + ann.page] = ann;
                }
              }

              finalResults_array = [];

              for (r in finalResults) {
                ann = finalResults[r];
                finalResults_array[finalResults_array.length] = ann;
              }

              formattedRes = '"user","docid","page","corrupted_text","tableType","location","number","content","qualifiers"\n';
              finalResults_array.map(function (value, i) {
                value.annotation.annotations.map(function (ann, j) {
                  try {
                    formattedRes = formattedRes + '"' + value.user + '","' + value.docid + '","' + value.page // +'","'+value.corrupted
                    + '","' + (value.corrupted_text == "undefined" ? "" : value.corrupted_text).replace(/\"/g, "'") + '","' + value.tableType + '","' + ann.location + '","' + ann.number + '","' + Object.keys(ann.content).join(';') + '","' + Object.keys(ann.qualifiers).join(';') + '"' + "\n";
                  } catch (e) {
                    console.log("an empty annotation, no worries: " + JSON.stringify(ann));
                  }
                });
              });
              res.send(formattedRes);
            }

          case 4:
          case "end":
            return _context42.stop();
        }
      }
    }, _callee42);
  }));

  return function (_x79, _x80) {
    return _ref42.apply(this, arguments);
  };
}()); // app.get('/api/abs_index',function(req,res){
//
//   var output = "";
//   for (var i in abs_index){
//
//     output = output + i
//               +","+abs_index[i].docid
//               +","+abs_index[i].page
//               +"\n";
//
//   }
//
//   res.send(output)
// });
// app.get('/api/totalTables',function(req,res){
//   res.send({total : DOCS.length})
// });

var getMMatch = /*#__PURE__*/function () {
  var _ref43 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee43(phrase) {
    var result, mm_match, r;
    return _regenerator["default"].wrap(function _callee43$(_context43) {
      while (1) {
        switch (_context43.prev = _context43.next) {
          case 0:
            phrase = phrase.trim().replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, ''); //.replace(/[\W_]+/g," ");

            console.log("Asking MM for: " + phrase);
            result = new Promise(function (resolve, reject) {
              request.post({
                headers: {
                  'content-type': 'application/x-www-form-urlencoded'
                },
                url: 'http://' + CONFIG.metamapper_url + '/form',
                body: "input=" + phrase + " &args=-AsI+ --JSONn -E"
              }, function (error, res, body) {
                if (error) {
                  reject(error);
                  return;
                }

                var start = body.indexOf('{"AllDocuments"');
                var end = body.indexOf("'EOT'.");
                resolve(body.slice(start, end));
              });
            });
            _context43.next = 5;
            return result;

          case 5:
            mm_match = _context43.sent;
            _context43.prev = 6;
            r = JSON.parse(mm_match).AllDocuments[0].Document.Utterances.map(function (utterances) {
              return utterances.Phrases.map(function (phrases) {
                return phrases.Mappings.map(function (mappings) {
                  return mappings.MappingCandidates.map(function (candidate) {
                    return {
                      CUI: candidate.CandidateCUI,
                      score: candidate.CandidateScore,
                      matchedText: candidate.CandidateMatched,
                      preferred: candidate.CandidatePreferred,
                      hasMSH: candidate.Sources.indexOf("MSH") > -1
                    };
                  });
                });
              });
            }); // // This removes duplicate cuis
            // r = r.reduce( (acc,el) => {if ( acc.cuis.indexOf(el.CUI) < 0 ){acc.cuis.push(el.CUI); acc.data.push(el)}; return acc }, {cuis: [], data: []} ).data

            r = r.flat().flat().flat().reduce(function (acc, el) {
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
            r = r.sort(function (a, b) {
              return a.score - b.score;
            });
            return _context43.abrupt("return", r);

          case 13:
            _context43.prev = 13;
            _context43.t0 = _context43["catch"](6);
            return _context43.abrupt("return", []);

          case 16:
          case "end":
            return _context43.stop();
        }
      }
    }, _callee43, null, [[6, 13]]);
  }));

  return function getMMatch(_x81) {
    return _ref43.apply(this, arguments);
  };
}();

var processHeaders = /*#__PURE__*/function () {
  var _ref44 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee47(headers) {
    var all_concepts, results, insertCUI, cuis_index, allConceptPairs, _final;

    return _regenerator["default"].wrap(function _callee47$(_context47) {
      while (1) {
        switch (_context47.prev = _context47.next) {
          case 0:
            all_concepts = Array.from(new Set(Object.values(headers).flat().flat().flat().flat()));
            _context47.next = 3;
            return Promise.all(all_concepts.map( /*#__PURE__*/function () {
              var _ref45 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee44(concept, i) {
                var mm_match;
                return _regenerator["default"].wrap(function _callee44$(_context44) {
                  while (1) {
                    switch (_context44.prev = _context44.next) {
                      case 0:
                        _context44.next = 2;
                        return getMMatch(concept.toLowerCase());

                      case 2:
                        mm_match = _context44.sent;
                        return _context44.abrupt("return", mm_match);

                      case 4:
                      case "end":
                        return _context44.stop();
                    }
                  }
                }, _callee44);
              }));

              return function (_x83, _x84) {
                return _ref45.apply(this, arguments);
              };
            }()));

          case 3:
            results = _context47.sent;

            insertCUI = /*#__PURE__*/function () {
              var _ref46 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee45(cui, preferred, hasMSH) {
                var client, done;
                return _regenerator["default"].wrap(function _callee45$(_context45) {
                  while (1) {
                    switch (_context45.prev = _context45.next) {
                      case 0:
                        _context45.next = 2;
                        return pool.connect();

                      case 2:
                        client = _context45.sent;
                        _context45.next = 5;
                        return client.query('INSERT INTO cuis_index(cui,preferred,"hasMSH",user_defined,admin_approved) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (cui) DO UPDATE SET preferred = $2, "hasMSH" = $3, user_defined = $4, admin_approved = $5', [cui, preferred, hasMSH, true, false]).then(function (result) {
                          return console.log("insert: " + new Date());
                        })["catch"](function (e) {
                          return console.error(e.stack);
                        }).then(function () {
                          return client.release();
                        });

                      case 5:
                        done = _context45.sent;

                      case 6:
                      case "end":
                        return _context45.stop();
                    }
                  }
                }, _callee45);
              }));

              return function insertCUI(_x85, _x86, _x87) {
                return _ref46.apply(this, arguments);
              };
            }();

            _context47.next = 7;
            return getCUISIndex();

          case 7:
            cuis_index = _context47.sent;
            _context47.next = 10;
            return Promise.all(results.flat().flat().map( /*#__PURE__*/function () {
              var _ref47 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee46(cuiData, i) {
                return _regenerator["default"].wrap(function _callee46$(_context46) {
                  while (1) {
                    switch (_context46.prev = _context46.next) {
                      case 0:
                        if (!cuis_index[cuiData.CUI]) {
                          _context46.next = 4;
                          break;
                        }

                        return _context46.abrupt("return");

                      case 4:
                        _context46.next = 6;
                        return insertCUI(cuiData.CUI, cuiData.preferred, cuiData.hasMSH);

                      case 6:
                        return _context46.abrupt("return", _context46.sent);

                      case 7:
                      case "end":
                        return _context46.stop();
                    }
                  }
                }, _callee46);
              }));

              return function (_x88, _x89) {
                return _ref47.apply(this, arguments);
              };
            }()));

          case 10:
            results = all_concepts.reduce(function (acc, con, i) {
              acc[con.toLowerCase().trim()] = {
                concept: con.trim(),
                labels: results[i]
              };
              return acc;
            }, {});
            allConceptPairs = Object.keys(headers).reduce(function (acc, concepts) {
              acc.push(headers[concepts]);
              return acc;
            }, []).flat();
            _final = allConceptPairs.reduce(function (acc, con, i) {
              var concept = con[con.length - 1].toLowerCase().trim();
              var root = con.slice(0, con.length - 1).join(" ").toLowerCase().trim();
              var rootWCase = con.slice(0, con.length - 1).join(" ").trim();
              var key = root + concept;
              acc[key] = {
                concept: con[con.length - 1].trim(),
                root: rootWCase,
                labels: results[concept].labels
              };
              return acc;
            }, {});
            return _context47.abrupt("return", _final);

          case 14:
          case "end":
            return _context47.stop();
        }
      }
    }, _callee47);
  }));

  return function processHeaders(_x82) {
    return _ref44.apply(this, arguments);
  };
}();

app.post(CONFIG.api_base_url + '/auto', /*#__PURE__*/function () {
  var _ref48 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee48(req, res) {
    var headers;
    return _regenerator["default"].wrap(function _callee48$(_context48) {
      while (1) {
        switch (_context48.prev = _context48.next) {
          case 0:
            _context48.prev = 0;

            if (!(req.body && req.body.headers)) {
              _context48.next = 11;
              break;
            }

            headers = JSON.parse(req.body.headers);
            _context48.t0 = res;
            _context48.next = 6;
            return processHeaders(headers);

          case 6:
            _context48.t1 = _context48.sent;
            _context48.t2 = {
              autoLabels: _context48.t1
            };

            _context48.t0.send.call(_context48.t0, _context48.t2);

            _context48.next = 12;
            break;

          case 11:
            res.send({
              status: "wrong parameters",
              query: req.query
            });

          case 12:
            _context48.next = 18;
            break;

          case 14:
            _context48.prev = 14;
            _context48.t3 = _context48["catch"](0);
            console.log(_context48.t3);
            res.send({
              status: "error",
              query: _context48.t3
            });

          case 18:
          case "end":
            return _context48.stop();
        }
      }
    }, _callee48, null, [[0, 14]]);
  }));

  return function (_x90, _x91) {
    return _ref48.apply(this, arguments);
  };
}());
app.get(CONFIG.api_base_url + '/getMMatch', /*#__PURE__*/function () {
  var _ref49 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee49(req, res) {
    var mm_match;
    return _regenerator["default"].wrap(function _callee49$(_context49) {
      while (1) {
        switch (_context49.prev = _context49.next) {
          case 0:
            _context49.prev = 0;

            if (!(req.query && req.query.phrase)) {
              _context49.next = 8;
              break;
            }

            _context49.next = 4;
            return getMMatch(req.query.phrase);

          case 4:
            mm_match = _context49.sent;
            res.send(mm_match);
            _context49.next = 9;
            break;

          case 8:
            res.send({
              status: "wrong parameters",
              query: req.query
            });

          case 9:
            _context49.next = 14;
            break;

          case 11:
            _context49.prev = 11;
            _context49.t0 = _context49["catch"](0);
            console.log(_context49.t0);

          case 14:
          case "end":
            return _context49.stop();
        }
      }
    }, _callee49, null, [[0, 11]]);
  }));

  return function (_x92, _x93) {
    return _ref49.apply(this, arguments);
  };
}());
app.post(CONFIG.api_base_url + '/notes', /*#__PURE__*/function () {
  var _ref50 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee51(req, res) {
    var validate_user, notesData, updateNotes;
    return _regenerator["default"].wrap(function _callee51$(_context51) {
      while (1) {
        switch (_context51.prev = _context51.next) {
          case 0:
            if (!(req.body && !req.body.action)) {
              _context51.next = 3;
              break;
            }

            res.json({
              status: "undefined",
              received: req.query
            });
            return _context51.abrupt("return");

          case 3:
            validate_user = validateUser(req.body.username, req.body.hash);

            if (!validate_user) {
              _context51.next = 12;
              break;
            }

            notesData = JSON.parse(req.body.payload);

            updateNotes = /*#__PURE__*/function () {
              var _ref51 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee50(docid, page, collid, notes, tableType, completion) {
                var client, done;
                return _regenerator["default"].wrap(function _callee50$(_context50) {
                  while (1) {
                    switch (_context50.prev = _context50.next) {
                      case 0:
                        _context50.next = 2;
                        return pool.connect();

                      case 2:
                        client = _context50.sent;
                        _context50.next = 5;
                        return client.query('UPDATE public."table" SET notes=$4, "tableType"=$5, completion=$6 WHERE docid=$1 AND page=$2 AND collection_id=$3', [docid, page, collid, notes, tableType, completion]).then(function (result) {
                          return console.log("Updated records for " + req.body.docid + "_" + req.body.page + "_" + req.body.collId + " result: " + new Date());
                        })["catch"](function (e) {
                          return console.error(e.stack);
                        }).then(function () {
                          return client.release();
                        });

                      case 5:
                        done = _context50.sent;

                      case 6:
                      case "end":
                        return _context50.stop();
                    }
                  }
                }, _callee50);
              }));

              return function updateNotes(_x96, _x97, _x98, _x99, _x100, _x101) {
                return _ref51.apply(this, arguments);
              };
            }();

            _context51.next = 9;
            return updateNotes(req.body.docid, req.body.page, req.body.collId, notesData.textNotes, notesData.tableType, notesData.tableStatus);

          case 9:
            res.json({
              status: "Successful",
              payload: null
            });
            _context51.next = 13;
            break;

          case 12:
            res.json({
              status: "unauthorised",
              payload: null
            });

          case 13:
          case "end":
            return _context51.stop();
        }
      }
    }, _callee51);
  }));

  return function (_x94, _x95) {
    return _ref50.apply(this, arguments);
  };
}());
app.post(CONFIG.api_base_url + '/text', /*#__PURE__*/function () {
  var _ref52 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee52(req, res) {
    var validate_user, result, folder_exists, titleText, bodyText, start_body_index, last_body_index, body, completeFile;
    return _regenerator["default"].wrap(function _callee52$(_context52) {
      while (1) {
        switch (_context52.prev = _context52.next) {
          case 0:
            if (!(req.body && !req.body.action)) {
              _context52.next = 3;
              break;
            }

            res.json({
              status: "undefined",
              received: req.query
            });
            return _context52.abrupt("return");

          case 3:
            validate_user = validateUser(req.body.username, req.body.hash);

            if (!validate_user) {
              _context52.next = 18;
              break;
            }

            _context52.next = 7;
            return fs.existsSync(path.join(global.tables_folder_override, req.body.collId));

          case 7:
            folder_exists = _context52.sent;

            if (!folder_exists) {
              fs.mkdirSync(path.join(global.tables_folder_override, req.body.collId), {
                recursive: true
              });
            }

            titleText = '<div class="headers"><div style="font-size:20px; font-weight:bold; white-space: normal;">' + cheerio(JSON.parse(req.body.payload).tableTitle).text() + '</div></div>';
            bodyText = JSON.parse(req.body.payload).tableBody;
            start_body_index = bodyText.indexOf("<table");
            last_body_index = bodyText.lastIndexOf("</table>");

            if (start_body_index > -1 && last_body_index > -1) {
              body = bodyText.substring(start_body_index, last_body_index) + "</table>";
            } else {
              body = bodyText;
            }

            completeFile = '<html><body>' + titleText + body + '</body></html>';
            fs.writeFile(path.join(global.tables_folder_override, req.body.collId, req.body.docid + "_" + req.body.page + '.html'), completeFile, function (err) {
              if (err) throw err;
              console.log('Written replacement for: ' + req.body.collId + " // " + req.body.docid + "_" + req.body.page + '.html');
              res.json({
                status: "success",
                data: 'Written replacement for: ' + req.body.collId + " // " + req.body.docid + "_" + req.body.page + '.html'
              });
            });
            _context52.next = 19;
            break;

          case 18:
            res.json({
              status: "unauthorised",
              payload: null
            });

          case 19:
          case "end":
            return _context52.stop();
        }
      }
    }, _callee52);
  }));

  return function (_x102, _x103) {
    return _ref52.apply(this, arguments);
  };
}());
app.get(CONFIG.api_base_url + '/removeOverrideTable', /*#__PURE__*/function () {
  var _ref53 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee53(req, res) {
    var file_exists;
    return _regenerator["default"].wrap(function _callee53$(_context53) {
      while (1) {
        switch (_context53.prev = _context53.next) {
          case 0:
            if (!(req.query && req.query.docid && req.query.page)) {
              _context53.next = 8;
              break;
            }

            _context53.next = 3;
            return fs.existsSync(global.tables_folder_override + "/" + req.query.docid + "_" + req.query.page + ".html");

          case 3:
            file_exists = _context53.sent;

            if (file_exists) {
              fs.unlink(global.tables_folder_override + "/" + req.query.docid + "_" + req.query.page + ".html", function (err) {
                if (err) throw err;
                console.log("REMOVED : " + global.tables_folder_override + "/" + req.query.docid + "_" + req.query.page + ".html");
              });
            }

            res.send({
              status: "override removed"
            });
            _context53.next = 9;
            break;

          case 8:
            res.send({
              status: "no changes"
            });

          case 9:
          case "end":
            return _context53.stop();
        }
      }
    }, _callee53);
  }));

  return function (_x104, _x105) {
    return _ref53.apply(this, arguments);
  };
}());
app.get(CONFIG.api_base_url + '/classify', /*#__PURE__*/function () {
  var _ref54 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee54(req, res) {
    return _regenerator["default"].wrap(function _callee54$(_context54) {
      while (1) {
        switch (_context54.prev = _context54.next) {
          case 0:
            if (!(req.query && req.query.terms)) {
              _context54.next = 8;
              break;
            }

            console.log(req.query.terms);
            _context54.t0 = res;
            _context54.next = 5;
            return classify(req.query.terms.split(","));

          case 5:
            _context54.t1 = _context54.sent;
            _context54.t2 = {
              results: _context54.t1
            };

            _context54.t0.send.call(_context54.t0, _context54.t2);

          case 8:
          case "end":
            return _context54.stop();
        }
      }
    }, _callee54);
  }));

  return function (_x106, _x107) {
    return _ref54.apply(this, arguments);
  };
}());
app.get(CONFIG.api_base_url + '/getTable', /*#__PURE__*/function () {
  var _ref55 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee55(req, res) {
    var tableData;
    return _regenerator["default"].wrap(function _callee55$(_context55) {
      while (1) {
        switch (_context55.prev = _context55.next) {
          case 0:
            _context55.prev = 0;

            if (!(req.query && req.query.docid && req.query.page && req.query.collId)) {
              _context55.next = 8;
              break;
            }

            _context55.next = 4;
            return (0, _table.readyTable)(req.query.docid, req.query.page, req.query.collId, false);

          case 4:
            tableData = _context55.sent;
            res.send(tableData);
            _context55.next = 9;
            break;

          case 8:
            res.send({
              status: "wrong parameters",
              query: req.query
            });

          case 9:
            _context55.next = 15;
            break;

          case 11:
            _context55.prev = 11;
            _context55.t0 = _context55["catch"](0);
            console.log(_context55.t0);
            res.send({
              status: "getTable: probably page out of bounds, or document does not exist",
              query: req.query
            });

          case 15:
          case "end":
            return _context55.stop();
        }
      }
    }, _callee55, null, [[0, 11]]);
  }));

  return function (_x108, _x109) {
    return _ref55.apply(this, arguments);
  };
}());
app.post(CONFIG.api_base_url + '/getTable', /*#__PURE__*/function () {
  var _ref56 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee56(req, res) {
    var tableData;
    return _regenerator["default"].wrap(function _callee56$(_context56) {
      while (1) {
        switch (_context56.prev = _context56.next) {
          case 0:
            _context56.prev = 0;

            if (!(req.body && req.body.docid && req.body.page && req.body.collId)) {
              _context56.next = 8;
              break;
            }

            _context56.next = 4;
            return (0, _table.readyTable)(req.body.docid, req.body.page, req.body.collId, false);

          case 4:
            tableData = _context56.sent;
            res.json(tableData);
            _context56.next = 9;
            break;

          case 8:
            res.json({
              status: "wrong parameters",
              query: req.body
            });

          case 9:
            _context56.next = 15;
            break;

          case 11:
            _context56.prev = 11;
            _context56.t0 = _context56["catch"](0);
            console.log(_context56.t0);
            res.json({
              status: "getTable: probably page out of bounds, or document does not exist",
              query: req.body
            });

          case 15:
          case "end":
            return _context56.stop();
        }
      }
    }, _callee56, null, [[0, 11]]);
  }));

  return function (_x110, _x111) {
    return _ref56.apply(this, arguments);
  };
}());
app.post(CONFIG.api_base_url + '/saveAnnotation', /*#__PURE__*/function () {
  var _ref57 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee58(req, res) {
    var validate_user, tid, insertAnnotation, annotationData;
    return _regenerator["default"].wrap(function _callee58$(_context58) {
      while (1) {
        switch (_context58.prev = _context58.next) {
          case 0:
            if (!(req.body && !req.body.action)) {
              _context58.next = 3;
              break;
            }

            res.json({
              status: "undefined",
              received: req.query
            });
            return _context58.abrupt("return");

          case 3:
            validate_user = validateUser(req.body.username, req.body.hash);

            if (!validate_user) {
              _context58.next = 17;
              break;
            }

            console.log("Recording Annotation: " + req.body.docid + "_" + req.body.page + "_" + req.body.collId);
            _context58.next = 8;
            return getTid(req.body.docid, req.body.page, req.body.collId);

          case 8:
            tid = _context58.sent;

            insertAnnotation = /*#__PURE__*/function () {
              var _ref58 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee57(tid, annotation) {
                var client, done;
                return _regenerator["default"].wrap(function _callee57$(_context57) {
                  while (1) {
                    switch (_context57.prev = _context57.next) {
                      case 0:
                        _context57.next = 2;
                        return pool.connect();

                      case 2:
                        client = _context57.sent;
                        _context57.next = 5;
                        return client.query('INSERT INTO annotations VALUES($2,$1) ON CONFLICT (tid) DO UPDATE SET annotation = $2;', [tid, annotation]).then(function (result) {
                          return console.log("Updated Annotations for " + tid + " : " + new Date());
                        })["catch"](function (e) {
                          return console.error(e.stack);
                        }).then(function () {
                          return client.release();
                        });

                      case 5:
                        done = _context57.sent;

                      case 6:
                      case "end":
                        return _context57.stop();
                    }
                  }
                }, _callee57);
              }));

              return function insertAnnotation(_x114, _x115) {
                return _ref58.apply(this, arguments);
              };
            }();

            annotationData = JSON.parse(req.body.payload);
            annotationData.annotations.map(function (row) {
              row.content = Array.isArray(row.content) ? row.content.reduce(function (acc, item) {
                acc[item] = true;
                return acc;
              }, {}) : row.content;
              row.qualifiers = Array.isArray(row.qualifiers) ? row.qualifiers.reduce(function (acc, item) {
                acc[item] = true;
                return acc;
              }, {}) : row.qualifiers;
              return row;
            });
            _context58.next = 14;
            return insertAnnotation(tid, {
              annotations: annotationData.annotations
            });

          case 14:
            res.json({
              status: "success",
              payload: ""
            });
            _context58.next = 18;
            break;

          case 17:
            res.json({
              status: "unauthorised",
              payload: null
            });

          case 18:
          case "end":
            return _context58.stop();
        }
      }
    }, _callee58);
  }));

  return function (_x112, _x113) {
    return _ref57.apply(this, arguments);
  };
}());

var prepareMetadata = function prepareMetadata(headerData, tableResults) {
  if (!headerData.headers || headerData.headers.length < 1 || !tableResults) {
    return {};
  }

  tableResults = tableResults.sort(function (a, b) {
    return a.row - b.row;
  });
  var headerDataCopy = JSON.parse(JSON.stringify(headerData));
  headerDataCopy.headers.reverse();
  headerDataCopy.subs.reverse();
  var annotation_groups = headerDataCopy.headers.reduce(function (acc, item, i) {
    if (headerDataCopy.subs[i]) {
      acc.temp.push(item);
    } else {
      acc.groups.push([].concat((0, _toConsumableArray2["default"])(acc.temp), [item]).reverse());
      acc.temp = [];
    }

    ;
    return acc;
  }, {
    groups: [],
    temp: []
  });
  annotation_groups.groups[annotation_groups.groups.length - 1] = [].concat((0, _toConsumableArray2["default"])(annotation_groups.groups[annotation_groups.groups.length - 1]), (0, _toConsumableArray2["default"])(annotation_groups.temp));
  annotation_groups = annotation_groups.groups.reverse();
  var grouped_headers = annotation_groups.reduce(function (acc, group, i) {
    var concepts = tableResults.reduce(function (cons, res, j) {
      cons.push(group.map(function (head) {
        if (res[head]) return res[head];
      }));
      return cons;
    }, []);
    acc[group.join()] = concepts;
    return acc;
  }, {});
  var meta_concepts = Object.keys(grouped_headers).reduce(function (mcon, group) {
    var alreadyshown = [];
    var lastConcept = "";
    mcon[group] = grouped_headers[group].reduce(function (acc, concepts) {
      var key = concepts.join();

      if (!alreadyshown[key]) {
        alreadyshown[key] = true;
        concepts = concepts.filter(function (b) {
          return b != undefined;
        });

        if (concepts[concepts.length - 1] == lastConcept) {
          concepts = concepts.slice(concepts.length - 2, 1);
        }

        acc.push(concepts);
      }

      return acc;
    }, []);
    return mcon;
  }, {});

  var unfoldConcepts = function unfoldConcepts(concepts) {
    var unfolded = concepts.reduce(function (stor, elm, i) {
      for (var e = 1; e <= elm.length; e++) {
        var partial_elm = elm.slice(0, e);
        var key = partial_elm.join();

        if (stor.alreadyThere.indexOf(key) < 0) {
          stor.unfolded.push(partial_elm);
          stor.alreadyThere.push(key);
        }
      }

      return stor;
    }, {
      unfolded: [],
      alreadyThere: []
    });
    return unfolded.unfolded;
  };

  meta_concepts = Object.keys(meta_concepts).reduce(function (acc, mcon, j) {
    acc[mcon] = unfoldConcepts(meta_concepts[mcon]);
    return acc;
  }, {});
  return meta_concepts;
};

var processAnnotationAndMetadata = /*#__PURE__*/function () {
  var _ref59 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee59(docid, page, collId) {
    var tabularData, tid, header_data, headerData, headDATA, hedDatra, metadata, result;
    return _regenerator["default"].wrap(function _callee59$(_context59) {
      while (1) {
        switch (_context59.prev = _context59.next) {
          case 0:
            _context59.next = 2;
            return prepareAnnotationPreview(docid, page, collId, false);

          case 2:
            tabularData = _context59.sent;

            if (!(tabularData.backAnnotation && tabularData.backAnnotation.rows.length > 0 && tabularData.backAnnotation.rows[0].annotation)) {
              _context59.next = 16;
              break;
            }

            // .annotations.map( ann => { return {head: Object.keys(ann.content).join(";"), sub: ann.subAnnotation } })
            tid = tabularData.backAnnotation.rows[0].tid;
            header_data = tabularData.backAnnotation.rows[0].annotation.map(function (ann) {
              return {
                head: [ann.content.split("@")[0]].join(";"),
                sub: ann.subAnnotation
              };
            });
            header_data = header_data.reduce(function (acc, header, i) {
              acc.count[header.head] = acc.count[header.head] ? acc.count[header.head] + 1 : 1;
              acc.headers.push(header.head + "@" + acc.count[header.head]);
              acc.subs.push(header.sub);
              return acc;
            }, {
              count: {},
              headers: [],
              subs: []
            });
            headerData = tabularData.result.reduce(function (acc, item) {
              Object.keys(item).map(function (head) {
                if (["col", "row", "docid_page", "value"].indexOf(head) < 0) {
                  var currentItem = acc[head];

                  if (!currentItem) {
                    currentItem = [];
                  }

                  currentItem.push(item[head]);
                  acc[head] = (0, _toConsumableArray2["default"])(new Set(currentItem));
                }
              });
              return acc;
            }, {});
            headDATA = prepareMetadata(header_data, tabularData.result);
            _context59.next = 11;
            return processHeaders(headDATA);

          case 11:
            hedDatra = _context59.sent;
            metadata = Object.keys(hedDatra).map(function (key) {
              var cuis = hedDatra[key].labels.map(function (label) {
                return label.CUI;
              });
              return {
                concept: hedDatra[key].concept,
                concept_root: hedDatra[key].root,
                concept_source: "",
                cuis: cuis,
                cuis_selected: cuis.slice(0, 2),
                istitle: false,
                labeller: "suso",
                qualifiers: [""],
                qualifiers_selected: [""],
                tid: tid
              };
            });
            _context59.next = 15;
            return setMetadata(metadata);

          case 15:
            result = _context59.sent;

          case 16:
          case "end":
            return _context59.stop();
        }
      }
    }, _callee59);
  }));

  return function processAnnotationAndMetadata(_x116, _x117, _x118) {
    return _ref59.apply(this, arguments);
  };
}(); // api_host
// ui_port
// ui_host


var exec = require('child_process').exec;

var myShellScript = exec('fuser -k ' + CONFIG.api_port + '/tcp');
app.listen(CONFIG.api_port, '0.0.0.0', function () {
  console.log('Table Tidier Server running on port ' + CONFIG.api_port + ' with base: ' + CONFIG.api_base_url + "  :: " + new Date().toISOString());
});
main();