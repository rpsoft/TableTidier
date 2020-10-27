"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initialiseUsers = initialiseUsers;
exports.createUser = createUser;
exports.getUserHash = getUserHash;
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _passportCustom = _interopRequireDefault(require("passport-custom"));

var passport = require('passport');

var crypto = require('crypto');

var CustomStrategy = _passportCustom["default"].Strategy;
global.records = [//   { id: 1, username: 'jack', password: 'secret', displayName: 'Jack', email: 'jack@example.com', registered : "1588283579685", role: "viewer" }
  // , { id: 2, username: 'jill', password: 'birthday', displayName: 'Jill', email:'jill@example.com', registered : "1588283575644", role: "user" }
  // , { id: 3, username: 'suso', password: 'me', displayName: 'Jesus', email: 'suso@example.com', registered : "1588283589667", role: "admin" }
];

function initialiseUsers() {
  return _initialiseUsers.apply(this, arguments);
}

function _initialiseUsers() {
  _initialiseUsers = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
    var client, result;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return global.pool.connect();

          case 2:
            client = _context.sent;
            _context.next = 5;
            return client.query('SELECT id, username, password, "displayName", email, registered, role FROM public.users');

          case 5:
            result = _context.sent;
            client.release();
            global.records = result.rows;

          case 8:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _initialiseUsers.apply(this, arguments);
}

function createUser(_x) {
  return _createUser.apply(this, arguments);
}

function _createUser() {
  _createUser = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(userData) {
    var client, result;
    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return global.pool.connect();

          case 2:
            client = _context2.sent;
            _context2.next = 5;
            return client.query('INSERT INTO public.users( username, password, "displayName", email, registered, role) VALUES ($1, $2, $3, $4, $5, $6)', [userData.username, userData.password, userData.displayName, userData.email, Date.now(), "standard"]);

          case 5:
            result = _context2.sent;
            client.release();
            _context2.next = 9;
            return initialiseUsers();

          case 9:
            return _context2.abrupt("return", result);

          case 10:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _createUser.apply(this, arguments);
}

function getUserHash(user) {
  var hash = crypto.createHmac('sha256', CONFIG.hashSecret).update(user.username + user.password + user.registered).digest('hex');
  return {
    username: user.username,
    password: user.password,
    hash: hash
  };
}

passport.use(new CustomStrategy(function (req, done) {
  for (var i in global.records) {
    if (global.records[i].username == req.body.username) {
      if (global.records[i].password != req.body.password) {
        return done(null, false);
      }

      return done(null, getUserHash(records[i]));
    }
  }

  ns;
  return done(null, false);
}));
passport.serializeUser(function (user, cb) {
  cb(null, user.id);
});
passport.deserializeUser(function (id, cb) {
  for (var i in global.records) {
    if (global.records[i].id == id) {
      return cb(null, global.records[i]);
    }
  }

  return cb(null, false);
});
var _default = passport;
exports["default"] = _default;