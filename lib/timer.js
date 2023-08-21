"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");
exports.__esModule = true;
exports.default = void 0;
var _construct2 = _interopRequireDefault(require("@babel/runtime-corejs3/helpers/construct"));
var _concat = _interopRequireDefault(require("@babel/runtime-corejs3/core-js/instance/concat"));
/*
 * @Author: Huangjs
 * @Date: 2021-10-10 15:07:28
 * @LastEditors: Huangjs
 * @LastEditTime: 2021-12-29 16:11:12
 * @Description: 定时器，相当于setInterval
 */

var skey = '__stop__';
var tkey = '__timer__';
var call = function call() {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }
  var this0 = this;
  clearTimeout(this0[tkey]);
  this0[tkey] = setTimeout(function () {
    if (!this0[skey]) {
      var _this0$action, _context;
      // @ts-ignore
      (_this0$action = this0.action).call.apply(_this0$action, (0, _concat.default)(_context = [this0]).call(_context, args));
      call.apply(this0, args);
    }
    // @ts-ignore
  }, this0.delay);
};
function Timer(action, delay, immediately) {
  this[skey] = true;
  this[tkey] = null;
  this.action = typeof action === 'function' ? action : function a() {}; // 定时器到时间需要执行的函数
  this.delay = delay || 1000; // 定时器间隔delay后执行一次
  this.immediately = !!immediately || typeof immediately === 'undefined'; // 设置true后第一次会立即执行，后续间隔时间执行，false后，会先间隔时间在执行
}

Timer.prototype.start = function start() {
  this[skey] = false;
  for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    args[_key2] = arguments[_key2];
  }
  if (this.immediately) {
    var _this$action, _context2;
    (_this$action = this.action).call.apply(_this$action, (0, _concat.default)(_context2 = [this]).call(_context2, args)); // 如果设置立即执行，则定时器会
  }

  call.apply(this, args);
};
Timer.prototype.stop = function stop() {
  this[skey] = true;
};
var _default = function _default() {
  for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
    args[_key3] = arguments[_key3];
  }
  return (0, _construct2.default)(Timer, args);
};
exports.default = _default;