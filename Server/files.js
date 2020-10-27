"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _table = require("./table.js");

function refreshDocuments() {
  return _refreshDocuments.apply(this, arguments);
}

function _refreshDocuments() {
  _refreshDocuments = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
    var res;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return (0, _table.prepareAvailableDocuments)();

          case 2:
            res = _context.sent;
            available_documents = res.available_documents;
            abs_index = res.abs_index;
            DOCS = res.DOCS;

          case 6:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _refreshDocuments.apply(this, arguments);
}

module.exports = {
  refreshDocuments: refreshDocuments
};