"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var getAnnotationResults = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
    var client, result;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return pool.connect();

          case 2:
            client = _context.sent;
            _context.next = 5;
            return client.query("select * from \"table\",annotations where \"table\".tid = annotations.tid order by docid desc,page asc");

          case 5:
            result = _context.sent;
            client.release(); // var filtered_rows = []
            //
            // var hey = available_documents
            //
            // var docids = Object.keys(available_documents)
            //
            // for ( var i=0; i < result.rows.length; i++ ) {
            //
            //   if (  docids.indexOf (result.rows[i].docid) > -1 ){
            //     filtered_rows.push(result.rows[i])
            //   }
            //
            // }
            //
            // result.rows = filtered_rows
            // debugger

            return _context.abrupt("return", result);

          case 8:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function getAnnotationResults() {
    return _ref.apply(this, arguments);
  };
}();

module.exports = {
  getAnnotationResults: getAnnotationResults
};