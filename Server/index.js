"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

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
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/pdfs', express.static(path.join(__dirname, 'pdfs')));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.use(require('body-parser').urlencoded({
  extended: true
}));
app.use(_security.default.initialize());
app.post('/login', function (req, res, next) {
  _security.default.authenticate('custom', function (err, user, info) {
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
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.post('/api/createUser',
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee(req, res) {
    var result;
    return _regenerator.default.wrap(function _callee$(_context) {
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
    }, _callee, this, [[0, 7]]);
  }));

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
}());
app.get('/api/test',
/*#__PURE__*/
function () {
  var _ref2 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(req, res) {
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            res.send("testing this worked!");

          case 1:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function (_x3, _x4) {
    return _ref2.apply(this, arguments);
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
var upload = multer({
  storage: storage
});
app.post('/api/tableUploader', upload.array('fileNames'),
/*#__PURE__*/
function () {
  var _ref3 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee3(req, res) {
    var uploaded_files, f;
    return _regenerator.default.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            uploaded_files = [];

            for (f in req.files) {
              uploaded_files.push(req.files[f].originalname);
            }

            res.json({
              status: "test",
              payload: uploaded_files
            });
            res.end();

          case 4:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this);
  }));

  return function (_x5, _x6) {
    return _ref3.apply(this, arguments);
  };
}());

function UMLSData() {
  return _UMLSData.apply(this, arguments);
}

function _UMLSData() {
  _UMLSData = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee47() {
    var semtypes, cui_def, cui_concept;
    return _regenerator.default.wrap(function _callee47$(_context47) {
      while (1) {
        switch (_context47.prev = _context47.next) {
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
            _context47.next = 3;
            return semtypes;

          case 3:
            semtypes = _context47.sent;
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
            _context47.next = 7;
            return cui_def;

          case 7:
            cui_def = _context47.sent;
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
            _context47.next = 11;
            return cui_concept;

          case 11:
            cui_concept = _context47.sent;
            return _context47.abrupt("return", {
              semtypes: semtypes,
              cui_def: cui_def,
              cui_concept: cui_concept
            });

          case 13:
          case "end":
            return _context47.stop();
        }
      }
    }, _callee47, this);
  }));
  return _UMLSData.apply(this, arguments);
}

function CUIData() {
  return _CUIData.apply(this, arguments);
} // Gets the labellers associated w ith each document/table.


function _CUIData() {
  _CUIData = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee48() {
    var umlsData, results, rres;
    return _regenerator.default.wrap(function _callee48$(_context48) {
      while (1) {
        switch (_context48.prev = _context48.next) {
          case 0:
            _context48.next = 2;
            return UMLSData();

          case 2:
            umlsData = _context48.sent;
            _context48.next = 5;
            return (0, _network_functions.getAnnotationResults)();

          case 5:
            results = _context48.sent;
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
            return _context48.abrupt("return", {
              cui_def: umlsData.cui_def,
              cui_concept: umlsData.cui_concept,
              actual_results: rres,
              semtypes: umlsData.semtypes
            });

          case 8:
          case "end":
            return _context48.stop();
        }
      }
    }, _callee48, this);
  }));
  return _CUIData.apply(this, arguments);
}

function getMetadataLabellers() {
  return _getMetadataLabellers.apply(this, arguments);
} // Returns the annotation for a single document/table


function _getMetadataLabellers() {
  _getMetadataLabellers = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee49() {
    var client, result;
    return _regenerator.default.wrap(function _callee49$(_context49) {
      while (1) {
        switch (_context49.prev = _context49.next) {
          case 0:
            _context49.next = 2;
            return pool.connect();

          case 2:
            client = _context49.sent;
            _context49.next = 5;
            return client.query("select distinct docid, page, labeller from metadata");

          case 5:
            result = _context49.sent;
            client.release();
            return _context49.abrupt("return", result);

          case 8:
          case "end":
            return _context49.stop();
        }
      }
    }, _callee49, this);
  }));
  return _getMetadataLabellers.apply(this, arguments);
}

function getAnnotationByID(_x7, _x8, _x9) {
  return _getAnnotationByID.apply(this, arguments);
} // preinitialisation of components if needed.


function _getAnnotationByID() {
  _getAnnotationByID = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee50(docid, page, user) {
    var client, result;
    return _regenerator.default.wrap(function _callee50$(_context50) {
      while (1) {
        switch (_context50.prev = _context50.next) {
          case 0:
            _context50.next = 2;
            return pool.connect();

          case 2:
            client = _context50.sent;
            _context50.next = 5;
            return client.query('select * from annotations where docid=$1 AND page=$2 AND "user"=$3 order by docid desc,page asc', [docid, page, user]);

          case 5:
            result = _context50.sent;
            client.release();
            return _context50.abrupt("return", result);

          case 8:
          case "end":
            return _context50.stop();
        }
      }
    }, _callee50, this);
  }));
  return _getAnnotationByID.apply(this, arguments);
}

function main() {
  return _main.apply(this, arguments);
}

function _main() {
  _main = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee51() {
    return _regenerator.default.wrap(function _callee51$(_context51) {
      while (1) {
        switch (_context51.prev = _context51.next) {
          case 0:
            _context51.next = 2;
            return easysearch.indexFolder([path.join(process.cwd(), global.tables_folder), path.join(process.cwd(), global.tables_folder_override)]);

          case 2:
            global.searchIndex = _context51.sent;
            _context51.next = 5;
            return UMLSData();

          case 5:
            umls_data_buffer = _context51.sent;
            _context51.next = 8;
            return (0, _files.refreshDocuments)();

          case 8:
            _context51.next = 10;
            return (0, _security.initialiseUsers)();

          case 10:
          case "end":
            return _context51.stop();
        }
      }
    }, _callee51, this);
  }));
  return _main.apply(this, arguments);
}

main();
app.get('/api/deleteTable',
/*#__PURE__*/
function () {
  var _ref4 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee4(req, res) {
    var filename, delprom;
    return _regenerator.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            if (!(req.query && req.query.docid && req.query.page)) {
              _context4.next = 10;
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
            _context4.next = 5;
            return delprom;

          case 5:
            _context4.next = 7;
            return (0, _files.refreshDocuments)();

          case 7:
            res.send("table deleted");
            _context4.next = 11;
            break;

          case 10:
            res.send("table not deleted");

          case 11:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function (_x10, _x11) {
    return _ref4.apply(this, arguments);
  };
}());
app.get('/api/recoverTable',
/*#__PURE__*/
function () {
  var _ref5 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee5(req, res) {
    var filename;
    return _regenerator.default.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
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
            return _context5.stop();
        }
      }
    }, _callee5, this);
  }));

  return function (_x12, _x13) {
    return _ref5.apply(this, arguments);
  };
}());
app.get('/api/listDeletedTables',
/*#__PURE__*/
function () {
  var _ref6 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee6(req, res) {
    return _regenerator.default.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
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
            return _context6.stop();
        }
      }
    }, _callee6, this);
  }));

  return function (_x14, _x15) {
    return _ref6.apply(this, arguments);
  };
}());
app.get('/api/modifyCUIData',
/*#__PURE__*/
function () {
  var _ref7 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee8(req, res) {
    var modifyCUIData, result;
    return _regenerator.default.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            modifyCUIData =
            /*#__PURE__*/
            function () {
              var _ref8 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee7(cui, preferred, adminApproved, prevcui) {
                var client, result, q;
                return _regenerator.default.wrap(function _callee7$(_context7) {
                  while (1) {
                    switch (_context7.prev = _context7.next) {
                      case 0:
                        _context7.next = 2;
                        return pool.connect();

                      case 2:
                        client = _context7.sent;
                        _context7.next = 5;
                        return client.query("UPDATE cuis_index SET cui=$1, preferred=$2, admin_approved=$3 WHERE cui = $4", [cui, preferred, adminApproved, prevcui]);

                      case 5:
                        result = _context7.sent;

                        if (!(result && result.rowCount)) {
                          _context7.next = 11;
                          break;
                        }

                        q = new Query("UPDATE metadata SET cuis = array_to_string(array_replace(regexp_split_to_array(cuis, ';'), $2, $1), ';'), cuis_selected = array_to_string(array_replace(regexp_split_to_array(cuis_selected, ';'), $2, $1), ';')", [cui, prevcui]);
                        _context7.next = 10;
                        return client.query(q);

                      case 10:
                        result = _context7.sent;

                      case 11:
                        client.release();
                        return _context7.abrupt("return", result);

                      case 13:
                      case "end":
                        return _context7.stop();
                    }
                  }
                }, _callee7, this);
              }));

              return function modifyCUIData(_x18, _x19, _x20, _x21) {
                return _ref8.apply(this, arguments);
              };
            }();

            if (!(req.query && req.query.cui && req.query.preferred && req.query.adminApproved && req.query.prevcui)) {
              _context8.next = 8;
              break;
            }

            _context8.next = 4;
            return modifyCUIData(req.query.cui, req.query.preferred, req.query.adminApproved, req.query.prevcui);

          case 4:
            result = _context8.sent;
            res.send(result);
            _context8.next = 9;
            break;

          case 8:
            res.send("UPDATE failed");

          case 9:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8, this);
  }));

  return function (_x16, _x17) {
    return _ref7.apply(this, arguments);
  };
}());
app.get('/api/cuiDeleteIndex',
/*#__PURE__*/
function () {
  var _ref9 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee10(req, res) {
    var cuiDeleteIndex;
    return _regenerator.default.wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            cuiDeleteIndex =
            /*#__PURE__*/
            function () {
              var _ref10 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee9(cui) {
                var client, done;
                return _regenerator.default.wrap(function _callee9$(_context9) {
                  while (1) {
                    switch (_context9.prev = _context9.next) {
                      case 0:
                        _context9.next = 2;
                        return pool.connect();

                      case 2:
                        client = _context9.sent;
                        _context9.next = 5;
                        return client.query('delete from cuis_index where cui = $1', [cui]).then(function (result) {
                          return console.log("deleted: " + new Date());
                        }).catch(function (e) {
                          return console.error(e.stack);
                        }).then(function () {
                          return client.release();
                        });

                      case 5:
                        done = _context9.sent;

                      case 6:
                      case "end":
                        return _context9.stop();
                    }
                  }
                }, _callee9, this);
              }));

              return function cuiDeleteIndex(_x24) {
                return _ref10.apply(this, arguments);
              };
            }();

            if (!(req.query && req.query.cui)) {
              _context10.next = 7;
              break;
            }

            _context10.next = 4;
            return cuiDeleteIndex(req.query.cui);

          case 4:
            res.send("done");
            _context10.next = 8;
            break;

          case 7:
            res.send("clear failed");

          case 8:
          case "end":
            return _context10.stop();
        }
      }
    }, _callee10, this);
  }));

  return function (_x22, _x23) {
    return _ref9.apply(this, arguments);
  };
}());
app.get('/api/getMetadataForCUI',
/*#__PURE__*/
function () {
  var _ref11 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee12(req, res) {
    var getCuiTables, meta;
    return _regenerator.default.wrap(function _callee12$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:
            getCuiTables =
            /*#__PURE__*/
            function () {
              var _ref12 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee11(cui) {
                var client, result;
                return _regenerator.default.wrap(function _callee11$(_context11) {
                  while (1) {
                    switch (_context11.prev = _context11.next) {
                      case 0:
                        _context11.next = 2;
                        return pool.connect();

                      case 2:
                        client = _context11.sent;
                        _context11.next = 5;
                        return client.query("select docid,page,\"user\" from metadata where cuis like $1 ", ["%" + cui + "%"]);

                      case 5:
                        result = _context11.sent;
                        client.release();
                        return _context11.abrupt("return", result);

                      case 8:
                      case "end":
                        return _context11.stop();
                    }
                  }
                }, _callee11, this);
              }));

              return function getCuiTables(_x27) {
                return _ref12.apply(this, arguments);
              };
            }();

            if (!(req.query && req.query.cui)) {
              _context12.next = 8;
              break;
            }

            _context12.next = 4;
            return getCuiTables(req.query.cui);

          case 4:
            meta = _context12.sent;
            res.send(meta);
            _context12.next = 9;
            break;

          case 8:
            res.send("clear failed");

          case 9:
          case "end":
            return _context12.stop();
        }
      }
    }, _callee12, this);
  }));

  return function (_x25, _x26) {
    return _ref11.apply(this, arguments);
  };
}());
app.get('/api/clearMetadata',
/*#__PURE__*/
function () {
  var _ref13 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee14(req, res) {
    var setMetadata;
    return _regenerator.default.wrap(function _callee14$(_context14) {
      while (1) {
        switch (_context14.prev = _context14.next) {
          case 0:
            setMetadata =
            /*#__PURE__*/
            function () {
              var _ref14 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee13(docid, page, user) {
                var client, done;
                return _regenerator.default.wrap(function _callee13$(_context13) {
                  while (1) {
                    switch (_context13.prev = _context13.next) {
                      case 0:
                        _context13.next = 2;
                        return pool.connect();

                      case 2:
                        client = _context13.sent;
                        _context13.next = 5;
                        return client.query('DELETE FROM metadata WHERE docid = $1 AND page = $2 AND "user" = $3', [docid, page, user]).then(function (result) {
                          return console.log("deleted: " + new Date());
                        }).catch(function (e) {
                          return console.error(e.stack);
                        }).then(function () {
                          return client.release();
                        });

                      case 5:
                        done = _context13.sent;

                      case 6:
                      case "end":
                        return _context13.stop();
                    }
                  }
                }, _callee13, this);
              }));

              return function setMetadata(_x30, _x31, _x32) {
                return _ref14.apply(this, arguments);
              };
            }();

            if (!(req.query && req.query.docid && req.query.page && req.query.user)) {
              _context14.next = 7;
              break;
            }

            _context14.next = 4;
            return setMetadata(req.query.docid, req.query.page, req.query.user);

          case 4:
            res.send("done");
            _context14.next = 8;
            break;

          case 7:
            res.send("clear failed");

          case 8:
          case "end":
            return _context14.stop();
        }
      }
    }, _callee14, this);
  }));

  return function (_x28, _x29) {
    return _ref13.apply(this, arguments);
  };
}());
app.get('/api/setMetadata',
/*#__PURE__*/
function () {
  var _ref15 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee16(req, res) {
    var setMetadata;
    return _regenerator.default.wrap(function _callee16$(_context16) {
      while (1) {
        switch (_context16.prev = _context16.next) {
          case 0:
            // Setting the Metadata. The Metadata includes the labelling of terms in headings by assigning CUIs.
            setMetadata =
            /*#__PURE__*/
            function () {
              var _ref16 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee15(docid, page, concept, cuis, qualifiers, cuis_selected, qualifiers_selected, user, istitle, labeller) {
                var client, done;
                return _regenerator.default.wrap(function _callee15$(_context15) {
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
                        }).catch(function (e) {
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
                }, _callee15, this);
              }));

              return function setMetadata(_x35, _x36, _x37, _x38, _x39, _x40, _x41, _x42, _x43, _x44) {
                return _ref16.apply(this, arguments);
              };
            }();

            if (!(req.query && req.query.docid && req.query.page && req.query.concept && req.query.user)) {
              _context16.next = 7;
              break;
            }

            _context16.next = 4;
            return setMetadata(req.query.docid, req.query.page, req.query.concept, req.query.cuis || "", req.query.qualifiers || "", req.query.cuis_selected || "", req.query.qualifiers_selected || "", req.query.user, req.query.istitle, req.query.labeller);

          case 4:
            res.send("done");
            _context16.next = 8;
            break;

          case 7:
            res.send("insert failed");

          case 8:
          case "end":
            return _context16.stop();
        }
      }
    }, _callee16, this);
  }));

  return function (_x33, _x34) {
    return _ref15.apply(this, arguments);
  };
}());
app.get('/api/getMetadata',
/*#__PURE__*/
function () {
  var _ref17 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee18(req, res) {
    var getMetadata;
    return _regenerator.default.wrap(function _callee18$(_context18) {
      while (1) {
        switch (_context18.prev = _context18.next) {
          case 0:
            getMetadata =
            /*#__PURE__*/
            function () {
              var _ref18 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee17(docid, page, user) {
                var client, result;
                return _regenerator.default.wrap(function _callee17$(_context17) {
                  while (1) {
                    switch (_context17.prev = _context17.next) {
                      case 0:
                        _context17.next = 2;
                        return pool.connect();

                      case 2:
                        client = _context17.sent;
                        _context17.next = 5;
                        return client.query("SELECT docid, page, concept, cuis, cuis_selected, qualifiers, qualifiers_selected, \"user\",istitle, labeller FROM metadata WHERE docid = $1 AND page = $2 AND \"user\" = $3", [docid, page, user]);

                      case 5:
                        result = _context17.sent;
                        client.release();
                        return _context17.abrupt("return", result);

                      case 8:
                      case "end":
                        return _context17.stop();
                    }
                  }
                }, _callee17, this);
              }));

              return function getMetadata(_x47, _x48, _x49) {
                return _ref18.apply(this, arguments);
              };
            }();

            if (!(req.query && req.query.docid && req.query.page && req.query.user)) {
              _context18.next = 9;
              break;
            }

            _context18.t0 = res;
            _context18.next = 5;
            return getMetadata(req.query.docid, req.query.page, req.query.user);

          case 5:
            _context18.t1 = _context18.sent;

            _context18.t0.send.call(_context18.t0, _context18.t1);

            _context18.next = 10;
            break;

          case 9:
            res.send({
              error: "getMetadata_badquery"
            });

          case 10:
          case "end":
            return _context18.stop();
        }
      }
    }, _callee18, this);
  }));

  return function (_x45, _x46) {
    return _ref17.apply(this, arguments);
  };
}());
app.get('/', function (req, res) {
  res.send("TTidier Server running.");
}); // Collections

var listCollections =
/*#__PURE__*/
function () {
  var _ref19 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee19() {
    var client, result;
    return _regenerator.default.wrap(function _callee19$(_context19) {
      while (1) {
        switch (_context19.prev = _context19.next) {
          case 0:
            _context19.next = 2;
            return pool.connect();

          case 2:
            client = _context19.sent;
            _context19.next = 5;
            return client.query("SELECT id, title, description, owner_username FROM public.collection");

          case 5:
            result = _context19.sent;
            client.release();
            return _context19.abrupt("return", result);

          case 8:
          case "end":
            return _context19.stop();
        }
      }
    }, _callee19, this);
  }));

  return function listCollections() {
    return _ref19.apply(this, arguments);
  };
}();

var createCollection =
/*#__PURE__*/
function () {
  var _ref20 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee20() {
    var client, result;
    return _regenerator.default.wrap(function _callee20$(_context20) {
      while (1) {
        switch (_context20.prev = _context20.next) {
          case 0:
            _context20.next = 2;
            return pool.connect();

          case 2:
            client = _context20.sent;
            _context20.next = 5;
            return client.query("SELECT id, title, description, owner_username FROM public.collection");

          case 5:
            result = _context20.sent;
            client.release();
            return _context20.abrupt("return", result);

          case 8:
          case "end":
            return _context20.stop();
        }
      }
    }, _callee20, this);
  }));

  return function createCollection() {
    return _ref20.apply(this, arguments);
  };
}();

var editCollection =
/*#__PURE__*/
function () {
  var _ref21 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee21() {
    var client, result;
    return _regenerator.default.wrap(function _callee21$(_context21) {
      while (1) {
        switch (_context21.prev = _context21.next) {
          case 0:
            _context21.next = 2;
            return pool.connect();

          case 2:
            client = _context21.sent;
            _context21.next = 5;
            return client.query("SELECT id, title, description, owner_username FROM public.collection");

          case 5:
            result = _context21.sent;
            client.release();
            return _context21.abrupt("return", result);

          case 8:
          case "end":
            return _context21.stop();
        }
      }
    }, _callee21, this);
  }));

  return function editCollection() {
    return _ref21.apply(this, arguments);
  };
}();

app.post('/collections',
/*#__PURE__*/
function () {
  var _ref22 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee22(req, res) {
    var result;
    return _regenerator.default.wrap(function _callee22$(_context22) {
      while (1) {
        switch (_context22.prev = _context22.next) {
          case 0:
            if (!(req.query && !req.query.action)) {
              _context22.next = 3;
              break;
            }

            res.json({
              status: "undefined"
            });
            return _context22.abrupt("return");

          case 3:
            _context22.t0 = req.query.action;
            _context22.next = _context22.t0 === "list" ? 6 : _context22.t0 === "create" ? 11 : _context22.t0 === "edit" ? 16 : 21;
            break;

          case 6:
            _context22.next = 8;
            return listCollections();

          case 8:
            result = _context22.sent;
            res.json({
              status: "success",
              data: result.rows
            });
            return _context22.abrupt("break", 22);

          case 11:
            _context22.next = 13;
            return createCollection();

          case 13:
            result = _context22.sent;
            res.json({
              status: "success"
            });
            return _context22.abrupt("break", 22);

          case 16:
            _context22.next = 18;
            return editCollection();

          case 18:
            result = _context22.sent;
            res.json({
              status: "success"
            });
            return _context22.abrupt("break", 22);

          case 21:
            res.json({
              status: "failed"
            });

          case 22:
          case "end":
            return _context22.stop();
        }
      }
    }, _callee22, this);
  }));

  return function (_x50, _x51) {
    return _ref22.apply(this, arguments);
  };
}());
app.post('/search',
/*#__PURE__*/
function () {
  var _ref23 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee23(req, res) {
    var bod, type, search_results;
    return _regenerator.default.wrap(function _callee23$(_context23) {
      while (1) {
        switch (_context23.prev = _context23.next) {
          case 0:
            bod = req.body.searchContent;
            type = JSON.parse(req.body.searchType);
            search_results = easysearch.search(global.searchIndex, bod);
            console.log("SEARCH: " + search_results.length + " for " + bod);

            if (search_results.length > 100) {
              search_results = search_results.slice(0, 100);
            }

            res.json(search_results);

          case 6:
          case "end":
            return _context23.stop();
        }
      }
    }, _callee23, this);
  }));

  return function (_x52, _x53) {
    return _ref23.apply(this, arguments);
  };
}());
app.get('/api/allInfo',
/*#__PURE__*/
function () {
  var _ref24 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee24(req, res) {
    var labellers, result, available_documents_temp, abs_index_temp, DOCS_temp;
    return _regenerator.default.wrap(function _callee24$(_context24) {
      while (1) {
        switch (_context24.prev = _context24.next) {
          case 0:
            _context24.next = 2;
            return getMetadataLabellers();

          case 2:
            labellers = _context24.sent;
            labellers = labellers.rows.reduce(function (acc, item) {
              acc[item.docid + "_" + item.page] = item.labeller;
              return acc;
            }, {});

            if (!(req.query && (req.query.filter_topic || req.query.filter_type || req.query.hua || req.query.filter_group || req.query.filter_labelgroup))) {
              _context24.next = 14;
              break;
            }

            _context24.next = 7;
            return (0, _table.prepareAvailableDocuments)(req.query.filter_topic ? req.query.filter_topic.split("_") : [], req.query.filter_type ? req.query.filter_type.split("_") : [], req.query.hua ? req.query.hua == "true" : false, req.query.filter_group ? req.query.filter_group.split("_") : [], req.query.filter_labelgroup ? req.query.filter_labelgroup.split("_") : []);

          case 7:
            result = _context24.sent;
            available_documents_temp = result.available_documents;
            abs_index_temp = result.abs_index;
            DOCS_temp = result.DOCS;
            res.send({
              abs_index: abs_index_temp,
              total: DOCS_temp.length,
              available_documents: available_documents_temp,
              msh_categories: msh_categories,
              labellers: labellers
            });
            _context24.next = 15;
            break;

          case 14:
            res.send({
              abs_index: abs_index,
              total: DOCS.length,
              available_documents: available_documents,
              msh_categories: msh_categories,
              labellers: labellers
            });

          case 15:
          case "end":
            return _context24.stop();
        }
      }
    }, _callee24, this);
  }));

  return function (_x54, _x55) {
    return _ref24.apply(this, arguments);
  };
}()); // Extracts all recommended CUIs from the DB and formats them as per the "recommend_cuis" variable a the bottom of the function.

function getRecommendedCUIS() {
  return _getRecommendedCUIS.apply(this, arguments);
}

function _getRecommendedCUIS() {
  _getRecommendedCUIS = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee53() {
    var cuiRecommend, recommend_cuis, rec_cuis, splitConcepts;
    return _regenerator.default.wrap(function _callee53$(_context53) {
      while (1) {
        switch (_context53.prev = _context53.next) {
          case 0:
            cuiRecommend =
            /*#__PURE__*/
            function () {
              var _ref47 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee52() {
                var client, result;
                return _regenerator.default.wrap(function _callee52$(_context52) {
                  while (1) {
                    switch (_context52.prev = _context52.next) {
                      case 0:
                        _context52.next = 2;
                        return pool.connect();

                      case 2:
                        client = _context52.sent;
                        _context52.next = 5;
                        return client.query("select * from cuis_recommend");

                      case 5:
                        result = _context52.sent;
                        client.release();
                        return _context52.abrupt("return", result);

                      case 8:
                      case "end":
                        return _context52.stop();
                    }
                  }
                }, _callee52, this);
              }));

              return function cuiRecommend() {
                return _ref47.apply(this, arguments);
              };
            }();

            recommend_cuis = {};
            _context53.next = 4;
            return cuiRecommend();

          case 4:
            rec_cuis = _context53.sent.rows;

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
            return _context53.abrupt("return", recommend_cuis);

          case 8:
          case "end":
            return _context53.stop();
        }
      }
    }, _callee53, this);
  }));
  return _getRecommendedCUIS.apply(this, arguments);
}

app.get('/api/cuiRecommend',
/*#__PURE__*/
function () {
  var _ref25 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee25(req, res) {
    var cuirec;
    return _regenerator.default.wrap(function _callee25$(_context25) {
      while (1) {
        switch (_context25.prev = _context25.next) {
          case 0:
            _context25.next = 2;
            return getRecommendedCUIS();

          case 2:
            cuirec = _context25.sent;
            res.send(cuirec);

          case 4:
          case "end":
            return _context25.stop();
        }
      }
    }, _callee25, this);
  }));

  return function (_x56, _x57) {
    return _ref25.apply(this, arguments);
  };
}());
app.get('/api/allMetadata',
/*#__PURE__*/
function () {
  var _ref26 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee27(req, res) {
    var allMetadataAnnotations;
    return _regenerator.default.wrap(function _callee27$(_context27) {
      while (1) {
        switch (_context27.prev = _context27.next) {
          case 0:
            allMetadataAnnotations =
            /*#__PURE__*/
            function () {
              var _ref27 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee26() {
                var client, result;
                return _regenerator.default.wrap(function _callee26$(_context26) {
                  while (1) {
                    switch (_context26.prev = _context26.next) {
                      case 0:
                        _context26.next = 2;
                        return pool.connect();

                      case 2:
                        client = _context26.sent;
                        _context26.next = 5;
                        return client.query("select * from metadata");

                      case 5:
                        result = _context26.sent;
                        client.release();
                        return _context26.abrupt("return", result);

                      case 8:
                      case "end":
                        return _context26.stop();
                    }
                  }
                }, _callee26, this);
              }));

              return function allMetadataAnnotations() {
                return _ref27.apply(this, arguments);
              };
            }();

            _context27.t0 = res;
            _context27.next = 4;
            return allMetadataAnnotations();

          case 4:
            _context27.t1 = _context27.sent;

            _context27.t0.send.call(_context27.t0, _context27.t1);

          case 6:
          case "end":
            return _context27.stop();
        }
      }
    }, _callee27, this);
  }));

  return function (_x58, _x59) {
    return _ref26.apply(this, arguments);
  };
}());
app.get('/api/cuisIndex',
/*#__PURE__*/
function () {
  var _ref28 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee29(req, res) {
    var getCUISIndex;
    return _regenerator.default.wrap(function _callee29$(_context29) {
      while (1) {
        switch (_context29.prev = _context29.next) {
          case 0:
            getCUISIndex =
            /*#__PURE__*/
            function () {
              var _ref29 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee28() {
                var cuis, client, result;
                return _regenerator.default.wrap(function _callee28$(_context28) {
                  while (1) {
                    switch (_context28.prev = _context28.next) {
                      case 0:
                        cuis = {};
                        _context28.next = 3;
                        return pool.connect();

                      case 3:
                        client = _context28.sent;
                        _context28.next = 6;
                        return client.query("select * from cuis_index");

                      case 6:
                        result = _context28.sent;
                        client.release();
                        result.rows.map(function (row) {
                          cuis[row.cui] = {
                            preferred: row.preferred,
                            hasMSH: row.hasMSH,
                            userDefined: row.user_defined,
                            adminApproved: row.admin_approved
                          };
                        });
                        return _context28.abrupt("return", cuis);

                      case 10:
                      case "end":
                        return _context28.stop();
                    }
                  }
                }, _callee28, this);
              }));

              return function getCUISIndex() {
                return _ref29.apply(this, arguments);
              };
            }();

            _context29.t0 = res;
            _context29.next = 4;
            return getCUISIndex();

          case 4:
            _context29.t1 = _context29.sent;

            _context29.t0.send.call(_context29.t0, _context29.t1);

          case 6:
          case "end":
            return _context29.stop();
        }
      }
    }, _callee29, this);
  }));

  return function (_x60, _x61) {
    return _ref28.apply(this, arguments);
  };
}());
app.get('/api/cuisIndexAdd',
/*#__PURE__*/
function () {
  var _ref30 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee31(req, res) {
    var insertCUI;
    return _regenerator.default.wrap(function _callee31$(_context31) {
      while (1) {
        switch (_context31.prev = _context31.next) {
          case 0:
            console.log(JSON.stringify(req.query));

            insertCUI =
            /*#__PURE__*/
            function () {
              var _ref31 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee30(cui, preferred, hasMSH) {
                var client, done;
                return _regenerator.default.wrap(function _callee30$(_context30) {
                  while (1) {
                    switch (_context30.prev = _context30.next) {
                      case 0:
                        _context30.next = 2;
                        return pool.connect();

                      case 2:
                        client = _context30.sent;
                        _context30.next = 5;
                        return client.query('INSERT INTO cuis_index(cui,preferred,"hasMSH",user_defined,admin_approved) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (cui) DO UPDATE SET preferred = $2, "hasMSH" = $3, user_defined = $4, admin_approved = $5', [cui, preferred, hasMSH, true, false]).then(function (result) {
                          return console.log("insert: " + new Date());
                        }).catch(function (e) {
                          return console.error(e.stack);
                        }).then(function () {
                          return client.release();
                        });

                      case 5:
                        done = _context30.sent;

                      case 6:
                      case "end":
                        return _context30.stop();
                    }
                  }
                }, _callee30, this);
              }));

              return function insertCUI(_x64, _x65, _x66) {
                return _ref31.apply(this, arguments);
              };
            }();

            if (!(req.query && req.query.cui.length > 0 && req.query.preferred.length > 0 && req.query.hasMSH.length > 0)) {
              _context31.next = 5;
              break;
            }

            _context31.next = 5;
            return insertCUI(req.query.cui, req.query.preferred, req.query.hasMSH);

          case 5:
            res.send("saved annotation: " + JSON.stringify(req.query));

          case 6:
          case "end":
            return _context31.stop();
        }
      }
    }, _callee31, this);
  }));

  return function (_x62, _x63) {
    return _ref30.apply(this, arguments);
  };
}()); // Produces the data required to teach classifiers. Traverses all existing tables, extracting cell values and associating it with the human annotations.

function trainingData() {
  return _trainingData.apply(this, arguments);
}

function _trainingData() {
  _trainingData = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee54() {
    var cui_data, header, createCsvWriter, csvWriter, csvWriter_unique, count, cuirec, docid, page, data, ac_res, cols, rows, getSemanticTypes, csvData, csvDataUnique, allkeys, i, key;
    return _regenerator.default.wrap(function _callee54$(_context54) {
      while (1) {
        switch (_context54.prev = _context54.next) {
          case 0:
            _context54.next = 2;
            return CUIData();

          case 2:
            cui_data = _context54.sent;
            header = [{
              id: 'docid',
              title: 'docid'
            }, {
              id: 'page',
              title: 'page'
            }, {
              id: 'clean_concept',
              title: 'clean_concept'
            }, {
              id: 'is_bold',
              title: 'is_bold'
            }, {
              id: 'is_italic',
              title: 'is_italic'
            }, {
              id: 'is_indent',
              title: 'is_indent'
            }, {
              id: 'is_empty_row',
              title: 'is_empty_row'
            }, {
              id: 'is_empty_row_p',
              title: 'is_empty_row_p'
            }, {
              id: 'cuis',
              title: 'cuis'
            }, {
              id: 'semanticTypes',
              title: 'semanticTypes'
            }, {
              id: 'label',
              title: 'label'
            }]; // Object.keys(cui_data.cui_def).map( c => {header.push({id: c, title: c})})
            // Object.keys(cui_data.semtypes).map( s => {header.push({id: s, title: s})})

            createCsvWriter = require('csv-writer').createObjectCsvWriter;
            csvWriter = createCsvWriter({
              path: 'training_data.csv',
              header: header
            });
            csvWriter_unique = createCsvWriter({
              path: 'training_data_unique.csv',
              header: header
            });
            count = 1;
            _context54.next = 10;
            return getRecommendedCUIS();

          case 10:
            cuirec = _context54.sent;
            _context54.t0 = _regenerator.default.keys(available_documents);

          case 12:
            if ((_context54.t1 = _context54.t0()).done) {
              _context54.next = 49;
              break;
            }

            docid = _context54.t1.value;
            _context54.t2 = _regenerator.default.keys(available_documents[docid].pages);

          case 15:
            if ((_context54.t3 = _context54.t2()).done) {
              _context54.next = 47;
              break;
            }

            page = _context54.t3.value;
            console.log(docid + "  --  " + page + "  --  " + count + " / " + DOCS.length); //
            // count = count + 1;
            //
            // if ( count < 1800 ){
            //   continue
            // }

            page = available_documents[docid].pages[page];
            _context54.next = 21;
            return (0, _table.readyTableData)(docid, page);

          case 21:
            data = _context54.sent;
            ac_res = cui_data.actual_results;

            if (ac_res[docid + "_" + page]) {
              _context54.next = 25;
              break;
            }

            return _context54.abrupt("continue", 15);

          case 25:
            _context54.prev = 25;
            // These are manually annotated
            cols = Object.keys(ac_res[docid + "_" + page].Col).reduce(function (acc, e) {
              acc[e - 1] = ac_res[docid + "_" + page].Col[e];
              return acc;
            }, {});
            rows = Object.keys(ac_res[docid + "_" + page].Row).reduce(function (acc, e) {
              acc[e - 1] = ac_res[docid + "_" + page].Row[e];
              return acc;
            }, {});
            _context54.next = 34;
            break;

          case 30:
            _context54.prev = 30;
            _context54.t4 = _context54["catch"](25);
            console.log("skipping: " + docid + "_" + page);
            return _context54.abrupt("continue", 15);

          case 34:
            getSemanticTypes = function getSemanticTypes(cuis, cui_data) {
              if (!cuis) {
                return [];
              }

              var semType = [];
              cuis.split(";").map(function (cui) {
                semType.push(cui_data.cui_def[cui].semTypes.split(";"));
              });
              return semType.flat();
            };

            count = count + 1;
            csvData = data.predicted.predictions.map(function (row_el, row) {
              return row_el.terms.map(function (term, col) {
                var row_terms = data.predicted.predictions[row].terms;
                var term_features = data.predicted.predictions[row].terms_features[col];
                var toReturn = {
                  docid: docid,
                  page: page,
                  clean_concept: term_features[0],
                  is_bold: term_features[1],
                  is_italic: term_features[2],
                  is_indent: term_features[3],
                  is_empty_row: term_features[4],
                  is_empty_row_p: term_features[5],
                  // this one is a crude estimation of P values structure. Assume the row has P value if multiple columns are detected but only first and last are populated.
                  cuis: term_features[6],
                  semanticTypes: term_features[7],
                  label: cols[col] ? cols[col].descriptors : rows[row] ? rows[row].descriptors : "" // This is the label selected by the annotating person : "subgroup_name; level etc. "

                };
                return toReturn;
              });
            });
            csvData = csvData.flat();
            csvDataUnique = [];
            allkeys = {};

            for (i = 0; i < csvData.length; i++) {
              key = Object.values(csvData[i]).join("");

              if (!allkeys[key]) {
                allkeys[key] = true;
                csvDataUnique.push(csvData[i]);
              }
            }

            _context54.next = 43;
            return csvWriter.writeRecords(csvData).then(function () {
              console.log('...Done');
            });

          case 43:
            _context54.next = 45;
            return csvWriter_unique.writeRecords(csvDataUnique).then(function () {
              console.log('...Done');
            });

          case 45:
            _context54.next = 15;
            break;

          case 47:
            _context54.next = 12;
            break;

          case 49:
            return _context54.abrupt("return", {});

          case 50:
          case "end":
            return _context54.stop();
        }
      }
    }, _callee54, this, [[25, 30]]);
  }));
  return _trainingData.apply(this, arguments);
}

app.get('/api/trainingData',
/*#__PURE__*/
function () {
  var _ref32 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee32(req, res) {
    var allP;
    return _regenerator.default.wrap(function _callee32$(_context32) {
      while (1) {
        switch (_context32.prev = _context32.next) {
          case 0:
            console.log("getting all training data");
            _context32.next = 3;
            return trainingData();

          case 3:
            allP = _context32.sent;
            res.send(allP);

          case 5:
          case "end":
            return _context32.stop();
        }
      }
    }, _callee32, this);
  }));

  return function (_x67, _x68) {
    return _ref32.apply(this, arguments);
  };
}()); // Generates the results table live preview, connecting to the R API.

app.get('/api/annotationPreview',
/*#__PURE__*/
function () {
  var _ref33 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee33(req, res) {
    var annotations, page, user, final_annotations, r, ann, existing, final_annotations_array, entry;
    return _regenerator.default.wrap(function _callee33$(_context33) {
      while (1) {
        switch (_context33.prev = _context33.next) {
          case 0:
            _context33.prev = 0;

            if (!(req.query && req.query.docid && req.query.docid.length > 0)) {
              _context33.next = 10;
              break;
            }

            page = req.query.page && req.query.page.length > 0 ? req.query.page : 1;
            user = req.query.user && req.query.user.length > 0 ? req.query.user : "";
            console.log("Producing Data Preview for: " + JSON.stringify(req.query));
            _context33.next = 7;
            return getAnnotationByID(req.query.docid, page, user);

          case 7:
            annotations = _context33.sent;
            _context33.next = 11;
            break;

          case 10:
            res.send({
              state: "badquery: " + JSON.stringify(req.query)
            });

          case 11:
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
              request({
                url: 'http://localhost:6666/preview',
                method: "POST",
                json: {
                  anns: entry
                }
              }, function (error, response, body) {
                res.send({
                  "state": "good",
                  result: body.tableResult,
                  "anns": body.ann
                });
              });
            } else {
              res.send({
                "state": "empty"
              });
            }

            _context33.next = 21;
            break;

          case 18:
            _context33.prev = 18;
            _context33.t0 = _context33["catch"](0);
            res.send({
              "state": "failed"
            });

          case 21:
          case "end":
            return _context33.stop();
        }
      }
    }, _callee33, this, [[0, 18]]);
  }));

  return function (_x69, _x70) {
    return _ref33.apply(this, arguments);
  };
}()); // Returns all annotations for all document/tables.

app.get('/api/formattedResults',
/*#__PURE__*/
function () {
  var _ref34 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee34(req, res) {
    var results, finalResults, r, ann, existing, finalResults_array, formattedRes;
    return _regenerator.default.wrap(function _callee34$(_context34) {
      while (1) {
        switch (_context34.prev = _context34.next) {
          case 0:
            _context34.next = 2;
            return (0, _network_functions.getAnnotationResults)();

          case 2:
            results = _context34.sent;

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
            return _context34.stop();
        }
      }
    }, _callee34, this);
  }));

  return function (_x71, _x72) {
    return _ref34.apply(this, arguments);
  };
}());
app.get('/api/abs_index', function (req, res) {
  var output = "";

  for (var i in abs_index) {
    output = output + i + "," + abs_index[i].docid + "," + abs_index[i].page + "\n";
  }

  res.send(output);
});
app.get('/api/totalTables', function (req, res) {
  res.send({
    total: DOCS.length
  });
});
app.get('/api/getMMatch',
/*#__PURE__*/
function () {
  var _ref35 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee36(req, res) {
    var getMMatch, mm_match;
    return _regenerator.default.wrap(function _callee36$(_context36) {
      while (1) {
        switch (_context36.prev = _context36.next) {
          case 0:
            getMMatch =
            /*#__PURE__*/
            function () {
              var _ref36 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee35(phrase) {
                var result;
                return _regenerator.default.wrap(function _callee35$(_context35) {
                  while (1) {
                    switch (_context35.prev = _context35.next) {
                      case 0:
                        console.log("LOOKING FOR: " + phrase);
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
                        return _context35.abrupt("return", result);

                      case 3:
                      case "end":
                        return _context35.stop();
                    }
                  }
                }, _callee35, this);
              }));

              return function getMMatch(_x75) {
                return _ref36.apply(this, arguments);
              };
            }();

            _context36.prev = 1;

            if (!(req.query && req.query.phrase)) {
              _context36.next = 9;
              break;
            }

            _context36.next = 5;
            return getMMatch(req.query.phrase);

          case 5:
            mm_match = _context36.sent;
            res.send(mm_match);
            _context36.next = 10;
            break;

          case 9:
            res.send({
              status: "wrong parameters",
              query: req.query
            });

          case 10:
            _context36.next = 15;
            break;

          case 12:
            _context36.prev = 12;
            _context36.t0 = _context36["catch"](1);
            console.log(_context36.t0);

          case 15:
          case "end":
            return _context36.stop();
        }
      }
    }, _callee36, this, [[1, 12]]);
  }));

  return function (_x73, _x74) {
    return _ref35.apply(this, arguments);
  };
}()); // POST method route

app.post('/saveTableOverride', function (req, res) {
  fs.writeFile(global.tables_folder_override + "/" + req.body.docid + "_" + req.body.page + '.html', req.body.table, function (err) {
    if (err) throw err;
    console.log('Written replacement for: ' + req.body.docid + "_" + req.body.page + '.html');
  });
  res.send("alles gut!");
});
app.get('/api/removeOverrideTable',
/*#__PURE__*/
function () {
  var _ref37 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee37(req, res) {
    var file_exists;
    return _regenerator.default.wrap(function _callee37$(_context37) {
      while (1) {
        switch (_context37.prev = _context37.next) {
          case 0:
            if (!(req.query && req.query.docid && req.query.page)) {
              _context37.next = 8;
              break;
            }

            _context37.next = 3;
            return fs.existsSync(global.tables_folder_override + "/" + req.query.docid + "_" + req.query.page + ".html");

          case 3:
            file_exists = _context37.sent;

            if (file_exists) {
              fs.unlink(global.tables_folder_override + "/" + req.query.docid + "_" + req.query.page + ".html", function (err) {
                if (err) throw err;
                console.log("REMOVED : " + global.tables_folder_override + "/" + req.query.docid + "_" + req.query.page + ".html");
              });
            }

            res.send({
              status: "override removed"
            });
            _context37.next = 9;
            break;

          case 8:
            res.send({
              status: "no changes"
            });

          case 9:
          case "end":
            return _context37.stop();
        }
      }
    }, _callee37, this);
  }));

  return function (_x76, _x77) {
    return _ref37.apply(this, arguments);
  };
}());
app.get('/api/classify',
/*#__PURE__*/
function () {
  var _ref38 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee38(req, res) {
    return _regenerator.default.wrap(function _callee38$(_context38) {
      while (1) {
        switch (_context38.prev = _context38.next) {
          case 0:
            if (!(req.query && req.query.terms)) {
              _context38.next = 8;
              break;
            }

            console.log(req.query.terms);
            _context38.t0 = res;
            _context38.next = 5;
            return classify(req.query.terms.split(","));

          case 5:
            _context38.t1 = _context38.sent;
            _context38.t2 = {
              results: _context38.t1
            };

            _context38.t0.send.call(_context38.t0, _context38.t2);

          case 8:
          case "end":
            return _context38.stop();
        }
      }
    }, _callee38, this);
  }));

  return function (_x78, _x79) {
    return _ref38.apply(this, arguments);
  };
}());
app.get('/api/getTable',
/*#__PURE__*/
function () {
  var _ref39 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee39(req, res) {
    var tableData;
    return _regenerator.default.wrap(function _callee39$(_context39) {
      while (1) {
        switch (_context39.prev = _context39.next) {
          case 0:
            _context39.prev = 0;

            if (!(req.query && req.query.docid && req.query.page && available_documents[req.query.docid] && available_documents[req.query.docid].pages.indexOf(req.query.page) > -1)) {
              _context39.next = 8;
              break;
            }

            _context39.next = 4;
            return (0, _table.readyTableData)(req.query.docid, req.query.page);

          case 4:
            tableData = _context39.sent;
            res.send(tableData);
            _context39.next = 9;
            break;

          case 8:
            res.send({
              status: "wrong parameters",
              query: req.query
            });

          case 9:
            _context39.next = 15;
            break;

          case 11:
            _context39.prev = 11;
            _context39.t0 = _context39["catch"](0);
            console.log(_context39.t0);
            res.send({
              status: "probably page out of bounds, or document does not exist",
              query: req.query
            });

          case 15:
          case "end":
            return _context39.stop();
        }
      }
    }, _callee39, this, [[0, 11]]);
  }));

  return function (_x80, _x81) {
    return _ref39.apply(this, arguments);
  };
}());
app.get('/api/getAvailableTables', function (req, res) {
  res.send(available_documents);
});
app.get('/api/getAnnotations',
/*#__PURE__*/
function () {
  var _ref40 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee40(req, res) {
    return _regenerator.default.wrap(function _callee40$(_context40) {
      while (1) {
        switch (_context40.prev = _context40.next) {
          case 0:
            _context40.t0 = res;
            _context40.next = 3;
            return (0, _network_functions.getAnnotationResults)();

          case 3:
            _context40.t1 = _context40.sent;

            _context40.t0.send.call(_context40.t0, _context40.t1);

          case 5:
          case "end":
            return _context40.stop();
        }
      }
    }, _callee40, this);
  }));

  return function (_x82, _x83) {
    return _ref40.apply(this, arguments);
  };
}());
app.get('/api/deleteAnnotation',
/*#__PURE__*/
function () {
  var _ref41 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee42(req, res) {
    var deleteAnnotation;
    return _regenerator.default.wrap(function _callee42$(_context42) {
      while (1) {
        switch (_context42.prev = _context42.next) {
          case 0:
            deleteAnnotation =
            /*#__PURE__*/
            function () {
              var _ref42 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee41(docid, page, user) {
                var client, done;
                return _regenerator.default.wrap(function _callee41$(_context41) {
                  while (1) {
                    switch (_context41.prev = _context41.next) {
                      case 0:
                        _context41.next = 2;
                        return pool.connect();

                      case 2:
                        client = _context41.sent;
                        _context41.next = 5;
                        return client.query('DELETE FROM annotations WHERE docid = $1 AND page = $2 AND "user" = $3', [docid, page, user]).then(function (result) {
                          return console.log("Annotation deleted: " + new Date());
                        }).catch(function (e) {
                          return console.error(e.stack);
                        }).then(function () {
                          return client.release();
                        });

                      case 5:
                        done = _context41.sent;

                      case 6:
                      case "end":
                        return _context41.stop();
                    }
                  }
                }, _callee41, this);
              }));

              return function deleteAnnotation(_x86, _x87, _x88) {
                return _ref42.apply(this, arguments);
              };
            }();

            if (!(req.query && req.query.docid && req.query.page && req.query.user)) {
              _context42.next = 7;
              break;
            }

            _context42.next = 4;
            return deleteAnnotation(req.query.docid, req.query.page, req.query.user);

          case 4:
            res.send("done");
            _context42.next = 8;
            break;

          case 7:
            res.send("delete failed");

          case 8:
          case "end":
            return _context42.stop();
        }
      }
    }, _callee42, this);
  }));

  return function (_x84, _x85) {
    return _ref41.apply(this, arguments);
  };
}());
app.get('/api/getAnnotationByID',
/*#__PURE__*/
function () {
  var _ref43 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee43(req, res) {
    var page, user, annotations, final_annotations, r, ann, existing, final_annotations_array, entry;
    return _regenerator.default.wrap(function _callee43$(_context43) {
      while (1) {
        switch (_context43.prev = _context43.next) {
          case 0:
            if (!(req.query && req.query.docid && req.query.docid.length > 0)) {
              _context43.next = 13;
              break;
            }

            page = req.query.page && req.query.page.length > 0 ? req.query.page : 1;
            user = req.query.user && req.query.user.length > 0 ? req.query.user : "";
            _context43.next = 5;
            return getAnnotationByID(req.query.docid, page, user);

          case 5:
            annotations = _context43.sent;
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
              res.send(entry);
            } else {
              res.send({});
            }

            _context43.next = 14;
            break;

          case 13:
            res.send({
              error: "failed request"
            });

          case 14:
          case "end":
            return _context43.stop();
        }
      }
    }, _callee43, this);
  }));

  return function (_x89, _x90) {
    return _ref43.apply(this, arguments);
  };
}());
app.get('/api/modelEval',
/*#__PURE__*/
function () {
  var _ref44 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee44(req, res) {
    var testingDocs, createCsvWriter, csvWriter, records, transferAnnotations, counter, doc, p, page, docid, tableData;
    return _regenerator.default.wrap(function _callee44$(_context44) {
      while (1) {
        switch (_context44.prev = _context44.next) {
          case 0:
            testingDocs = new Promise(function (resolve, reject) {
              var inputStream = fs.createReadStream(CONFIG.system_path + "testing_tables_list.csv", 'utf8');
              var testingDocs = [];
              inputStream.pipe(new CsvReadableStream({
                parseNumbers: true,
                parseBooleans: true,
                trim: true,
                skipHeader: true
              })).on('data', function (row) {
                testingDocs.push(row[0] + "_" + row[1]);
              }).on('end', function (data) {
                console.log("read testing docs list");
                resolve(testingDocs);
              });
            });
            _context44.next = 3;
            return testingDocs;

          case 3:
            testingDocs = _context44.sent;
            // debugger
            createCsvWriter = require('csv-writer').createObjectCsvWriter;
            csvWriter = createCsvWriter({
              path: CONFIG.system_path + 'predictor_results.csv',
              header: [{
                id: 'user',
                title: 'user'
              }, {
                id: 'docid',
                title: 'docid'
              }, {
                id: 'page',
                title: 'page'
              }, {
                id: 'corrupted',
                title: 'corrupted'
              }, {
                id: 'tableType',
                title: 'tableType'
              }, {
                id: 'location',
                title: 'location'
              }, {
                id: 'number',
                title: 'number'
              }, {
                id: 'content',
                title: 'content'
              }, {
                id: 'qualifiers',
                title: 'qualifiers'
              }]
            });
            records = [];

            transferAnnotations = function transferAnnotations(records, items, type) {
              items.map(function (p, i) {
                return records.push({
                  user: "auto",
                  docid: docid,
                  page: page,
                  corrupted: "false",
                  tableType: "na",
                  location: type == "Col" ? "Col" : "Row",
                  number: parseInt(p.c) + 1,
                  content: p.descriptors.join(";"),
                  qualifiers: p.unique_modifier.split(" ").join(";")
                });
              });
              return records;
            };

            counter = 0;
            _context44.t0 = _regenerator.default.keys(available_documents);

          case 10:
            if ((_context44.t1 = _context44.t0()).done) {
              _context44.next = 38;
              break;
            }

            doc = _context44.t1.value;
            _context44.t2 = _regenerator.default.keys(available_documents[doc].pages);

          case 13:
            if ((_context44.t3 = _context44.t2()).done) {
              _context44.next = 36;
              break;
            }

            p = _context44.t3.value;
            page = available_documents[doc].pages[p];
            docid = doc;
            console.log(counter + " / " + (testingDocs.length > 0 ? testingDocs.length : Object.keys(available_documents).length));

            if (!(testingDocs.indexOf(docid + "_" + page) < 0)) {
              _context44.next = 22;
              break;
            }

            return _context44.abrupt("continue", 13);

          case 22:
            counter++;

          case 23:
            _context44.prev = 23;
            _context44.next = 26;
            return (0, _table.readyTableData)(docid, page);

          case 26:
            tableData = _context44.sent;
            _context44.next = 33;
            break;

          case 29:
            _context44.prev = 29;
            _context44.t4 = _context44["catch"](23);
            console.log(docid + "_" + page + " :: Failed");
            return _context44.abrupt("continue", 13);

          case 33:
            if (tableData.predicted) {
              records = transferAnnotations(records, tableData.predicted.cols, "Col");
              records = transferAnnotations(records, tableData.predicted.rows, "Row");
            } else {
              console.log("no predicted data found");
              debugger;
            }

            _context44.next = 13;
            break;

          case 36:
            _context44.next = 10;
            break;

          case 38:
            // debugger
            csvWriter.writeRecords(records) // returns a promise
            .then(function () {
              res.send("Done experiments");
            });

          case 39:
          case "end":
            return _context44.stop();
        }
      }
    }, _callee44, this, [[23, 29]]);
  }));

  return function (_x91, _x92) {
    return _ref44.apply(this, arguments);
  };
}());
app.get('/api/recordAnnotation',
/*#__PURE__*/
function () {
  var _ref45 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee46(req, res) {
    var insertAnnotation;
    return _regenerator.default.wrap(function _callee46$(_context46) {
      while (1) {
        switch (_context46.prev = _context46.next) {
          case 0:
            console.log("Recording Annotation: " + JSON.stringify(req.query));

            insertAnnotation =
            /*#__PURE__*/
            function () {
              var _ref46 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee45(docid, page, user, annotation, corrupted, tableType, corrupted_text) {
                var client, done;
                return _regenerator.default.wrap(function _callee45$(_context45) {
                  while (1) {
                    switch (_context45.prev = _context45.next) {
                      case 0:
                        _context45.next = 2;
                        return pool.connect();

                      case 2:
                        client = _context45.sent;
                        _context45.next = 5;
                        return client.query('INSERT INTO annotations VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (docid, page,"user") DO UPDATE SET annotation = $4, corrupted = $5, "tableType" = $6, "corrupted_text" = $7 ;', [docid, page, user, annotation, corrupted, tableType, corrupted_text]).then(function (result) {
                          return console.log("insert: " + result);
                        }).catch(function (e) {
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
                }, _callee45, this);
              }));

              return function insertAnnotation(_x95, _x96, _x97, _x98, _x99, _x100, _x101) {
                return _ref46.apply(this, arguments);
              };
            }();

            if (!(req.query && req.query.docid.length > 0 && req.query.page.length > 0 && req.query.user.length > 0 && req.query.annotation.length > 0)) {
              _context46.next = 5;
              break;
            }

            _context46.next = 5;
            return insertAnnotation(req.query.docid, req.query.page, req.query.user, {
              annotations: JSON.parse(req.query.annotation)
            }, req.query.corrupted, req.query.tableType, req.query.corrupted_text);

          case 5:
            res.send("saved annotation: " + JSON.stringify(req.query));

          case 6:
          case "end":
            return _context46.stop();
        }
      }
    }, _callee46, this);
  }));

  return function (_x93, _x94) {
    return _ref45.apply(this, arguments);
  };
}());
app.listen(CONFIG.port, function () {
  console.log('Table Tidier Server running on port ' + CONFIG.port + ' ' + new Date().toISOString());
});