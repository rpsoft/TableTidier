"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _files = require("./files.js");

var _security = _interopRequireWildcard(require("./security.js"));

var _table = require("./table.js");

var _metamap = require("./metamap.js");

var _extra_functions = _interopRequireDefault(require("./extra_functions.js"));

var _network_functions = require("./network_functions.js");

var express = require('express');

var bodyParser = require('body-parser');

var html = require("html");

var request = require("request");

var multer = require('multer');

var fs = require('fs');

var _require = require('pg'),
    Pool = _require.Pool,
    Client = _require.Client,
    Query = _require.Query;

var csv = require('csv-parser');

var CsvReadableStream = require('csv-reader');

var path = require('path'); //NODE R CONFIGURATION.


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
app.post('/login', function (req, res, next) {
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
app.post('/api/createUser', /*#__PURE__*/function () {
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

app.post('/api/tableUploader', /*#__PURE__*/function () {
  var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(req, res) {
    var upload;
    return _regenerator["default"].wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            upload = multer({
              storage: storage
            }).array('fileNames');
            upload(req, res, /*#__PURE__*/function () {
              var _ref3 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(err) {
                var files, index, len, results, _files$index$original, _files$index$original2, docid, page;

                return _regenerator["default"].wrap(function _callee2$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        files = req.files;
                        results = []; // Loop through all the uploaded files and return names to frontend

                        index = 0, len = files.length;

                      case 3:
                        if (!(index < len)) {
                          _context2.next = 19;
                          break;
                        }

                        _context2.prev = 4;
                        moveFileToCollection(files[index], req.body.collection_id);
                        _files$index$original = files[index].originalname.split(".")[0].split("_"), _files$index$original2 = (0, _slicedToArray2["default"])(_files$index$original, 2), docid = _files$index$original2[0], page = _files$index$original2[1];
                        _context2.next = 9;
                        return createTable(docid, page, req.body.username_uploader, req.body.collection_id, files[index].originalname);

                      case 9:
                        results.push({
                          filename: files[index].originalname,
                          status: "success"
                        });
                        _context2.next = 16;
                        break;

                      case 12:
                        _context2.prev = 12;
                        _context2.t0 = _context2["catch"](4);
                        console.log("file: " + files[index].originalname + " failed to process");
                        results.push({
                          filename: files[index].originalname,
                          status: "failed"
                        });

                      case 16:
                        ++index;
                        _context2.next = 3;
                        break;

                      case 19:
                        res.send(results);

                      case 20:
                      case "end":
                        return _context2.stop();
                    }
                  }
                }, _callee2, null, [[4, 12]]);
              }));

              return function (_x5) {
                return _ref3.apply(this, arguments);
              };
            }());

          case 2:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));

  return function (_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}());

function UMLSData() {
  return _UMLSData.apply(this, arguments);
}

function _UMLSData() {
  _UMLSData = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee51() {
    var semtypes, cui_def, cui_concept;
    return _regenerator["default"].wrap(function _callee51$(_context51) {
      while (1) {
        switch (_context51.prev = _context51.next) {
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
            _context51.next = 3;
            return semtypes;

          case 3:
            semtypes = _context51.sent;
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
            _context51.next = 7;
            return cui_def;

          case 7:
            cui_def = _context51.sent;
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
            _context51.next = 11;
            return cui_concept;

          case 11:
            cui_concept = _context51.sent;
            return _context51.abrupt("return", {
              semtypes: semtypes,
              cui_def: cui_def,
              cui_concept: cui_concept
            });

          case 13:
          case "end":
            return _context51.stop();
        }
      }
    }, _callee51);
  }));
  return _UMLSData.apply(this, arguments);
}

function CUIData() {
  return _CUIData.apply(this, arguments);
} // Gets the labellers associated w ith each document/table.


function _CUIData() {
  _CUIData = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee52() {
    var umlsData, results, rres;
    return _regenerator["default"].wrap(function _callee52$(_context52) {
      while (1) {
        switch (_context52.prev = _context52.next) {
          case 0:
            _context52.next = 2;
            return UMLSData();

          case 2:
            umlsData = _context52.sent;
            _context52.next = 5;
            return (0, _network_functions.getAnnotationResults)();

          case 5:
            results = _context52.sent;
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
            return _context52.abrupt("return", {
              cui_def: umlsData.cui_def,
              cui_concept: umlsData.cui_concept,
              actual_results: rres,
              semtypes: umlsData.semtypes
            });

          case 8:
          case "end":
            return _context52.stop();
        }
      }
    }, _callee52);
  }));
  return _CUIData.apply(this, arguments);
}

function getMetadataLabellers() {
  return _getMetadataLabellers.apply(this, arguments);
} // Returns the annotation for a single document/table


function _getMetadataLabellers() {
  _getMetadataLabellers = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee53() {
    var client, result;
    return _regenerator["default"].wrap(function _callee53$(_context53) {
      while (1) {
        switch (_context53.prev = _context53.next) {
          case 0:
            _context53.next = 2;
            return pool.connect();

          case 2:
            client = _context53.sent;
            _context53.next = 5;
            return client.query("select distinct docid, page, labeller from metadata");

          case 5:
            result = _context53.sent;
            client.release();
            return _context53.abrupt("return", result);

          case 8:
          case "end":
            return _context53.stop();
        }
      }
    }, _callee53);
  }));
  return _getMetadataLabellers.apply(this, arguments);
}

function getAnnotationByID(_x6, _x7, _x8) {
  return _getAnnotationByID.apply(this, arguments);
}

function _getAnnotationByID() {
  _getAnnotationByID = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee54(docid, page, collId) {
    var client, result;
    return _regenerator["default"].wrap(function _callee54$(_context54) {
      while (1) {
        switch (_context54.prev = _context54.next) {
          case 0:
            _context54.next = 2;
            return pool.connect();

          case 2:
            client = _context54.sent;
            _context54.next = 5;
            return client.query("\n    SELECT docid, page, \"user\", notes, collection_id, file_path, \"tableType\", \"table\".tid, completion, annotation\n    FROM \"table\"\n    LEFT JOIN annotations\n    ON  \"table\".tid = annotations.tid\n    WHERE docid=$1 AND page=$2 AND collection_id = $3 ", [docid, page, collId]);

          case 5:
            result = _context54.sent;
            client.release();
            return _context54.abrupt("return", result);

          case 8:
          case "end":
            return _context54.stop();
        }
      }
    }, _callee54);
  }));
  return _getAnnotationByID.apply(this, arguments);
}

var rebuildSearchIndex = /*#__PURE__*/function () {
  var _ref4 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4() {
    var tables, tables_folder_override;
    return _regenerator["default"].wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            tables = fs.readdirSync(path.join(global.tables_folder)).map(function (dir) {
              return path.join(global.tables_folder, dir);
            });
            tables_folder_override = fs.readdirSync(path.join(global.tables_folder_override)).map(function (dir) {
              return path.join(global.tables_folder_override, dir);
            });
            _context4.next = 4;
            return easysearch.indexFolder([].concat((0, _toConsumableArray2["default"])(tables), (0, _toConsumableArray2["default"])(tables_folder_override)));

          case 4:
            global.searchIndex = _context4.sent;

          case 5:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));

  return function rebuildSearchIndex() {
    return _ref4.apply(this, arguments);
  };
}(); // preinitialisation of components if needed.


function main() {
  return _main.apply(this, arguments);
}

function _main() {
  _main = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee55() {
    return _regenerator["default"].wrap(function _callee55$(_context55) {
      while (1) {
        switch (_context55.prev = _context55.next) {
          case 0:
            _context55.next = 2;
            return rebuildSearchIndex();

          case 2:
            _context55.next = 4;
            return UMLSData();

          case 4:
            umls_data_buffer = _context55.sent;
            _context55.next = 7;
            return (0, _security.initialiseUsers)();

          case 7:
          case "end":
            return _context55.stop();
        }
      }
    }, _callee55);
  }));
  return _main.apply(this, arguments);
}

main();
app.get('/api/deleteTable', /*#__PURE__*/function () {
  var _ref5 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5(req, res) {
    var filename, delprom;
    return _regenerator["default"].wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            if (!(req.query && req.query.docid && req.query.page)) {
              _context5.next = 8;
              break;
            }

            filename = req.query.docid + "_" + req.query.page + ".html";
            delprom = new Promise(function (resolve, reject) {
              fs.rename(tables_folder + '/' + filename, tables_folder_deleted + '/' + filename, function (err) {
                if (err) {
                  reject("failed");
                }

                ;
                console.log('Move complete : ' + filename);
                resolve("done");
              });
            });
            _context5.next = 5;
            return delprom;

          case 5:
            // await refreshDocuments();
            res.send("table deleted");
            _context5.next = 9;
            break;

          case 8:
            res.send("table not deleted");

          case 9:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5);
  }));

  return function (_x9, _x10) {
    return _ref5.apply(this, arguments);
  };
}());
app.get('/api/recoverTable', /*#__PURE__*/function () {
  var _ref6 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6(req, res) {
    var filename;
    return _regenerator["default"].wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            if (req.query && req.query.docid && req.query.page) {
              filename = req.query.docid + "_" + req.query.page + ".html";
              fs.rename(tables_folder_deleted + '/' + filename, tables_folder + '/' + filename, function (err) {
                if (err) throw err;
                console.log('Move complete : ' + filename);
              });
            }

            res.send("table recovered");

          case 2:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6);
  }));

  return function (_x11, _x12) {
    return _ref6.apply(this, arguments);
  };
}());
app.get('/api/listDeletedTables', /*#__PURE__*/function () {
  var _ref7 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7(req, res) {
    return _regenerator["default"].wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
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
            return _context7.stop();
        }
      }
    }, _callee7);
  }));

  return function (_x13, _x14) {
    return _ref7.apply(this, arguments);
  };
}());
app.get('/api/modifyCUIData', /*#__PURE__*/function () {
  var _ref8 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee9(req, res) {
    var modifyCUIData, result;
    return _regenerator["default"].wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            modifyCUIData = /*#__PURE__*/function () {
              var _ref9 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee8(cui, preferred, adminApproved, prevcui) {
                var client, result, q;
                return _regenerator["default"].wrap(function _callee8$(_context8) {
                  while (1) {
                    switch (_context8.prev = _context8.next) {
                      case 0:
                        _context8.next = 2;
                        return pool.connect();

                      case 2:
                        client = _context8.sent;
                        _context8.next = 5;
                        return client.query("UPDATE cuis_index SET cui=$1, preferred=$2, admin_approved=$3 WHERE cui = $4", [cui, preferred, adminApproved, prevcui]);

                      case 5:
                        result = _context8.sent;

                        if (!(result && result.rowCount)) {
                          _context8.next = 11;
                          break;
                        }

                        q = new Query("UPDATE metadata SET cuis = array_to_string(array_replace(regexp_split_to_array(cuis, ';'), $2, $1), ';'), cuis_selected = array_to_string(array_replace(regexp_split_to_array(cuis_selected, ';'), $2, $1), ';')", [cui, prevcui]);
                        _context8.next = 10;
                        return client.query(q);

                      case 10:
                        result = _context8.sent;

                      case 11:
                        client.release();
                        return _context8.abrupt("return", result);

                      case 13:
                      case "end":
                        return _context8.stop();
                    }
                  }
                }, _callee8);
              }));

              return function modifyCUIData(_x17, _x18, _x19, _x20) {
                return _ref9.apply(this, arguments);
              };
            }();

            if (!(req.query && req.query.cui && req.query.preferred && req.query.adminApproved && req.query.prevcui)) {
              _context9.next = 8;
              break;
            }

            _context9.next = 4;
            return modifyCUIData(req.query.cui, req.query.preferred, req.query.adminApproved, req.query.prevcui);

          case 4:
            result = _context9.sent;
            res.send(result);
            _context9.next = 9;
            break;

          case 8:
            res.send("UPDATE failed");

          case 9:
          case "end":
            return _context9.stop();
        }
      }
    }, _callee9);
  }));

  return function (_x15, _x16) {
    return _ref8.apply(this, arguments);
  };
}());
app.get('/api/cuiDeleteIndex', /*#__PURE__*/function () {
  var _ref10 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee11(req, res) {
    var cuiDeleteIndex;
    return _regenerator["default"].wrap(function _callee11$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            cuiDeleteIndex = /*#__PURE__*/function () {
              var _ref11 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee10(cui) {
                var client, done;
                return _regenerator["default"].wrap(function _callee10$(_context10) {
                  while (1) {
                    switch (_context10.prev = _context10.next) {
                      case 0:
                        _context10.next = 2;
                        return pool.connect();

                      case 2:
                        client = _context10.sent;
                        _context10.next = 5;
                        return client.query('delete from cuis_index where cui = $1', [cui]).then(function (result) {
                          return console.log("deleted: " + new Date());
                        })["catch"](function (e) {
                          return console.error(e.stack);
                        }).then(function () {
                          return client.release();
                        });

                      case 5:
                        done = _context10.sent;

                      case 6:
                      case "end":
                        return _context10.stop();
                    }
                  }
                }, _callee10);
              }));

              return function cuiDeleteIndex(_x23) {
                return _ref11.apply(this, arguments);
              };
            }();

            if (!(req.query && req.query.cui)) {
              _context11.next = 7;
              break;
            }

            _context11.next = 4;
            return cuiDeleteIndex(req.query.cui);

          case 4:
            res.send("done");
            _context11.next = 8;
            break;

          case 7:
            res.send("clear failed");

          case 8:
          case "end":
            return _context11.stop();
        }
      }
    }, _callee11);
  }));

  return function (_x21, _x22) {
    return _ref10.apply(this, arguments);
  };
}());
app.get('/api/getMetadataForCUI', /*#__PURE__*/function () {
  var _ref12 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee13(req, res) {
    var getCuiTables, meta;
    return _regenerator["default"].wrap(function _callee13$(_context13) {
      while (1) {
        switch (_context13.prev = _context13.next) {
          case 0:
            getCuiTables = /*#__PURE__*/function () {
              var _ref13 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee12(cui) {
                var client, result;
                return _regenerator["default"].wrap(function _callee12$(_context12) {
                  while (1) {
                    switch (_context12.prev = _context12.next) {
                      case 0:
                        _context12.next = 2;
                        return pool.connect();

                      case 2:
                        client = _context12.sent;
                        _context12.next = 5;
                        return client.query("select docid,page,\"user\" from metadata where cuis like $1 ", ["%" + cui + "%"]);

                      case 5:
                        result = _context12.sent;
                        client.release();
                        return _context12.abrupt("return", result);

                      case 8:
                      case "end":
                        return _context12.stop();
                    }
                  }
                }, _callee12);
              }));

              return function getCuiTables(_x26) {
                return _ref13.apply(this, arguments);
              };
            }();

            if (!(req.query && req.query.cui)) {
              _context13.next = 8;
              break;
            }

            _context13.next = 4;
            return getCuiTables(req.query.cui);

          case 4:
            meta = _context13.sent;
            res.send(meta);
            _context13.next = 9;
            break;

          case 8:
            res.send("clear failed");

          case 9:
          case "end":
            return _context13.stop();
        }
      }
    }, _callee13);
  }));

  return function (_x24, _x25) {
    return _ref12.apply(this, arguments);
  };
}());

var clearMetadata = /*#__PURE__*/function () {
  var _ref14 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee14(tid) {
    var client, done;
    return _regenerator["default"].wrap(function _callee14$(_context14) {
      while (1) {
        switch (_context14.prev = _context14.next) {
          case 0:
            _context14.next = 2;
            return pool.connect();

          case 2:
            client = _context14.sent;
            _context14.next = 5;
            return client.query('DELETE FROM metadata WHERE tid = $1', [tid]).then(function (result) {
              return console.log("deleted: " + new Date());
            })["catch"](function (e) {
              return console.error(e.stack);
            }).then(function () {
              return client.release();
            });

          case 5:
            done = _context14.sent;

          case 6:
          case "end":
            return _context14.stop();
        }
      }
    }, _callee14);
  }));

  return function clearMetadata(_x27) {
    return _ref14.apply(this, arguments);
  };
}();

var setMetadata = /*#__PURE__*/function () {
  var _ref15 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee15(docid, page, concept, cuis, qualifiers, cuis_selected, qualifiers_selected, user, istitle, labeller) {
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
            return client.query('INSERT INTO metadata(docid, page, concept, cuis, qualifiers, "user", cuis_selected, qualifiers_selected, istitle, labeller ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (docid, page, concept, "user") DO UPDATE SET cuis = $4, qualifiers = $5, cuis_selected = $7, qualifiers_selected = $8, istitle = $9, labeller = $10', [docid, page, concept, cuis, qualifiers, user, cuis_selected, qualifiers_selected, istitle, labeller]).then(function (result) {
              return console.log("insert: " + new Date());
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

  return function setMetadata(_x28, _x29, _x30, _x31, _x32, _x33, _x34, _x35, _x36, _x37) {
    return _ref15.apply(this, arguments);
  };
}();

var getMetadata = /*#__PURE__*/function () {
  var _ref16 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee16(tid) {
    var client, result;
    return _regenerator["default"].wrap(function _callee16$(_context16) {
      while (1) {
        switch (_context16.prev = _context16.next) {
          case 0:
            _context16.next = 2;
            return pool.connect();

          case 2:
            client = _context16.sent;
            _context16.next = 5;
            return client.query("SELECT * FROM metadata WHERE tid = $1", [tid]);

          case 5:
            result = _context16.sent;
            client.release();
            return _context16.abrupt("return", result);

          case 8:
          case "end":
            return _context16.stop();
        }
      }
    }, _callee16);
  }));

  return function getMetadata(_x38) {
    return _ref16.apply(this, arguments);
  };
}();

app.post('/metadata', /*#__PURE__*/function () {
  var _ref17 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee17(req, res) {
    var validate_user, result;
    return _regenerator["default"].wrap(function _callee17$(_context17) {
      while (1) {
        switch (_context17.prev = _context17.next) {
          case 0:
            if (!(req.body && !req.body.action)) {
              _context17.next = 3;
              break;
            }

            res.json({
              status: "undefined",
              received: req.query
            });
            return _context17.abrupt("return");

          case 3:
            validate_user = validateUser(req.body.username, req.body.hash);

            if (!validate_user) {
              _context17.next = 26;
              break;
            }

            result = {};
            _context17.t0 = req.body.action;
            _context17.next = _context17.t0 === "clear" ? 9 : _context17.t0 === "set" ? 13 : _context17.t0 === "get" ? 17 : 20;
            break;

          case 9:
            _context17.next = 11;
            return clearMetadata(req.query.tid);

          case 11:
            result = _context17.sent;
            return _context17.abrupt("break", 20);

          case 13:
            _context17.next = 15;
            return setMetadata(req.query.docid, req.query.page, req.query.concept, req.query.cuis || "", req.query.qualifiers || "", req.query.cuis_selected || "", req.query.qualifiers_selected || "", req.query.user, req.query.istitle, req.query.labeller);

          case 15:
            result = _context17.sent;
            return _context17.abrupt("break", 20);

          case 17:
            _context17.next = 19;
            return getMetadata(req.query.tid);

          case 19:
            result = _context17.sent;

          case 20:
            _context17.next = 22;
            return getCollection(req.body.collection_id);

          case 22:
            result = _context17.sent;
            res.json({
              status: "success",
              data: result
            });
            _context17.next = 27;
            break;

          case 26:
            res.json({
              status: "unauthorised",
              payload: null
            });

          case 27:
          case "end":
            return _context17.stop();
        }
      }
    }, _callee17);
  }));

  return function (_x39, _x40) {
    return _ref17.apply(this, arguments);
  };
}());
app.get('/', function (req, res) {
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
} // Collections


var listCollections = /*#__PURE__*/function () {
  var _ref18 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee18() {
    var client, result;
    return _regenerator["default"].wrap(function _callee18$(_context18) {
      while (1) {
        switch (_context18.prev = _context18.next) {
          case 0:
            _context18.next = 2;
            return pool.connect();

          case 2:
            client = _context18.sent;
            _context18.next = 5;
            return client.query("SELECT collection.collection_id, title, description, owner_username, table_n\n       FROM public.collection\n       LEFT JOIN\n       ( SELECT collection_id, count(docid) as table_n FROM\n       ( select distinct docid, page, collection_id from public.table ) as interm\n       group by collection_id ) as coll_counts\n       ON collection.collection_id = coll_counts.collection_id ORDER BY collection_id");

          case 5:
            result = _context18.sent;
            client.release();
            return _context18.abrupt("return", result.rows);

          case 8:
          case "end":
            return _context18.stop();
        }
      }
    }, _callee18);
  }));

  return function listCollections() {
    return _ref18.apply(this, arguments);
  };
}();

var getCollection = /*#__PURE__*/function () {
  var _ref19 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee19(collection_id) {
    var client, result, tables, collectionsList;
    return _regenerator["default"].wrap(function _callee19$(_context19) {
      while (1) {
        switch (_context19.prev = _context19.next) {
          case 0:
            _context19.next = 2;
            return pool.connect();

          case 2:
            client = _context19.sent;
            _context19.next = 5;
            return client.query("SELECT *\n      FROM public.collection WHERE collection_id = $1", [collection_id]);

          case 5:
            result = _context19.sent;
            _context19.next = 8;
            return client.query("SELECT docid, page, \"user\", notes, tid, collection_id, file_path, \"tableType\"\n      FROM public.\"table\" WHERE collection_id = $1 ORDER BY docid,page", [collection_id]);

          case 8:
            tables = _context19.sent;
            _context19.next = 11;
            return client.query("SELECT * FROM public.collection ORDER BY collection_id");

          case 11:
            collectionsList = _context19.sent;
            client.release();

            if (!(result.rows.length == 1)) {
              _context19.next = 18;
              break;
            }

            result = result.rows[0];
            result.tables = tables.rows;
            result.collectionsList = collectionsList.rows;
            return _context19.abrupt("return", result);

          case 18:
            return _context19.abrupt("return", {});

          case 19:
          case "end":
            return _context19.stop();
        }
      }
    }, _callee19);
  }));

  return function getCollection(_x41) {
    return _ref19.apply(this, arguments);
  };
}();

var createCollection = /*#__PURE__*/function () {
  var _ref20 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee20(title, description, owner) {
    var client, result;
    return _regenerator["default"].wrap(function _callee20$(_context20) {
      while (1) {
        switch (_context20.prev = _context20.next) {
          case 0:
            _context20.next = 2;
            return pool.connect();

          case 2:
            client = _context20.sent;
            _context20.next = 5;
            return client.query("INSERT INTO public.collection(\n                                      title, description, owner_username, visibility, completion)\n                                      VALUES ($1, $2, $3, $4, $5);", [title, description, owner, "public", "in progress"]);

          case 5:
            result = _context20.sent;
            _context20.next = 8;
            return client.query("Select * from collection\n                                     ORDER BY collection_id DESC LIMIT 1;");

          case 8:
            result = _context20.sent;
            client.release();
            return _context20.abrupt("return", result);

          case 11:
          case "end":
            return _context20.stop();
        }
      }
    }, _callee20);
  }));

  return function createCollection(_x42, _x43, _x44) {
    return _ref20.apply(this, arguments);
  };
}();

var editCollection = /*#__PURE__*/function () {
  var _ref21 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee21(collData) {
    var client, result;
    return _regenerator["default"].wrap(function _callee21$(_context21) {
      while (1) {
        switch (_context21.prev = _context21.next) {
          case 0:
            _context21.next = 2;
            return pool.connect();

          case 2:
            client = _context21.sent;
            _context21.next = 5;
            return client.query("UPDATE public.collection\n      SET title=$2, description=$3, owner_username=$4, completion=$5, visibility=$6\n      WHERE collection_id=$1", [collData.collection_id, collData.title, collData.description, collData.owner_username, collData.completion, collData.visibility]);

          case 5:
            result = _context21.sent;
            client.release();
            return _context21.abrupt("return", result);

          case 8:
          case "end":
            return _context21.stop();
        }
      }
    }, _callee21);
  }));

  return function editCollection(_x45) {
    return _ref21.apply(this, arguments);
  };
}();

var deleteCollection = /*#__PURE__*/function () {
  var _ref22 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee22(collection_id) {
    var client, tables, result, results;
    return _regenerator["default"].wrap(function _callee22$(_context22) {
      while (1) {
        switch (_context22.prev = _context22.next) {
          case 0:
            _context22.next = 2;
            return pool.connect();

          case 2:
            client = _context22.sent;
            _context22.next = 5;
            return client.query("SELECT docid, page FROM public.\"table\" WHERE collection_id = $1", [collection_id]);

          case 5:
            tables = _context22.sent;
            tables = tables.rows;
            _context22.next = 9;
            return removeTables(tables, collection_id, true);

          case 9:
            result = _context22.sent;
            _context22.next = 12;
            return client.query("DELETE FROM collection WHERE collection_id = $1", [collection_id]);

          case 12:
            results = _context22.sent;
            client.release();

          case 14:
          case "end":
            return _context22.stop();
        }
      }
    }, _callee22);
  }));

  return function deleteCollection(_x46) {
    return _ref22.apply(this, arguments);
  };
}();

app.post('/collections', /*#__PURE__*/function () {
  var _ref23 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee23(req, res) {
    var validate_user, result, allCollectionData;
    return _regenerator["default"].wrap(function _callee23$(_context23) {
      while (1) {
        switch (_context23.prev = _context23.next) {
          case 0:
            if (!(req.body && !req.body.action)) {
              _context23.next = 3;
              break;
            }

            res.json({
              status: "undefined",
              received: req.query
            });
            return _context23.abrupt("return");

          case 3:
            validate_user = validateUser(req.body.username, req.body.hash);

            if (!validate_user) {
              _context23.next = 39;
              break;
            }

            _context23.t0 = req.body.action;
            _context23.next = _context23.t0 === "list" ? 8 : _context23.t0 === "get" ? 13 : _context23.t0 === "delete" ? 18 : _context23.t0 === "create" ? 22 : _context23.t0 === "edit" ? 27 : 36;
            break;

          case 8:
            _context23.next = 10;
            return listCollections();

          case 10:
            result = _context23.sent;
            res.json({
              status: "success",
              data: result
            });
            return _context23.abrupt("break", 37);

          case 13:
            _context23.next = 15;
            return getCollection(req.body.collection_id);

          case 15:
            result = _context23.sent;
            res.json({
              status: "success",
              data: result
            });
            return _context23.abrupt("break", 37);

          case 18:
            _context23.next = 20;
            return deleteCollection(req.body.collection_id);

          case 20:
            res.json({
              status: "success",
              data: {}
            });
            return _context23.abrupt("break", 37);

          case 22:
            _context23.next = 24;
            return createCollection("new collection", "", req.body.username);

          case 24:
            result = _context23.sent;
            res.json({
              status: "success",
              data: result
            });
            return _context23.abrupt("break", 37);

          case 27:
            allCollectionData = JSON.parse(req.body.collectionData); // if ( allCollectionData.collection_id == "new" ) {
            //   result = await createCollection(allCollectionData.title, allCollectionData.description, allCollectionData.owner_username);
            //   // result = result.rows[0]
            // } else {

            _context23.next = 30;
            return editCollection(allCollectionData);

          case 30:
            result = _context23.sent;
            _context23.next = 33;
            return getCollection(req.body.collection_id);

          case 33:
            result = _context23.sent;
            res.json({
              status: "success",
              data: result
            });
            return _context23.abrupt("break", 37);

          case 36:
            res.json({
              status: "failed"
            });

          case 37:
            _context23.next = 40;
            break;

          case 39:
            res.json({
              status: "unauthorised",
              payload: null
            });

          case 40:
          case "end":
            return _context23.stop();
        }
      }
    }, _callee23);
  }));

  return function (_x47, _x48) {
    return _ref23.apply(this, arguments);
  };
}());
app.post('/metadata', /*#__PURE__*/function () {
  var _ref24 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee24(req, res) {
    var validate_user, result;
    return _regenerator["default"].wrap(function _callee24$(_context24) {
      while (1) {
        switch (_context24.prev = _context24.next) {
          case 0:
            if (!(req.body && !req.body.action)) {
              _context24.next = 3;
              break;
            }

            res.json({
              status: "undefined",
              received: req.query
            });
            return _context24.abrupt("return");

          case 3:
            validate_user = validateUser(req.body.username, req.body.hash);

            if (!validate_user) {
              _context24.next = 17;
              break;
            }

            _context24.t0 = req.body.action;
            _context24.next = _context24.t0 === "get" ? 8 : _context24.t0 === "delete" ? 10 : _context24.t0 === "edit" ? 12 : 14;
            break;

          case 8:
            // result = await getCollection(req.body.collection_id);
            res.json({
              status: "success",
              data: result
            });
            return _context24.abrupt("break", 15);

          case 10:
            // await deleteCollection(req.body.collection_id);
            res.json({
              status: "success",
              data: {}
            });
            return _context24.abrupt("break", 15);

          case 12:
            // var allCollectionData = JSON.parse( req.body.collectionData )
            res.json({
              status: "success",
              data: result
            });
            return _context24.abrupt("break", 15);

          case 14:
            res.json({
              status: "failed"
            });

          case 15:
            _context24.next = 18;
            break;

          case 17:
            res.json({
              status: "unauthorised",
              payload: null
            });

          case 18:
          case "end":
            return _context24.stop();
        }
      }
    }, _callee24);
  }));

  return function (_x49, _x50) {
    return _ref24.apply(this, arguments);
  };
}()); // Tables

var createTable = /*#__PURE__*/function () {
  var _ref25 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee25(docid, page, user, collection_id, file_path) {
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
            return client.query("INSERT INTO public.\"table\"(\n\t       docid, page, \"user\", notes, collection_id, file_path, \"tableType\")\n\t     VALUES ($1, $2, $3, $4, $5, $6, $7);", [docid, page, user, "", collection_id, file_path, ""]);

          case 5:
            result = _context25.sent;
            client.release();
            return _context25.abrupt("return", result);

          case 8:
          case "end":
            return _context25.stop();
        }
      }
    }, _callee25);
  }));

  return function createTable(_x51, _x52, _x53, _x54, _x55) {
    return _ref25.apply(this, arguments);
  };
}();

var removeTables = /*#__PURE__*/function () {
  var _ref26 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee26(tables, collection_id) {
    var fromSelect,
        client,
        i,
        result,
        filename,
        _args26 = arguments;
    return _regenerator["default"].wrap(function _callee26$(_context26) {
      while (1) {
        switch (_context26.prev = _context26.next) {
          case 0:
            fromSelect = _args26.length > 2 && _args26[2] !== undefined ? _args26[2] : false;

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

            _context26.next = 4;
            return pool.connect();

          case 4:
            client = _context26.sent;
            i = 0;

          case 6:
            if (!(i < tables.length)) {
              _context26.next = 15;
              break;
            }

            _context26.next = 9;
            return client.query("DELETE FROM public.\"table\"\n        \tWHERE docid = $1 AND page = $2 AND collection_id = $3;", [tables[i].docid, tables[i].page, collection_id]);

          case 9:
            result = _context26.sent;
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
            _context26.next = 6;
            break;

          case 15:
            client.release();
            return _context26.abrupt("return", result);

          case 17:
          case "end":
            return _context26.stop();
        }
      }
    }, _callee26);
  }));

  return function removeTables(_x56, _x57) {
    return _ref26.apply(this, arguments);
  };
}();

var moveTables = /*#__PURE__*/function () {
  var _ref27 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee27(tables, collection_id, target_collection_id) {
    var client, i, result, filename;
    return _regenerator["default"].wrap(function _callee27$(_context27) {
      while (1) {
        switch (_context27.prev = _context27.next) {
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
            }); // debugger

            _context27.next = 3;
            return pool.connect();

          case 3:
            client = _context27.sent;
            i = 0;

          case 5:
            if (!(i < tables.length)) {
              _context27.next = 14;
              break;
            }

            _context27.next = 8;
            return client.query("UPDATE public.\"table\"\n\t       SET collection_id=$4\n         WHERE docid = $1 AND page = $2 AND collection_id = $3;", [tables[i].docid, tables[i].page, collection_id, target_collection_id]);

          case 8:
            result = _context27.sent;
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
            _context27.next = 5;
            break;

          case 14:
            client.release();
            return _context27.abrupt("return", result);

          case 16:
          case "end":
            return _context27.stop();
        }
      }
    }, _callee27);
  }));

  return function moveTables(_x58, _x59, _x60) {
    return _ref27.apply(this, arguments);
  };
}();

app.post('/tables', /*#__PURE__*/function () {
  var _ref28 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee28(req, res) {
    var validate_user, result;
    return _regenerator["default"].wrap(function _callee28$(_context28) {
      while (1) {
        switch (_context28.prev = _context28.next) {
          case 0:
            if (!(req.body && !req.body.action)) {
              _context28.next = 3;
              break;
            }

            res.json({
              status: "undefined",
              received: req.query
            });
            return _context28.abrupt("return");

          case 3:
            validate_user = validateUser(req.body.username, req.body.hash);

            if (!validate_user) {
              _context28.next = 23;
              break;
            }

            result = {};
            _context28.t0 = req.body.action;
            _context28.next = _context28.t0 === "remove" ? 9 : _context28.t0 === "move" ? 13 : _context28.t0 === "list" ? 17 : 17;
            break;

          case 9:
            _context28.next = 11;
            return removeTables(JSON.parse(req.body.tablesList), req.body.collection_id);

          case 11:
            result = _context28.sent;
            return _context28.abrupt("break", 17);

          case 13:
            _context28.next = 15;
            return moveTables(JSON.parse(req.body.tablesList), req.body.collection_id, req.body.targetCollectionID);

          case 15:
            result = _context28.sent;
            return _context28.abrupt("break", 17);

          case 17:
            _context28.next = 19;
            return getCollection(req.body.collection_id);

          case 19:
            result = _context28.sent;
            res.json({
              status: "success",
              data: result
            });
            _context28.next = 24;
            break;

          case 23:
            res.json({
              status: "unauthorised",
              payload: null
            });

          case 24:
          case "end":
            return _context28.stop();
        }
      }
    }, _callee28);
  }));

  return function (_x61, _x62) {
    return _ref28.apply(this, arguments);
  };
}());
app.post('/search', /*#__PURE__*/function () {
  var _ref29 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee29(req, res) {
    var bod, type, validate_user, search_results;
    return _regenerator["default"].wrap(function _callee29$(_context29) {
      while (1) {
        switch (_context29.prev = _context29.next) {
          case 0:
            bod = req.body.searchContent;
            type = JSON.parse(req.body.searchType);
            validate_user = validateUser(req.body.username, req.body.hash);

            if (validate_user) {
              search_results = easysearch.search(global.searchIndex, bod);
              console.log("SEARCH: " + search_results.length + " for " + bod);

              if (search_results.length > 100) {
                search_results = search_results.slice(0, 100);
              }

              res.json(search_results);
            } else {
              res.json([]);
            }

          case 4:
          case "end":
            return _context29.stop();
        }
      }
    }, _callee29);
  }));

  return function (_x63, _x64) {
    return _ref29.apply(this, arguments);
  };
}());
app.post('/getTableContent', /*#__PURE__*/function () {
  var _ref30 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee30(req, res) {
    var bod, validate_user, collection_data, tableData, annotation;
    return _regenerator["default"].wrap(function _callee30$(_context30) {
      while (1) {
        switch (_context30.prev = _context30.next) {
          case 0:
            bod = req.body.searchContent;
            validate_user = validateUser(req.body.username, req.body.hash);

            if (!validate_user) {
              _context30.next = 29;
              break;
            }

            _context30.prev = 3;

            if (!(req.body.docid && req.body.page && req.body.collId)) {
              _context30.next = 19;
              break;
            }

            _context30.next = 7;
            return getCollection(req.body.collId);

          case 7:
            collection_data = _context30.sent;
            _context30.next = 10;
            return (0, _table.readyTable)(req.body.docid, req.body.page, req.body.collId, JSON.parse(req.body.enablePrediction));

          case 10:
            tableData = _context30.sent;
            _context30.next = 13;
            return getAnnotationByID(req.body.docid, req.body.page, req.body.collId);

          case 13:
            annotation = _context30.sent;
            // debugger
            tableData.collectionData = collection_data;
            tableData.annotationData = annotation && annotation.rows.length > 0 ? annotation.rows[0] : {};
            res.json(tableData);
            _context30.next = 20;
            break;

          case 19:
            res.json({
              status: "wrong parameters",
              body: req.body
            });

          case 20:
            _context30.next = 27;
            break;

          case 22:
            _context30.prev = 22;
            _context30.t0 = _context30["catch"](3);
            console.log(_context30.t0);
            debugger;
            res.json({
              status: "getTableContent: probably page out of bounds, or document does not exist",
              body: req.body
            });

          case 27:
            _context30.next = 30;
            break;

          case 29:
            res.json([]);

          case 30:
          case "end":
            return _context30.stop();
        }
      }
    }, _callee30, null, [[3, 22]]);
  }));

  return function (_x65, _x66) {
    return _ref30.apply(this, arguments);
  };
}()); ///// Probably vintage from here on.
//
// app.get('/api/allInfo',async function(req,res){
//
//   var labellers = await getMetadataLabellers();
//       labellers = labellers.rows.reduce( (acc,item) => { acc[item.docid+"_"+item.page] = item.labeller; return acc;},{})
//
//   if ( req.query && req.query.collId  ){
//
//     var result = await prepareAvailableDocuments( req.query.collId )
//
//     var available_documents_temp = result.available_documents
//     var abs_index_temp = result.abs_index
//     var DOCS_temp = result.DOCS
//
//         res.send({
//           abs_index : abs_index_temp,
//           total : DOCS_temp.length,
//           available_documents: available_documents_temp,
//           msh_categories: msh_categories,
//           labellers: labellers
//         })
//
//   } else {
//
//         res.send({
//           abs_index,
//           total : DOCS.length,
//           available_documents,
//           msh_categories: msh_categories,
//           labellers: labellers
//         })
//
//   }
//
// });
// Extracts all recommended CUIs from the DB and formats them as per the "recommend_cuis" variable a the bottom of the function.

function getRecommendedCUIS() {
  return _getRecommendedCUIS.apply(this, arguments);
}

function _getRecommendedCUIS() {
  _getRecommendedCUIS = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee57() {
    var cuiRecommend, recommend_cuis, rec_cuis, splitConcepts;
    return _regenerator["default"].wrap(function _callee57$(_context57) {
      while (1) {
        switch (_context57.prev = _context57.next) {
          case 0:
            cuiRecommend = /*#__PURE__*/function () {
              var _ref51 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee56() {
                var client, result;
                return _regenerator["default"].wrap(function _callee56$(_context56) {
                  while (1) {
                    switch (_context56.prev = _context56.next) {
                      case 0:
                        _context56.next = 2;
                        return pool.connect();

                      case 2:
                        client = _context56.sent;
                        _context56.next = 5;
                        return client.query("select * from cuis_recommend");

                      case 5:
                        result = _context56.sent;
                        client.release();
                        return _context56.abrupt("return", result);

                      case 8:
                      case "end":
                        return _context56.stop();
                    }
                  }
                }, _callee56);
              }));

              return function cuiRecommend() {
                return _ref51.apply(this, arguments);
              };
            }();

            recommend_cuis = {};
            _context57.next = 4;
            return cuiRecommend();

          case 4:
            rec_cuis = _context57.sent.rows;

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
            return _context57.abrupt("return", recommend_cuis);

          case 8:
          case "end":
            return _context57.stop();
        }
      }
    }, _callee57);
  }));
  return _getRecommendedCUIS.apply(this, arguments);
}

app.get('/api/cuiRecommend', /*#__PURE__*/function () {
  var _ref31 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee31(req, res) {
    var cuirec;
    return _regenerator["default"].wrap(function _callee31$(_context31) {
      while (1) {
        switch (_context31.prev = _context31.next) {
          case 0:
            _context31.next = 2;
            return getRecommendedCUIS();

          case 2:
            cuirec = _context31.sent;
            res.send(cuirec);

          case 4:
          case "end":
            return _context31.stop();
        }
      }
    }, _callee31);
  }));

  return function (_x67, _x68) {
    return _ref31.apply(this, arguments);
  };
}()); //
//
// app.get('/api/allMetadata', async function(req,res){
//
//   var allMetadataAnnotations = async () => {
//     var client = await pool.connect()
//     var result = await client.query(`select * from metadata`)
//           client.release()
//     return result
//   }
//
//   res.send( await allMetadataAnnotations() )
//
// });

app.get('/api/cuisIndex', /*#__PURE__*/function () {
  var _ref32 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee33(req, res) {
    var getCUISIndex;
    return _regenerator["default"].wrap(function _callee33$(_context33) {
      while (1) {
        switch (_context33.prev = _context33.next) {
          case 0:
            getCUISIndex = /*#__PURE__*/function () {
              var _ref33 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee32() {
                var cuis, client, result;
                return _regenerator["default"].wrap(function _callee32$(_context32) {
                  while (1) {
                    switch (_context32.prev = _context32.next) {
                      case 0:
                        cuis = {};
                        _context32.next = 3;
                        return pool.connect();

                      case 3:
                        client = _context32.sent;
                        _context32.next = 6;
                        return client.query("select * from cuis_index");

                      case 6:
                        result = _context32.sent;
                        client.release();
                        result.rows.map(function (row) {
                          cuis[row.cui] = {
                            preferred: row.preferred,
                            hasMSH: row.hasMSH,
                            userDefined: row.user_defined,
                            adminApproved: row.admin_approved
                          };
                        });
                        return _context32.abrupt("return", cuis);

                      case 10:
                      case "end":
                        return _context32.stop();
                    }
                  }
                }, _callee32);
              }));

              return function getCUISIndex() {
                return _ref33.apply(this, arguments);
              };
            }();

            _context33.t0 = res;
            _context33.next = 4;
            return getCUISIndex();

          case 4:
            _context33.t1 = _context33.sent;

            _context33.t0.send.call(_context33.t0, _context33.t1);

          case 6:
          case "end":
            return _context33.stop();
        }
      }
    }, _callee33);
  }));

  return function (_x69, _x70) {
    return _ref32.apply(this, arguments);
  };
}());
app.get('/api/cuisIndexAdd', /*#__PURE__*/function () {
  var _ref34 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee35(req, res) {
    var insertCUI;
    return _regenerator["default"].wrap(function _callee35$(_context35) {
      while (1) {
        switch (_context35.prev = _context35.next) {
          case 0:
            console.log(JSON.stringify(req.query));

            insertCUI = /*#__PURE__*/function () {
              var _ref35 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee34(cui, preferred, hasMSH) {
                var client, done;
                return _regenerator["default"].wrap(function _callee34$(_context34) {
                  while (1) {
                    switch (_context34.prev = _context34.next) {
                      case 0:
                        _context34.next = 2;
                        return pool.connect();

                      case 2:
                        client = _context34.sent;
                        _context34.next = 5;
                        return client.query('INSERT INTO cuis_index(cui,preferred,"hasMSH",user_defined,admin_approved) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (cui) DO UPDATE SET preferred = $2, "hasMSH" = $3, user_defined = $4, admin_approved = $5', [cui, preferred, hasMSH, true, false]).then(function (result) {
                          return console.log("insert: " + new Date());
                        })["catch"](function (e) {
                          return console.error(e.stack);
                        }).then(function () {
                          return client.release();
                        });

                      case 5:
                        done = _context34.sent;

                      case 6:
                      case "end":
                        return _context34.stop();
                    }
                  }
                }, _callee34);
              }));

              return function insertCUI(_x73, _x74, _x75) {
                return _ref35.apply(this, arguments);
              };
            }();

            if (!(req.query && req.query.cui.length > 0 && req.query.preferred.length > 0 && req.query.hasMSH.length > 0)) {
              _context35.next = 5;
              break;
            }

            _context35.next = 5;
            return insertCUI(req.query.cui, req.query.preferred, req.query.hasMSH);

          case 5:
            res.send("saved annotation: " + JSON.stringify(req.query));

          case 6:
          case "end":
            return _context35.stop();
        }
      }
    }, _callee35);
  }));

  return function (_x71, _x72) {
    return _ref34.apply(this, arguments);
  };
}()); // Generates the results table live preview, connecting to the R API.

app.post('/annotationPreview', /*#__PURE__*/function () {
  var _ref36 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee38(req, res) {
    var bod, validate_user, annotations, tid, client, tableResult, final_annotations, r, ann, existing, final_annotations_array, entry;
    return _regenerator["default"].wrap(function _callee38$(_context38) {
      while (1) {
        switch (_context38.prev = _context38.next) {
          case 0:
            bod = req.body.searchContent;
            validate_user = validateUser(req.body.username, req.body.hash);

            if (!validate_user) {
              _context38.next = 40;
              break;
            }

            _context38.prev = 3;

            if (!(req.body.docid && req.body.page && req.body.collId)) {
              _context38.next = 31;
              break;
            }

            _context38.next = 7;
            return getAnnotationByID(req.body.docid, req.body.page, req.body.collId);

          case 7:
            annotations = _context38.sent;
            tid = annotations.rows.length > 0 ? annotations.rows[0].tid : -1;

            if (!(tid < 0)) {
              _context38.next = 12;
              break;
            }

            res.json({
              status: "wrong parameters (missing tid)",
              body: req.body
            });
            return _context38.abrupt("return");

          case 12:
            _context38.next = 14;
            return pool.connect();

          case 14:
            client = _context38.sent;
            _context38.next = 17;
            return client.query("SELECT tid, \"tableResult\" FROM result WHERE tid = $1", [tid]);

          case 17:
            tableResult = _context38.sent;
            client.release();
            tableResult = tableResult && tableResult.rows.length > 0 ? tableResult.rows[0].tableResult : [];

            if (!(req.body.cachedOnly === 'true')) {
              _context38.next = 24;
              break;
            }

            // debugger
            if (tableResult.length > 0) {
              res.json({
                "state": "good",
                result: tableResult
              });
            } else {
              res.json({
                "state": "good",
                result: []
              });
            }

            console.log("Fast reload: " + req.body.docid + " - " + req.body.page + " - " + req.body.collId);
            return _context38.abrupt("return");

          case 24:
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

            if (final_annotations_array.length > 0) {
              entry = final_annotations_array[0];
              entry.annotation = entry.annotation.annotations.map(function (v, i) {
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
              request({
                url: 'http://localhost:6666/preview',
                method: "POST",
                json: {
                  anns: entry,
                  collId: req.body.collId
                }
              }, /*#__PURE__*/function () {
                var _ref37 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee37(error, response, body) {
                  var insertResult;
                  return _regenerator["default"].wrap(function _callee37$(_context37) {
                    while (1) {
                      switch (_context37.prev = _context37.next) {
                        case 0:
                          // debugger
                          insertResult = /*#__PURE__*/function () {
                            var _ref38 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee36(tid, tableResult) {
                              var client, done;
                              return _regenerator["default"].wrap(function _callee36$(_context36) {
                                while (1) {
                                  switch (_context36.prev = _context36.next) {
                                    case 0:
                                      _context36.next = 2;
                                      return pool.connect();

                                    case 2:
                                      client = _context36.sent;
                                      _context36.next = 5;
                                      return client.query('INSERT INTO result(tid, "tableResult") VALUES ($1, $2) ON CONFLICT (tid) DO UPDATE SET "tableResult" = $2', [tid, tableResult]).then(function (result) {
                                        return console.log("insert result: " + new Date());
                                      })["catch"](function (e) {
                                        return console.error(e.stack);
                                      }).then(function () {
                                        return client.release();
                                      });

                                    case 5:
                                      done = _context36.sent;

                                    case 6:
                                    case "end":
                                      return _context36.stop();
                                  }
                                }
                              }, _callee36);
                            }));

                            return function insertResult(_x81, _x82) {
                              return _ref38.apply(this, arguments);
                            };
                          }();

                          if (!(body.tableResult && body.tableResult.length > 0)) {
                            _context37.next = 4;
                            break;
                          }

                          _context37.next = 4;
                          return insertResult(body.ann.tid[0], body.tableResult);

                        case 4:
                          // res.json( {"state" : "good", result : body.tableResult, "anns" : body.ann} )
                          console.log("tableresults: " + body.tableResult.length);
                          res.json({
                            "state": "good",
                            result: body.tableResult
                          });

                        case 6:
                        case "end":
                          return _context37.stop();
                      }
                    }
                  }, _callee37);
                }));

                return function (_x78, _x79, _x80) {
                  return _ref37.apply(this, arguments);
                };
              }()); // res.json( {"state" : "good2", result : body.tableResult} )
            } else {
              res.json({
                "state": "empty"
              });
            }

            _context38.next = 32;
            break;

          case 31:
            res.json({
              status: "wrong parameters",
              body: req.body
            });

          case 32:
            _context38.next = 38;
            break;

          case 34:
            _context38.prev = 34;
            _context38.t0 = _context38["catch"](3);
            console.log(_context38.t0);
            res.json({
              status: "annotationPreview : probably page out of bounds, or document does not exist",
              body: req.body
            });

          case 38:
            _context38.next = 41;
            break;

          case 40:
            res.json([]);

          case 41:
          case "end":
            return _context38.stop();
        }
      }
    }, _callee38, null, [[3, 34]]);
  }));

  return function (_x76, _x77) {
    return _ref36.apply(this, arguments);
  };
}()); // Returns all annotations for all document/tables.

app.get('/api/formattedResults', /*#__PURE__*/function () {
  var _ref39 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee39(req, res) {
    var results, finalResults, r, ann, existing, finalResults_array, formattedRes;
    return _regenerator["default"].wrap(function _callee39$(_context39) {
      while (1) {
        switch (_context39.prev = _context39.next) {
          case 0:
            _context39.next = 2;
            return (0, _network_functions.getAnnotationResults)();

          case 2:
            results = _context39.sent;

            if (results) {
              finalResults = {};
              /**
              * There are multiple versions of the annotations. When calling reading the results from the database, here we will return only the latest/ most complete version of the annotation.
              * Independently from the author of it. Completeness here measured as the result with the highest number of annotations and the highest index number (I.e. Newest, but only if it has more information/annotations).
              * May not be the best in some cases.
              *
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
            return _context39.stop();
        }
      }
    }, _callee39);
  }));

  return function (_x83, _x84) {
    return _ref39.apply(this, arguments);
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
  var _ref40 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee40(phrase) {
    var result, mm_match, r;
    return _regenerator["default"].wrap(function _callee40$(_context40) {
      while (1) {
        switch (_context40.prev = _context40.next) {
          case 0:
            console.log("Asking MM for: " + phrase);
            result = new Promise(function (resolve, reject) {
              request.post({
                headers: {
                  'content-type': 'application/x-www-form-urlencoded'
                },
                url: 'http://localhost:8080/form',
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
            _context40.next = 4;
            return result;

          case 4:
            mm_match = _context40.sent;
            _context40.prev = 5;
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
            return _context40.abrupt("return", r);

          case 12:
            _context40.prev = 12;
            _context40.t0 = _context40["catch"](5);
            return _context40.abrupt("return", []);

          case 15:
          case "end":
            return _context40.stop();
        }
      }
    }, _callee40, null, [[5, 12]]);
  }));

  return function getMMatch(_x85) {
    return _ref40.apply(this, arguments);
  };
}();

app.post('/getMMatch', /*#__PURE__*/function () {
  var _ref41 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee41(req, res) {
    var mm_match;
    return _regenerator["default"].wrap(function _callee41$(_context41) {
      while (1) {
        switch (_context41.prev = _context41.next) {
          case 0:
            _context41.prev = 0;

            if (!(req.body && req.body.phrase)) {
              _context41.next = 8;
              break;
            }

            _context41.next = 4;
            return getMMatch(req.query.phrase);

          case 4:
            mm_match = _context41.sent;
            res.send(mm_match);
            _context41.next = 9;
            break;

          case 8:
            res.send({
              status: "wrong parameters",
              query: req.query
            });

          case 9:
            _context41.next = 14;
            break;

          case 11:
            _context41.prev = 11;
            _context41.t0 = _context41["catch"](0);
            console.log(_context41.t0);

          case 14:
          case "end":
            return _context41.stop();
        }
      }
    }, _callee41, null, [[0, 11]]);
  }));

  return function (_x86, _x87) {
    return _ref41.apply(this, arguments);
  };
}());
app.get('/api/getMMatch', /*#__PURE__*/function () {
  var _ref42 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee42(req, res) {
    var mm_match;
    return _regenerator["default"].wrap(function _callee42$(_context42) {
      while (1) {
        switch (_context42.prev = _context42.next) {
          case 0:
            _context42.prev = 0;

            if (!(req.query && req.query.phrase)) {
              _context42.next = 8;
              break;
            }

            _context42.next = 4;
            return getMMatch(req.query.phrase);

          case 4:
            mm_match = _context42.sent;
            res.send(mm_match);
            _context42.next = 9;
            break;

          case 8:
            res.send({
              status: "wrong parameters",
              query: req.query
            });

          case 9:
            _context42.next = 14;
            break;

          case 11:
            _context42.prev = 11;
            _context42.t0 = _context42["catch"](0);
            console.log(_context42.t0);

          case 14:
          case "end":
            return _context42.stop();
        }
      }
    }, _callee42, null, [[0, 11]]);
  }));

  return function (_x88, _x89) {
    return _ref42.apply(this, arguments);
  };
}());
app.post('/notes', /*#__PURE__*/function () {
  var _ref43 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee44(req, res) {
    var validate_user, notesData, updateNotes;
    return _regenerator["default"].wrap(function _callee44$(_context44) {
      while (1) {
        switch (_context44.prev = _context44.next) {
          case 0:
            if (!(req.body && !req.body.action)) {
              _context44.next = 3;
              break;
            }

            res.json({
              status: "undefined",
              received: req.query
            });
            return _context44.abrupt("return");

          case 3:
            validate_user = validateUser(req.body.username, req.body.hash);

            if (!validate_user) {
              _context44.next = 12;
              break;
            }

            notesData = JSON.parse(req.body.payload);

            updateNotes = /*#__PURE__*/function () {
              var _ref44 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee43(docid, page, collid, notes, tableType, completion) {
                var client, done;
                return _regenerator["default"].wrap(function _callee43$(_context43) {
                  while (1) {
                    switch (_context43.prev = _context43.next) {
                      case 0:
                        _context43.next = 2;
                        return pool.connect();

                      case 2:
                        client = _context43.sent;
                        _context43.next = 5;
                        return client.query('UPDATE public."table" SET notes=$4, "tableType"=$5, completion=$6 WHERE docid=$1 AND page=$2 AND collection_id=$3', [docid, page, collid, notes, tableType, completion]).then(function (result) {
                          return console.log("Updated records for " + req.body.docid + "_" + req.body.page + "_" + req.body.collId + " result: " + new Date());
                        })["catch"](function (e) {
                          return console.error(e.stack);
                        }).then(function () {
                          return client.release();
                        });

                      case 5:
                        done = _context43.sent;

                      case 6:
                      case "end":
                        return _context43.stop();
                    }
                  }
                }, _callee43);
              }));

              return function updateNotes(_x92, _x93, _x94, _x95, _x96, _x97) {
                return _ref44.apply(this, arguments);
              };
            }();

            _context44.next = 9;
            return updateNotes(req.body.docid, req.body.page, req.body.collId, notesData.textNotes, notesData.tableType, notesData.tableStatus);

          case 9:
            res.json({
              status: "Successful",
              payload: null
            });
            _context44.next = 13;
            break;

          case 12:
            res.json({
              status: "unauthorised",
              payload: null
            });

          case 13:
          case "end":
            return _context44.stop();
        }
      }
    }, _callee44);
  }));

  return function (_x90, _x91) {
    return _ref43.apply(this, arguments);
  };
}()); // POST method route

app.post('/text', /*#__PURE__*/function () {
  var _ref45 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee45(req, res) {
    var validate_user, result, folder_exists, titleText, bodyText, start_body_index, last_body_index, body, completeFile;
    return _regenerator["default"].wrap(function _callee45$(_context45) {
      while (1) {
        switch (_context45.prev = _context45.next) {
          case 0:
            if (!(req.body && !req.body.action)) {
              _context45.next = 3;
              break;
            }

            res.json({
              status: "undefined",
              received: req.query
            });
            return _context45.abrupt("return");

          case 3:
            validate_user = validateUser(req.body.username, req.body.hash);

            if (!validate_user) {
              _context45.next = 18;
              break;
            }

            _context45.next = 7;
            return fs.existsSync(path.join(global.tables_folder_override, req.body.collId));

          case 7:
            folder_exists = _context45.sent;

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
            _context45.next = 19;
            break;

          case 18:
            res.json({
              status: "unauthorised",
              payload: null
            });

          case 19:
          case "end":
            return _context45.stop();
        }
      }
    }, _callee45);
  }));

  return function (_x98, _x99) {
    return _ref45.apply(this, arguments);
  };
}());
app.get('/api/removeOverrideTable', /*#__PURE__*/function () {
  var _ref46 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee46(req, res) {
    var file_exists;
    return _regenerator["default"].wrap(function _callee46$(_context46) {
      while (1) {
        switch (_context46.prev = _context46.next) {
          case 0:
            if (!(req.query && req.query.docid && req.query.page)) {
              _context46.next = 8;
              break;
            }

            _context46.next = 3;
            return fs.existsSync(global.tables_folder_override + "/" + req.query.docid + "_" + req.query.page + ".html");

          case 3:
            file_exists = _context46.sent;

            if (file_exists) {
              fs.unlink(global.tables_folder_override + "/" + req.query.docid + "_" + req.query.page + ".html", function (err) {
                if (err) throw err;
                console.log("REMOVED : " + global.tables_folder_override + "/" + req.query.docid + "_" + req.query.page + ".html");
              });
            }

            res.send({
              status: "override removed"
            });
            _context46.next = 9;
            break;

          case 8:
            res.send({
              status: "no changes"
            });

          case 9:
          case "end":
            return _context46.stop();
        }
      }
    }, _callee46);
  }));

  return function (_x100, _x101) {
    return _ref46.apply(this, arguments);
  };
}());
app.get('/api/classify', /*#__PURE__*/function () {
  var _ref47 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee47(req, res) {
    return _regenerator["default"].wrap(function _callee47$(_context47) {
      while (1) {
        switch (_context47.prev = _context47.next) {
          case 0:
            if (!(req.query && req.query.terms)) {
              _context47.next = 8;
              break;
            }

            console.log(req.query.terms);
            _context47.t0 = res;
            _context47.next = 5;
            return classify(req.query.terms.split(","));

          case 5:
            _context47.t1 = _context47.sent;
            _context47.t2 = {
              results: _context47.t1
            };

            _context47.t0.send.call(_context47.t0, _context47.t2);

          case 8:
          case "end":
            return _context47.stop();
        }
      }
    }, _callee47);
  }));

  return function (_x102, _x103) {
    return _ref47.apply(this, arguments);
  };
}());
app.get('/api/getTable', /*#__PURE__*/function () {
  var _ref48 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee48(req, res) {
    var tableData;
    return _regenerator["default"].wrap(function _callee48$(_context48) {
      while (1) {
        switch (_context48.prev = _context48.next) {
          case 0:
            _context48.prev = 0;

            if (!(req.query && req.query.docid && req.query.page && req.query.collId)) {
              _context48.next = 8;
              break;
            }

            _context48.next = 4;
            return (0, _table.readyTable)(req.query.docid, req.query.page, req.query.collId, false);

          case 4:
            tableData = _context48.sent;
            res.send(tableData);
            _context48.next = 9;
            break;

          case 8:
            res.send({
              status: "wrong parameters",
              query: req.query
            });

          case 9:
            _context48.next = 15;
            break;

          case 11:
            _context48.prev = 11;
            _context48.t0 = _context48["catch"](0);
            console.log(_context48.t0);
            res.send({
              status: "getTable: probably page out of bounds, or document does not exist",
              query: req.query
            });

          case 15:
          case "end":
            return _context48.stop();
        }
      }
    }, _callee48, null, [[0, 11]]);
  }));

  return function (_x104, _x105) {
    return _ref48.apply(this, arguments);
  };
}()); //
// app.get('/api/getAvailableTables',function(req,res){
//   res.send(available_documents)
// });
//
// app.get('/api/getAnnotations',async function(req,res){
//   res.send( await getAnnotationResults() )
// });
//
//
// app.get('/api/deleteAnnotation', async function(req,res){
//
//   var deleteAnnotation = async (docid, page, user) => {
//       var client = await pool.connect()
//
//       var done = await client.query('DELETE FROM annotations WHERE docid = $1 AND page = $2 AND "user" = $3', [docid, page, user ])
//         .then(result => console.log("Annotation deleted: "+ new Date()))
//         .catch(e => console.error(e.stack))
//         .then(() => client.release())
//   }
//
//   if ( req.query && req.query.docid && req.query.page && req.query.user){
//     await deleteAnnotation(req.query.docid , req.query.page, req.query.user)
//     res.send("done")
//   } else {
//     res.send("delete failed");
//   }
//
// });
//
//
// app.get('/api/getAnnotationByID',async function(req,res){
//
//   if(req.query && req.query.docid && req.query.docid.length > 0 ){
//     var page = req.query.page && (req.query.page.length > 0) ? req.query.page : 1
//     var user = req.query.user && (req.query.user.length > 0) ? req.query.user : ""
//     var collId = req.query.collId && (req.query.collId.length > 0) ? req.query.collId : ""
//
//     var annotations = await getAnnotationByID(req.query.docid,page,collId)
//
//     var final_annotations = {}
//
//     if( annotations.rows.length > 0){ // Should really be just one.
//         var entry = annotations.rows[annotations.rows.length-1]
//         res.send( entry )
//     } else {
//         res.send( {} )
//     }
//
//   } else{
//     res.send( {error:"failed request"} )
//   }
//
// });

app.post('/saveAnnotation', /*#__PURE__*/function () {
  var _ref49 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee50(req, res) {
    var validate_user, insertAnnotation, annotationData;
    return _regenerator["default"].wrap(function _callee50$(_context50) {
      while (1) {
        switch (_context50.prev = _context50.next) {
          case 0:
            if (!(req.body && !req.body.action)) {
              _context50.next = 3;
              break;
            }

            res.json({
              status: "undefined",
              received: req.query
            });
            return _context50.abrupt("return");

          case 3:
            validate_user = validateUser(req.body.username, req.body.hash);

            if (!validate_user) {
              _context50.next = 14;
              break;
            }

            console.log("Recording Annotation: " + req.body.docid + "_" + req.body.page + "_" + req.body.collId);

            insertAnnotation = /*#__PURE__*/function () {
              var _ref50 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee49(tid, annotation) {
                var client, done;
                return _regenerator["default"].wrap(function _callee49$(_context49) {
                  while (1) {
                    switch (_context49.prev = _context49.next) {
                      case 0:
                        _context49.next = 2;
                        return pool.connect();

                      case 2:
                        client = _context49.sent;
                        _context49.next = 5;
                        return client.query('INSERT INTO annotations VALUES($2,$1) ON CONFLICT (tid) DO UPDATE SET annotation = $2;', [tid, annotation]).then(function (result) {
                          return console.log("Updated Annotations for " + tid + " : " + new Date());
                        })["catch"](function (e) {
                          return console.error(e.stack);
                        }).then(function () {
                          return client.release();
                        });

                      case 5:
                        done = _context49.sent;

                      case 6:
                      case "end":
                        return _context49.stop();
                    }
                  }
                }, _callee49);
              }));

              return function insertAnnotation(_x108, _x109) {
                return _ref50.apply(this, arguments);
              };
            }();

            annotationData = JSON.parse(req.body.payload); // debugger

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
            _context50.next = 11;
            return insertAnnotation(annotationData.tid, {
              annotations: annotationData.annotations
            });

          case 11:
            res.json({
              status: "success",
              payload: ""
            });
            _context50.next = 15;
            break;

          case 14:
            res.json({
              status: "unauthorised",
              payload: null
            });

          case 15:
          case "end":
            return _context50.stop();
        }
      }
    }, _callee50);
  }));

  return function (_x106, _x107) {
    return _ref49.apply(this, arguments);
  };
}());
app.listen(CONFIG.port, function () {
  console.log('Table Tidier Server running on port ' + CONFIG.port + ' ' + new Date().toISOString());
});