"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _security = _interopRequireWildcard(require("../security.js"));

// Admin Users
var express = require('express');

var router = express.Router();
// CONFIG.api_base_url+'/login'
router.route('/login')
/**
 * Login user
 *
 * @swagger
 * /login:
 *   post:
 *     description: Login
 *     summary: Login
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - username
 *               - password
 *             examples:
 *               James:
 *                 username: james
 *                 password: password
 * 
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  type: object
 *                  required:
 *                    - title
 *                    - id
 *                  properties:
 *                    title:
 *                      type: string
 *                    id:
 *                      type: integer
 *       401:
 *         description: Unauthorised
 *       500:
 *         description: Failed
 * 
 */
.post(function (req, res, next) {
  _security["default"].authenticate('custom', function (err, user, info) {
    // console.log("login_req",JSON.stringify(req))
    if (err) {
      res.status(500).json({
        status: "failed",
        payload: err
      });
    } else if (!user) {
      res.status(401).json({
        status: "unauthorised",
        payload: null
      });
    } else {
      res.status(200).json({
        status: "success",
        payload: user
      });
    }
  })(req, res, next);
});
router.route('/createUser')
/**
 * Create a user.
 * @param {object} user - user info.
 * 
 * @swagger
 * /createUser:
 *     description: Create a user
 *     summary: Create a user
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *               - username
 *               - password
 *             examples:
 *               James:
 *                 username: james
 *                 password: password
 * 
 *     responses:
 *       200:
 *         description: Created
 *       500:
 *         description: Failed
 */
.post( /*#__PURE__*/function () {
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
            res.status(200).json({
              status: 'success',
              payload: result
            });
            _context.next = 10;
            break;

          case 7:
            _context.prev = 7;
            _context.t0 = _context["catch"](0);
            res.status(500).json({
              status: 'failed',
              payload: _context.t0
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
}());
var _default = router;
exports["default"] = _default;