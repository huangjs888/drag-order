/*
 * @Author: Huangjs
 * @Date: 2021-10-10 15:07:28
 * @LastEditors: Huangjs
 * @LastEditTime: 2021-12-29 16:11:38
 * @Description: 拖拽排序
 */

import timer from './timer';
const win = window;
const doc = win.document;
const noop = v => v;
const eventTarget = {
  preventDefault: function preventDefault(e) {
    if (!e.preventDefault) {
      e.returnValue = false;
    } else {
      e.preventDefault();
    }
  },
  stopPropagation: function stopPropagation(e) {
    if (!e.stopPropagation) {
      e.cancelBubble = true;
    } else {
      e.stopPropagation();
    }
  },
  stopImmediatePropagation: function stopImmediatePropagation(e) {
    if (!e.stopImmediatePropagation) {
      this.stopPropagation(e);
    } else {
      e.stopImmediatePropagation();
    }
  },
  on: function on(element, type, fn) {
    if (!element || !fn || !type) return this;
    if (element.addEventListener) {
      element.addEventListener(type, fn);
    } else if (element.attachEvent) {
      element.attachEvent(`on${type}`, fn);
    } else {
      element[`on${type}`] = fn;
    }
    return this;
  },
  off: function off(element, type, fn) {
    if (!element || !fn || !type) return this;
    if (element.removeEventListener) {
      element.removeEventListener(type, fn);
    } else if (element.detachEvent) {
      element.detachEvent(`on${type}`, fn);
    } else {
      element[`on${type}`] = null;
    }
    return this;
  }
};
const findElement = function findElement(element, root, flag) {
  let target = element;
  while (target && target !== root) {
    if ((target.getAttribute(flag[0]) || '').indexOf(flag[1]) !== -1) {
      return target;
    }
    target = target.parentNode;
  }
  return null;
};
const getStyleSize = function getStyleSize(element, name) {
  if (!element || !name) return [0, 0, 0, 0];
  const computed = win.getComputedStyle(element, null);
  return ['Top', 'Right', 'Bottom', 'Left'].map(expand => {
    let val = 0;
    const css = name + expand + (name === 'border' ? 'Width' : '');
    if (computed) {
      val = parseFloat(computed[css]);
    } else {
      val = parseFloat(element.style[css]);
    }
    if (Number.isNaN(val)) val = 0;
    return val;
  });
};
const getElementRect = function getElementRect({
  element = null,
  children = null,
  devider = null,
  move = null,
  drop = null
} = {}) {
  if (!element) {
    return {};
  }
  // @ts-ignore
  const {
    top,
    left,
    right,
    bottom,
    width,
    height
  } = element.getBoundingClientRect(); // 低版本浏览器也支持
  const rect = {
    element,
    top,
    left,
    right,
    bottom,
    top$: top,
    bottom$: bottom,
    move: move || noop,
    drop: drop || noop
  };
  if (!children) return rect;
  // !children.length:children不是子元素数组，取给定元素children的子元素否则直接取element的子元素，并且过滤掉text节点
  const children$ = Array.prototype.slice.call(
  // @ts-ignore
  !children.length ?
  // @ts-ignore
  (typeof children === 'object' && 'innerHTML' in children ? children : element).childNodes : children).filter(child => child.nodeType === 1);
  if (children$.length > 0) {
    rect.children = children$;
    // @ts-ignore
    rect.scrollTop = element.scrollTop || 0;
    const [children0] = children$;
    const padding = getStyleSize(element, 'padding');
    const border = getStyleSize(element, 'border');
    // 计算内部可移动区域的时候应该按照内容区域
    rect.top = top + padding[0] + border[0];
    rect.left = left + padding[3] + border[3];
    rect.right = right - padding[1] - border[1];
    rect.bottom = bottom - padding[2] - border[2];
    // 如果内部出现滚动条，那么移到padding处只会触发滚动条滚动，不会触发击中目标元素
    rect.top$ = rect.top;
    rect.bottom$ = rect.bottom;
    // @ts-ignore
    rect.width = (width || element.offsetWidth) - padding[3] - padding[1] - border[3] - border[1]; // 父元素content宽度
    rect.height =
    // @ts-ignore
    (height || element.offsetHeight) - padding[0] - padding[2] - border[0] - border[2]; // 父元素content高度
    // 每个子元素需要等宽高，等内外边距，等border，否则位置错乱
    const childMargin = getStyleSize(children0, 'margin');
    rect.childWidth = children0.offsetWidth + childMargin[3] + childMargin[1]; // content+padding+border+margin宽度
    rect.childHeight = children0.offsetHeight + childMargin[0] + childMargin[2]; // content+padding+border+margin高度
    // @ts-ignore
    const devider$ = typeof devider === 'function' ? devider(element) : devider;
    if (devider$) {
      const {
        wide = 1,
        color,
        className = ''
      } = devider$;
      let deviderWidth = wide;
      let deviderHeight = wide;
      let vector;
      if (rect.childWidth <= rect.width / 2) {
        vector = 'horizontal';
        deviderHeight = rect.childHeight; // 这个是child的content+padding+border+margin高度
      } else {
        deviderWidth = rect.childWidth; // 这个是child的content+padding+border+margin宽度
        vector = 'vertical';
      }
      const el = doc.createElement('div');
      el.className = className;
      el.style.cssText += `position:absolute;background:${color || 'none'};width:${deviderWidth}px;height:${deviderHeight}px;`;
      let {
        offsetX = 0,
        offsetY = 0
      } = devider$;
      let inParent = false;
      if (children0.offsetParent === element) {
        // 如果子元素最近的相对定位元素正好是父元素element，则直接append父元素下，相对于父类的top和left要加上父类的padding
        inParent = true;
        offsetX += padding[3];
        offsetY += padding[0];
        // @ts-ignore
        element.appendChild(el);
      } else {
        doc.body.appendChild(el);
      }
      rect.devider = {
        el,
        vector,
        inParent,
        offsetX,
        offsetY,
        width: deviderWidth,
        height: deviderHeight
      };
    }
    // 判断是否出现滚动条，是scrollHeight大于高度(content+padding+border)
    // @ts-ignore
    const maxScrollTop = element.scrollHeight - (height || element.offsetHeight);
    if (maxScrollTop > 0) {
      // 如果目标元素有滚动条,移动时触发滚动条
      rect.scroll = timer(vector => {
        let {
          scrollTop
        } = element;
        if (vector === 'down' && scrollTop < maxScrollTop) {
          // @ts-ignore
          scrollTop += 3;
          if (scrollTop > maxScrollTop) {
            // @ts-ignore
            scrollTop = maxScrollTop;
          }
        } else if (vector === 'up' && scrollTop > 0) {
          // @ts-ignore
          scrollTop -= 3;
          if (scrollTop < 0) {
            // @ts-ignore
            scrollTop = 0;
          }
        }
        // @ts-ignore
        element.scrollTop = scrollTop;
        rect.scrollTop = scrollTop;
        if (scrollTop === 0 || scrollTop === maxScrollTop) {
          rect.scroll.stop();
        }
      }, 10);
      // 如果内部出现滚动条，那么移到padding处只会触发滚动条滚动，不会触发击中目标元素，此处校正一下
      rect.top$ = top + border[0];
      rect.bottom$ = bottom - border[2];
    }
  }
  return rect;
};
function dragOrder(elements, targets) {
  const elements$ = Array.isArray(elements) ? elements : [elements];
  const targets$ = Array.isArray(targets) ? targets : [targets];
  let isMouseDown = false;
  elements$.forEach(el => {
    if (!el) return;
    const {
      bubble,
      element,
      helper
    } = el;
    function mousedown(e) {
      const event = e || win.event;
      eventTarget.stopImmediatePropagation(event);
      if (event.which !== 1) return;
      const curItem = bubble ? findElement(event.srcElement || event.target, this, bubble) : this;
      if (!curItem) return;
      isMouseDown = true;
      let isWorking = false;
      let mouseStart = {
        x: event.clientX,
        y: event.clientY
      };
      let helperStart = {
        el: null,
        x: 0,
        y: 0,
        l: 0,
        t: 0
      };
      let hitRects = [];
      const docOffset = {
        gbcr: curItem.getBoundingClientRect(),
        ct: doc.documentElement.clientTop || doc.body.clientTop || 0,
        cl: doc.documentElement.clientLeft || doc.body.clientLeft || 0,
        st: win.pageYOffset || doc.documentElement.scrollTop,
        sl: win.pageXOffset || doc.documentElement.scrollLeft
      };
      function mousemove(ee) {
        const event2 = ee || win.event;
        eventTarget.preventDefault(event2);
        if (!isMouseDown) return;
        const {
          clientX,
          clientY
        } = event2;
        const deltY = clientY - mouseStart.y;
        const deltX = clientX - mouseStart.x;
        // 上下左右移动在3像素以内不认为是要拖拽
        if (Math.max(Math.abs(deltX), Math.abs(deltY)) < 3) return;
        if (!isWorking) {
          isWorking = true;
          const {
            offsetX = 0,
            offsetY = 0,
            className = '',
            domEl,
            isMouse
          } = (typeof helper === 'function' ? helper(curItem) : helper) || {};
          let cssText = 'position:absolute;transition:none;opacity:1;';
          if (!domEl) {
            helperStart.el = curItem.cloneNode(true);
            const styles = win.getComputedStyle(curItem);
            cssText += `width:${styles.width};height:${styles.height};`;
          } else {
            helperStart.el = domEl;
          }
          // @ts-ignore
          helperStart.el.className = className;
          // @ts-ignore
          helperStart.el.style.cssText += cssText;
          helperStart.t = curItem.scrollTop;
          helperStart.l = curItem.scrollLeft;
          // 以下就是jquery的offset()方法的核心
          helperStart.y = (isMouse ? clientY : docOffset.gbcr.top) + offsetY + docOffset.st - docOffset.ct;
          helperStart.x = (isMouse ? clientX : docOffset.gbcr.left) + offsetX + docOffset.sl - docOffset.cl;
          // @ts-ignore
          doc.body.appendChild(helperStart.el);
          // 循环获取每一个目标元素的位置尺寸信息
          hitRects = targets$.map(t => getElementRect(t));
        }
        // 设置helper元素位置
        // @ts-ignore
        helperStart.el.style.top = `${helperStart.y + deltY}px`;
        // @ts-ignore
        helperStart.el.style.left = `${helperStart.x + deltX}px`;
        // 循环每一个目标元素，进行比较确定撞击
        hitRects.forEach(rect => {
          if (rect.scroll) {
            // 处理定时器
            if (clientY >= rect.bottom$ && clientX < rect.right && clientX > rect.left) {
              // 触发目标元素滚动条向下滚动，如果滚到底部就不再滚
              rect.scroll.start('down');
            } else if (clientY <= rect.top$ && clientX < rect.right && clientX > rect.left) {
              // 触发目标元素滚动条向上滚动，如果滚到顶部就不再滚
              rect.scroll.start('up');
            } else {
              // 在目标元素上下区域内，就不滚动了
              rect.scroll.stop();
            }
          }
          if (clientY < rect.bottom$ && clientY > rect.top$ && clientX < rect.right && clientX > rect.left) {
            // 鼠标移动到撞击元素范围内或父代理元素内
            if (rect.children) {
              // 表示撞击目标元素内部的子元素
              // 判断鼠标在子元素上实际可移动范围
              const allCeils = rect.children.length; // 一共allCeils个元素
              const maxRows = Math.floor(rect.width / rect.childWidth); // 一行中最多展示maxRows个元素，floor方法意思是不够一个的不要
              const fullCols = Math.floor(allCeils / maxRows); // 共有fullCols行是填满的
              const restCeils = allCeils % maxRows; // 还剩余restCeils个元素（一定是未占满行的）
              const top$ = rect.top - (rect.scrollTop || 0);
              const left$ = rect.left - 0; // 横向无滚动，所以为0
              const deltRectX = clientX - left$;
              const deltRectY = clientY - top$;
              if (deltRectX > 0 && deltRectX <= maxRows * rect.childWidth &&
              // 被填满行的横向范围
              deltRectY > 0 && deltRectY <= fullCols * rect.childHeight ||
              // 被填满行的竖向范围
              deltRectX > 0 && deltRectX <= restCeils * rect.childWidth &&
              // 未填满行的横向范围
              deltRectY > fullCols * rect.childHeight && deltRectY <= (fullCols + 1) * rect.childHeight // 未填满行的竖向范围
              ) {
                const rows = Math.ceil(deltRectX / rect.childWidth); // 在可移动范围内，鼠标移到横向第几列
                const cols = Math.ceil(deltRectY / rect.childHeight); // 在可移动范围内，鼠标移到竖向第几行
                if (rect.devider && rect.devider.el) {
                  const deviderOffsetTop = rect.devider.offsetY + (rect.devider.inParent ? 0 : top$);
                  const deviderOffsetLeft = rect.devider.offsetX + (rect.devider.inParent ? 0 : left$);
                  let deviderPosition = '';
                  let deviderTop = 0;
                  let deviderLeft = 0;
                  if (rect.devider.vector === 'horizontal') {
                    // 一行多个，左右排序
                    const rowsMiddle = (rows - 0.5) * rect.childWidth;
                    if (deltRectX < rowsMiddle) {
                      // 鼠标在当前元素左半边，分割线在当前元素左面
                      deviderPosition = 'left';
                      deviderTop = deviderOffsetTop + (cols - 1) * rect.childHeight;
                      deviderLeft = deviderOffsetLeft + (rows - 1) * rect.childWidth - (rect.devider.width || 0) / 2;
                    } else {
                      // 鼠标在当前元素右半边，分割线在当前元素右面
                      deviderPosition = 'right';
                      deviderTop = deviderOffsetTop + (cols - 1) * rect.childHeight;
                      deviderLeft = deviderOffsetLeft + rows * rect.childWidth - (rect.devider.width || 0) / 2;
                    }
                  } else {
                    // 一行一个，上下排序
                    const colsMiddle = (cols - 0.5) * rect.childHeight;
                    if (deltRectY < colsMiddle) {
                      // 鼠标在当前元素上半边，分割线在当前元素上面
                      deviderPosition = 'top';
                      deviderTop = deviderOffsetTop + (cols - 1) * rect.childHeight - (rect.devider.height || 0) / 2;
                      deviderLeft = deviderOffsetLeft + (rows - 1) * rect.childWidth;
                    } else {
                      // 鼠标在当前元素下半边，分割线在当前元素下面
                      deviderPosition = 'bottom';
                      deviderTop = deviderOffsetTop + cols * rect.childHeight - (rect.devider.height || 0) / 2;
                      deviderLeft = deviderOffsetLeft + (rows - 1) * rect.childWidth;
                    }
                  }
                  rect.devider.el.style.top = `${deviderTop}px`;
                  rect.devider.el.style.left = `${deviderLeft}px`;
                  rect.devider.position = deviderPosition;
                }
                const index = maxRows * (cols - 1) + rows;
                const hitItem = rect.children[index - 1];
                if (hitItem !== rect.hitItem) {
                  const obj = {
                    enter: hitItem
                  }; // 当前元素触发进入
                  if (rect.hitItem) {
                    // 如果上一个存在，则上一个元素触发离开
                    obj.leave = rect.hitItem;
                  }
                  rect.move(obj, curItem, rect.element);
                  rect.hitItem = hitItem;
                } else {
                  // 元素没变化，触发移动
                  rect.move({
                    move: rect.hitItem
                  }, curItem, rect.element);
                }
              } else {
                if (rect.hitItem) {
                  // 如果上一个元素存在，则上一个元素触发离开
                  if (rect.devider && rect.devider.el) {
                    rect.devider.el.style.top = `${-10 - rect.devider.height}px`;
                    rect.devider.el.style.left = `${-10 - rect.devider.width}px`;
                    rect.devider.position = null;
                  }
                  rect.move({
                    leave: rect.hitItem
                  }, curItem, rect.element);
                }
                rect.hitItem = null;
              }
            } else {
              const hitItem = rect.element;
              if (hitItem !== rect.hitItem) {
                const obj = {
                  enter: hitItem
                }; // 当前元素触发进入
                if (rect.hitItem) {
                  // 如果上一个元素存在，则上一个元素触发离开
                  obj.leave = rect.hitItem;
                }
                rect.move(obj, curItem, rect.element);
                rect.hitItem = hitItem;
              } else {
                // 元素没变化，触发移动
                rect.move({
                  move: rect.hitItem
                }, curItem, rect.element);
              }
            }
          } else {
            // 这面再写一次，是子元素和父元素之间没有间距的情况，可能不会触发子元素的移除事件
            if (rect.hitItem) {
              // 如果上一个元素存在，则上一个元素触发离开
              if (rect.devider && rect.devider.el) {
                rect.devider.el.style.top = `${-10 - rect.devider.height}px`;
                rect.devider.el.style.left = `${-10 - rect.devider.width}px`;
                rect.devider.position = null;
              }
              rect.move({
                leave: rect.hitItem
              }, curItem, rect.element);
            }
            rect.hitItem = null;
          }
        });
      }
      function mouseup(ee) {
        const event2 = ee || win.event;
        eventTarget.preventDefault(event2);
        eventTarget.off(doc, 'mousemove', mousemove);
        eventTarget.off(doc, 'mouseup', mouseup);
        isMouseDown = false;
        if (isWorking) {
          let back = true;
          hitRects.forEach(rect => {
            if (rect.scroll) {
              // 元素拖拽到范围之外，触发滚动条滚动，突然松开，应该停止滚动
              rect.scroll.stop(); // 停止滚动
            }

            let position;
            if (rect.devider && rect.devider.el) {
              // 获取分界线在撞击元素的位置
              if (rect.devider.position) {
                position = rect.devider.position;
              }
              if (rect.devider.el.parentNode) {
                rect.devider.el.parentNode.removeChild(rect.devider.el);
              }
            }
            const noback = rect.drop(rect.hitItem, curItem, position, rect.element);
            if (back) back = !noback;
          });
          if (helperStart.el) {
            const style = {
              opacity: 0,
              transition: 'top .3s, left .3s, opacity .3s'
            };
            if (back) {
              // 表示一个撞击元素也没有，就直接返回了
              // 检查父元素是否滚动了滚动条，移走了原有元素
              style.top = `${helperStart.t + helperStart.y - curItem.scrollTop}px`;
              style.left = `${helperStart.l + helperStart.x - curItem.scrollLeft}px`;
            }
            Object.keys(style).forEach(key => {
              // @ts-ignore
              helperStart.el.style[key] = style[key];
            });
          }
          setTimeout(() => {
            // @ts-ignore
            if (helperStart.el && helperStart.el.parentNode) {
              // @ts-ignore
              helperStart.el.parentNode.removeChild(helperStart.el);
            }
            hitRects = [];
            // @ts-ignore
            helperStart = {};
            // @ts-ignore
            mouseStart = {};
          }, 300);
          isWorking = false;
        }
      }
      eventTarget.on(doc, 'mousemove', mousemove);
      eventTarget.on(doc, 'mouseup', mouseup);
    }
    eventTarget.off(element, 'mousedown', mousedown).on(element, 'mousedown', mousedown);
  });
}
export default dragOrder;