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
    // * :-)  Sqlite version transform "annotations".annotation from text to json
    annotationDataGet: function () {
      var _annotationDataGet = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(tids) {
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                return _context2.abrupt("return", query("SELECT \n  docid,\n  page,\n  collection_id,\n  file_path,\n  \"table\".tid,\n  \"annotations\".annotation\nFROM \n  \"table\",\n  \"annotations\"\nwhere\n  \"table\".tid = \"annotations\".tid AND \"table\".tid = ANY ($1)", [tids]));

              case 1:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }));

      function annotationDataGet(_x3) {
        return _annotationDataGet.apply(this, arguments);
      }

      return annotationDataGet;
    }(),
    resultsDataGet: function () {
      var _resultsDataGet = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(tids) {
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                return _context3.abrupt("return", query("SELECT * FROM \"result\" WHERE tid = ANY ($1)", [tids]));

              case 1:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }));

      function resultsDataGet(_x4) {
        return _resultsDataGet.apply(this, arguments);
      }

      return resultsDataGet;
    }()
  };
}

module.exports = driver;