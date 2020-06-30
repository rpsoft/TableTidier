"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

function updateClusterAnnotation(_x, _x2, _x3, _x4, _x5) {
  return _updateClusterAnnotation.apply(this, arguments);
}

function _updateClusterAnnotation() {
  _updateClusterAnnotation = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee14(cn, concept, cuis, isdefault, cn_override) {
    var client, done;
    return _regenerator.default.wrap(function _callee14$(_context14) {
      while (1) {
        switch (_context14.prev = _context14.next) {
          case 0:
            _context14.next = 2;
            return pool.connect();

          case 2:
            client = _context14.sent;
            _context14.next = 5;
            return client.query('INSERT INTO clusters VALUES($1,$2,$3,$4,$5) ON CONFLICT (concept) DO UPDATE SET isdefault = $4, cn_override = $5;', [cn, concept, cuis, isdefault.toLowerCase() == 'true', cn_override]).then(function (result) {
              return console.log("insert: " + result);
            }).catch(function (e) {
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
    }, _callee14, this);
  }));
  return _updateClusterAnnotation.apply(this, arguments);
}

app.get('/api/allClusterAnnotations',
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee2(req, res) {
    var allClusterAnnotations;
    return _regenerator.default.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            allClusterAnnotations =
            /*#__PURE__*/
            function () {
              var _ref2 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee() {
                var client, result;
                return _regenerator.default.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        _context.next = 2;
                        return pool.connect();

                      case 2:
                        client = _context.sent;
                        _context.next = 5;
                        return client.query("select COALESCE(clusters.cn_override, clusters.cn) as cn,concept,rep_cuis,excluded_cuis,status,proposed_name from clusters,clusterdata where clusters.cn = clusterdata.cn ORDER BY cn asc,concept asc");

                      case 5:
                        result = _context.sent;
                        client.release();
                        return _context.abrupt("return", result);

                      case 8:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee, this);
              }));

              return function allClusterAnnotations() {
                return _ref2.apply(this, arguments);
              };
            }();

            _context2.t0 = res;
            _context2.next = 4;
            return allClusterAnnotations();

          case 4:
            _context2.t1 = _context2.sent;

            _context2.t0.send.call(_context2.t0, _context2.t1);

          case 6:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this);
  }));

  return function (_x6, _x7) {
    return _ref.apply(this, arguments);
  };
}());
cleanTerm;
app.get('/api/allClusters',
/*#__PURE__*/
function () {
  var _ref3 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee4(req, res) {
    var getAllClusters;
    return _regenerator.default.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            getAllClusters =
            /*#__PURE__*/
            function () {
              var _ref4 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee3() {
                var client, result;
                return _regenerator.default.wrap(function _callee3$(_context3) {
                  while (1) {
                    switch (_context3.prev = _context3.next) {
                      case 0:
                        _context3.next = 2;
                        return pool.connect();

                      case 2:
                        client = _context3.sent;
                        _context3.next = 5;
                        return client.query("select COALESCE(cn_override , cn) as cn,  concept, cuis, isdefault, cn_override from clusters order by cn asc, concept asc");

                      case 5:
                        result = _context3.sent;
                        client.release();
                        return _context3.abrupt("return", result);

                      case 8:
                      case "end":
                        return _context3.stop();
                    }
                  }
                }, _callee3, this);
              }));

              return function getAllClusters() {
                return _ref4.apply(this, arguments);
              };
            }();

            _context4.t0 = res;
            _context4.next = 4;
            return getAllClusters();

          case 4:
            _context4.t1 = _context4.sent;

            _context4.t0.send.call(_context4.t0, _context4.t1);

          case 6:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, this);
  }));

  return function (_x8, _x9) {
    return _ref3.apply(this, arguments);
  };
}());
app.get('/api/getCUIMods',
/*#__PURE__*/
function () {
  var _ref5 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee6(req, res) {
    var getCUIMods;
    return _regenerator.default.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            getCUIMods =
            /*#__PURE__*/
            function () {
              var _ref6 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee5() {
                var client, result;
                return _regenerator.default.wrap(function _callee5$(_context5) {
                  while (1) {
                    switch (_context5.prev = _context5.next) {
                      case 0:
                        _context5.next = 2;
                        return pool.connect();

                      case 2:
                        client = _context5.sent;
                        _context5.next = 5;
                        return client.query("select * from modifiers");

                      case 5:
                        result = _context5.sent;
                        client.release();
                        return _context5.abrupt("return", result);

                      case 8:
                      case "end":
                        return _context5.stop();
                    }
                  }
                }, _callee5, this);
              }));

              return function getCUIMods() {
                return _ref6.apply(this, arguments);
              };
            }();

            _context6.t0 = res;
            _context6.next = 4;
            return getCUIMods();

          case 4:
            _context6.t1 = _context6.sent;

            _context6.t0.send.call(_context6.t0, _context6.t1);

          case 6:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6, this);
  }));

  return function (_x10, _x11) {
    return _ref5.apply(this, arguments);
  };
}());
app.get('/api/setCUIMod',
/*#__PURE__*/
function () {
  var _ref7 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee8(req, res) {
    var setCUIMod;
    return _regenerator.default.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            setCUIMod =
            /*#__PURE__*/
            function () {
              var _ref8 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee7(cui, type) {
                var client, done;
                return _regenerator.default.wrap(function _callee7$(_context7) {
                  while (1) {
                    switch (_context7.prev = _context7.next) {
                      case 0:
                        _context7.next = 2;
                        return pool.connect();

                      case 2:
                        client = _context7.sent;
                        _context7.next = 5;
                        return client.query('INSERT INTO modifiers VALUES($1,$2) ON CONFLICT (cui) DO UPDATE SET type = $2;', [cui, type]).then(function (result) {
                          return console.log("insert: " + new Date());
                        }).catch(function (e) {
                          return console.error(e.stack);
                        }).then(function () {
                          return client.release();
                        });

                      case 5:
                        done = _context7.sent;

                      case 6:
                      case "end":
                        return _context7.stop();
                    }
                  }
                }, _callee7, this);
              }));

              return function setCUIMod(_x14, _x15) {
                return _ref8.apply(this, arguments);
              };
            }();

            if (!(req.query && req.query.cui && req.query.type)) {
              _context8.next = 4;
              break;
            }

            _context8.next = 4;
            return setCUIMod(req.query.cui, req.query.type);

          case 4:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8, this);
  }));

  return function (_x12, _x13) {
    return _ref7.apply(this, arguments);
  };
}());
app.get('/api/getClusterData',
/*#__PURE__*/
function () {
  var _ref9 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee10(req, res) {
    var getClusterData;
    return _regenerator.default.wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            getClusterData =
            /*#__PURE__*/
            function () {
              var _ref10 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee9() {
                var client, result;
                return _regenerator.default.wrap(function _callee9$(_context9) {
                  while (1) {
                    switch (_context9.prev = _context9.next) {
                      case 0:
                        _context9.next = 2;
                        return pool.connect();

                      case 2:
                        client = _context9.sent;
                        _context9.next = 5;
                        return client.query("select * from clusterdata");

                      case 5:
                        result = _context9.sent;
                        client.release();
                        return _context9.abrupt("return", result);

                      case 8:
                      case "end":
                        return _context9.stop();
                    }
                  }
                }, _callee9, this);
              }));

              return function getClusterData() {
                return _ref10.apply(this, arguments);
              };
            }();

            _context10.t0 = res;
            _context10.next = 4;
            return getClusterData();

          case 4:
            _context10.t1 = _context10.sent;

            _context10.t0.send.call(_context10.t0, _context10.t1);

          case 6:
          case "end":
            return _context10.stop();
        }
      }
    }, _callee10, this);
  }));

  return function (_x16, _x17) {
    return _ref9.apply(this, arguments);
  };
}());
app.get('/api/setClusterData',
/*#__PURE__*/
function () {
  var _ref11 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee12(req, res) {
    var setClusterData;
    return _regenerator.default.wrap(function _callee12$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:
            console.log("Processing Request: " + JSON.stringify(req.query));

            setClusterData =
            /*#__PURE__*/
            function () {
              var _ref12 = (0, _asyncToGenerator2.default)(
              /*#__PURE__*/
              _regenerator.default.mark(function _callee11(cn, rep_cuis, excluded_cuis, status, proposed_name) {
                var p_name, client, done;
                return _regenerator.default.wrap(function _callee11$(_context11) {
                  while (1) {
                    switch (_context11.prev = _context11.next) {
                      case 0:
                        p_name = proposed_name && proposed_name.length > 0 && proposed_name !== "null" ? proposed_name : "";
                        _context11.next = 3;
                        return pool.connect();

                      case 3:
                        client = _context11.sent;
                        _context11.next = 6;
                        return client.query('INSERT INTO clusterdata VALUES($1,$2,$3,$4) ON CONFLICT (cn) DO UPDATE SET rep_cuis = $2, excluded_cuis = $3, status = $4, proposed_name = $5 ;', [cn, rep_cuis, excluded_cuis, status, p_name]).then(function (result) {
                          return console.log("insert: " + JSON.stringify(result));
                        }).catch(function (e) {
                          return console.error(e.stack);
                        }).then(function () {
                          return client.release();
                        });

                      case 6:
                        done = _context11.sent;

                      case 7:
                      case "end":
                        return _context11.stop();
                    }
                  }
                }, _callee11, this);
              }));

              return function setClusterData(_x20, _x21, _x22, _x23, _x24) {
                return _ref12.apply(this, arguments);
              };
            }();

            if (!(req.query && req.query.cn && req.query.status)) {
              _context12.next = 5;
              break;
            }

            _context12.next = 5;
            return setClusterData(req.query.cn, req.query.rep_cuis || "", req.query.excluded_cuis || "", req.query.status, req.query.proposed_name);

          case 5:
            res.send("updated");

          case 6:
          case "end":
            return _context12.stop();
        }
      }
    }, _callee12, this);
  }));

  return function (_x18, _x19) {
    return _ref11.apply(this, arguments);
  };
}());
app.get('/api/recordClusterAnnotation',
/*#__PURE__*/
function () {
  var _ref13 = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee13(req, res) {
    return _regenerator.default.wrap(function _callee13$(_context13) {
      while (1) {
        switch (_context13.prev = _context13.next) {
          case 0:
            console.log(JSON.stringify(req.query));

            if (!(req.query && req.query.cn.length > 0 && req.query.concept.length > 0 && req.query.cuis.length > 0 && req.query.isdefault.length > 0 && req.query.cn_override.length > 0)) {
              _context13.next = 4;
              break;
            }

            _context13.next = 4;
            return updateClusterAnnotation(req.query.cn, req.query.concept, req.query.cuis, req.query.isdefault, req.query.cn_override);

          case 4:
            res.send("saved cluster annotation: " + JSON.stringify(req.query));

          case 5:
          case "end":
            return _context13.stop();
        }
      }
    }, _callee13, this);
  }));

  return function (_x25, _x26) {
    return _ref13.apply(this, arguments);
  };
}());