/*
 * @Author: Huangjs
 * @Date: 2021-10-10 15:07:28
 * @LastEditors: Huangjs
 * @LastEditTime: 2021-12-29 16:11:12
 * @Description: 定时器，相当于setInterval
 */

const skey = '__stop__';
const tkey = '__timer__';
const call = function call(...args) {
  const this0 = this;
  clearTimeout(this0[tkey]);
  this0[tkey] = setTimeout(() => {
    if (!this0[skey]) {
      // @ts-ignore
      this0.action.call(this0, ...args);
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
Timer.prototype.start = function start(...args) {
  this[skey] = false;
  if (this.immediately) {
    this.action.call(this, ...args); // 如果设置立即执行，则定时器会
  }
  call.apply(this, args);
};
Timer.prototype.stop = function stop() {
  this[skey] = true;
};

export default (...args) => {
  return new Timer(...args);
};
