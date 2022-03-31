"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _require = require('pg'),
    Pool = _require.Pool,
    Client = _require.Client,
    Query = _require.Query;

function driver(config) {
  // :-) Check config has valid fields
  var pool = new Pool({
    user: config.user,
    password: config.password,
    host: config.host,
    port: config.port,
    database: config.database
  }); // Generic 

  var query = /*#__PURE__*/function () {
    var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(queryText, values) {
      var client, result;
      return _regenerator["default"].wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              _context.next = 3;
              return pool.connect();

            case 3:
              client = _context.sent;
              _context.next = 6;
              return client.query(queryText, values);

            case 6:
              result = _context.sent;
              client.release();
              return _context.abrupt("return", result);

            case 11:
              _context.prev = 11;
              _context.t0 = _context["catch"](0);
              return _context.abrupt("return", _context.t0);

            case 14:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, null, [[0, 11]]);
    }));

    return function query(_x, _x2) {
      return _ref.apply(this, arguments);
    };
  }();

  return {
    annotationByIDGet: function annotationByIDGet(docid, page, collId) {
      return query("SELECT \n        docid,\n        \"user\",\n        notes,\n        collection_id,\n        file_path,\n        \"tableType\",\n        \"table\".tid,\n        completion,\n        annotation\n      FROM \n        \"table\"\n      LEFT JOIN\n        annotations\n      ON\n        \"table\".tid = annotations.tid\n      WHERE\n      docid=$1 AND page=$2 AND collection_id = $3", [docid, page, collId]);
    },
    annotationDataGet: function annotationDataGet(tids) {
      return query( // * :-)  Sqlite version transform "annotations".annotation from text to json
      "SELECT \n  docid,\n  page,\n  collection_id,\n  file_path,\n  \"table\".tid,\n  \"annotations\".annotation\nFROM \n  \"table\",\n  \"annotations\"\nWHERE\n  \"table\".tid = \"annotations\".tid AND \"table\".tid = ANY ($1)", [tids]);
    },
    annotationResultsGet: function () {
      var _annotationResultsGet = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
        var result;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return query("SELECT * FROM \"table\", annotations where \"table\".tid = annotations.tid order by docid desc,page asc");

              case 2:
                result = _context2.sent;
                return _context2.abrupt("return", result);

              case 4:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }));

      function annotationResultsGet() {
        return _annotationResultsGet.apply(this, arguments);
      }

      return annotationResultsGet;
    }(),
    // Gets the labellers associated w ith each document/table.
    metadataLabellersGet: function metadataLabellersGet() {
      return query("SELECT distinct docid, page, labeller FROM metadata");
    },
    resultsDataGet: function resultsDataGet(tids) {
      return query("SELECT * FROM \"result\" WHERE tid = ANY ($1)", [tids]);
    }
  };
}

module.exports = driver;