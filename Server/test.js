"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var myvar = "melk";
var myvar2 = "melk2";

var melacome = function melacome() {
  console.log(myvar2);
};

melacome(myvar2);
console.log(myvar + "  inside the script");
console.log(CONFIG);
var _default = {
  melacome: melacome,
  myvar: myvar,
  myvar2: myvar2
};
exports.default = _default;