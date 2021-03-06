/* eslint-disable no-param-reassign */
/*
 * @Author: Huangjs
 * @Date: 2021-10-10 15:07:28
 * @LastEditors: Huangjs
 * @LastEditTime: 2021-12-29 16:11:38
 * @Description: ζζ½ζεΊ
 */

import timer from './timer';

const win = window;
const doc = win.document;
const noop = (v) => v;
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
  },
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
  return ['Top', 'Right', 'Bottom', 'Left'].map((expand) => {
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
  drop = null,
} = {}) {
  if (!element) {
    return {};
  }
  const { top, left, right, bottom, width, height } = element.getBoundingClientRect(); // δ½ηζ¬ζ΅θ§ε¨δΉζ―ζ
  const rect = {
    element,
    top,
    left,
    right,
    bottom,
    top$: top,
    bottom$: bottom,
    move: move || noop,
    drop: drop || noop,
  };
  if (!children) return rect;
  // !children.length:childrenδΈζ―ε­εη΄ ζ°η»οΌεη»ε?εη΄ childrenηε­εη΄ ε¦εη΄ζ₯εelementηε­εη΄ οΌεΉΆδΈθΏζ»€ζtextθηΉ
  const children$ = Array.prototype.slice
    .call(
      !children.length
        ? (typeof children === 'object' && 'innerHTML' in children ? children : element).childNodes
        : children
    )
    .filter((child) => child.nodeType === 1);
  if (children$.length > 0) {
    rect.children = children$;
    rect.scrollTop = element.scrollTop || 0;
    const [children0] = children$;
    const padding = getStyleSize(element, 'padding');
    const border = getStyleSize(element, 'border');
    // θ?‘η?ει¨ε―η§»ε¨εΊεηζΆεεΊθ―₯ζη§εε?ΉεΊε
    rect.top = top + padding[0] + border[0];
    rect.left = left + padding[3] + border[3];
    rect.right = right - padding[1] - border[1];
    rect.bottom = bottom - padding[2] - border[2];
    // ε¦ζει¨εΊη°ζ»ε¨ζ‘οΌι£δΉη§»ε°paddingε€εͺδΌθ§¦εζ»ε¨ζ‘ζ»ε¨οΌδΈδΌθ§¦εε»δΈ­η?ζ εη΄ 
    rect.top$ = rect.top;
    rect.bottom$ = rect.bottom;
    rect.width = (width || element.offsetWidth) - padding[3] - padding[1] - border[3] - border[1]; // ηΆεη΄ contentε?½εΊ¦
    rect.height = (height || element.offsetHeight) - padding[0] - padding[2] - border[0] - border[2]; // ηΆεη΄ contentι«εΊ¦
    // ζ―δΈͺε­εη΄ ιθ¦η­ε?½ι«οΌη­εε€θΎΉθ·οΌη­borderοΌε¦εδ½η½?ιδΉ±
    const childMargin = getStyleSize(children0, 'margin');
    rect.childWidth = children0.offsetWidth + childMargin[3] + childMargin[1]; // content+padding+border+marginε?½εΊ¦
    rect.childHeight = children0.offsetHeight + childMargin[0] + childMargin[2]; // content+padding+border+marginι«εΊ¦
    const devider$ = typeof devider === 'function' ? devider(element) : devider;
    if (devider$) {
      const { wide = 1, color, className = '' } = devider$;
      let deviderWidth = wide;
      let deviderHeight = wide;
      let vector;
      if (rect.childWidth <= rect.width / 2) {
        vector = 'horizontal';
        deviderHeight = rect.childHeight; // θΏδΈͺζ―childηcontent+padding+border+marginι«εΊ¦
      } else {
        deviderWidth = rect.childWidth; // θΏδΈͺζ―childηcontent+padding+border+marginε?½εΊ¦
        vector = 'vertical';
      }
      const el = doc.createElement('div');
      el.className = className;
      el.style.cssText += `position:absolute;background:${
        color || 'none'
      };width:${deviderWidth}px;height:${deviderHeight}px;`;
      let { offsetX = 0, offsetY = 0 } = devider$;
      let inParent = false;
      if (children0.offsetParent === element) {
        // ε¦ζε­εη΄ ζθΏηηΈε―Ήε?δ½εη΄ ζ­£ε₯½ζ―ηΆεη΄ elementοΌεη΄ζ₯appendηΆεη΄ δΈοΌηΈε―ΉδΊηΆη±»ηtopεleftθ¦ε δΈηΆη±»ηpadding
        inParent = true;
        offsetX += padding[3];
        offsetY += padding[0];
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
        height: deviderHeight,
      };
    }
    // ε€ζ­ζ―ε¦εΊη°ζ»ε¨ζ‘οΌζ―scrollHeightε€§δΊι«εΊ¦(content+padding+border)
    const maxScrollTop = element.scrollHeight - (height || element.offsetHeight);
    if (maxScrollTop > 0) {
      // ε¦ζη?ζ εη΄ ζζ»ε¨ζ‘,η§»ε¨ζΆθ§¦εζ»ε¨ζ‘
      rect.scroll = timer((vector) => {
        let { scrollTop } = element;
        if (vector === 'down' && scrollTop < maxScrollTop) {
          scrollTop += 3;
          if (scrollTop > maxScrollTop) {
            scrollTop = maxScrollTop;
          }
        } else if (vector === 'up' && scrollTop > 0) {
          scrollTop -= 3;
          if (scrollTop < 0) {
            scrollTop = 0;
          }
        }
        element.scrollTop = scrollTop;
        rect.scrollTop = scrollTop;
        if (scrollTop === 0 || scrollTop === maxScrollTop) {
          rect.scroll.stop();
        }
      }, 10);
      // ε¦ζει¨εΊη°ζ»ε¨ζ‘οΌι£δΉη§»ε°paddingε€εͺδΌθ§¦εζ»ε¨ζ‘ζ»ε¨οΌδΈδΌθ§¦εε»δΈ­η?ζ εη΄ οΌζ­€ε€ζ ‘ζ­£δΈδΈ
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
  elements$.forEach((el) => {
    if (!el) return;
    const { bubble, element, helper } = el;
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
        y: event.clientY,
      };
      let helperStart = {
        el: null,
        x: 0,
        y: 0,
        l: 0,
        t: 0,
      };
      let hitRects = [];
      const docOffset = {
        gbcr: curItem.getBoundingClientRect(),
        ct: doc.documentElement.clientTop || doc.body.clientTop || 0,
        cl: doc.documentElement.clientLeft || doc.body.clientLeft || 0,
        st: win.pageYOffset || doc.documentElement.scrollTop,
        sl: win.pageXOffset || doc.documentElement.scrollLeft,
      };
      function mousemove(ee) {
        const event2 = ee || win.event;
        eventTarget.preventDefault(event2);
        if (!isMouseDown) return;
        const { clientX, clientY } = event2;
        const deltY = clientY - mouseStart.y;
        const deltX = clientX - mouseStart.x;
        // δΈδΈε·¦ε³η§»ε¨ε¨3εη΄ δ»₯εδΈθ?€δΈΊζ―θ¦ζζ½
        if (Math.max(Math.abs(deltX), Math.abs(deltY)) < 3) return;
        if (!isWorking) {
          isWorking = true;
          const {
            offsetX = 0,
            offsetY = 0,
            className = '',
            domEl,
            isMouse,
          } = (typeof helper === 'function' ? helper(curItem) : helper) || {};
          let cssText = 'position:absolute;transition:none;opacity:1;';
          if (!domEl) {
            helperStart.el = curItem.cloneNode(true);
            const styles = win.getComputedStyle(curItem);
            cssText += `width:${styles.width};height:${styles.height};`;
          } else {
            helperStart.el = domEl;
          }
          helperStart.el.className = className;
          helperStart.el.style.cssText += cssText;
          helperStart.t = curItem.scrollTop;
          helperStart.l = curItem.scrollLeft;
          // δ»₯δΈε°±ζ―jqueryηoffset()ζΉζ³ηζ ΈεΏ
          helperStart.y = (isMouse ? clientY : docOffset.gbcr.top) + offsetY + docOffset.st - docOffset.ct;
          helperStart.x = (isMouse ? clientX : docOffset.gbcr.left) + offsetX + docOffset.sl - docOffset.cl;
          doc.body.appendChild(helperStart.el);
          // εΎͺη―θ·εζ―δΈδΈͺη?ζ εη΄ ηδ½η½?ε°Ίε―ΈδΏ‘ζ―
          hitRects = targets$.map((t) => getElementRect(t));
        }
        // θ?Ύη½?helperεη΄ δ½η½?
        helperStart.el.style.top = `${helperStart.y + deltY}px`;
        helperStart.el.style.left = `${helperStart.x + deltX}px`;
        // εΎͺη―ζ―δΈδΈͺη?ζ εη΄ οΌθΏθ‘ζ―θΎη‘?ε?ζε»
        hitRects.forEach((rect) => {
          if (rect.scroll) {
            // ε€ηε?ζΆε¨
            if (clientY >= rect.bottom$ && clientX < rect.right && clientX > rect.left) {
              // θ§¦εη?ζ εη΄ ζ»ε¨ζ‘εδΈζ»ε¨οΌε¦ζζ»ε°εΊι¨ε°±δΈεζ»
              rect.scroll.start('down');
            } else if (clientY <= rect.top$ && clientX < rect.right && clientX > rect.left) {
              // θ§¦εη?ζ εη΄ ζ»ε¨ζ‘εδΈζ»ε¨οΌε¦ζζ»ε°ι‘Άι¨ε°±δΈεζ»
              rect.scroll.start('up');
            } else {
              // ε¨η?ζ εη΄ δΈδΈεΊεεοΌε°±δΈζ»ε¨δΊ
              rect.scroll.stop();
            }
          }
          if (clientY < rect.bottom$ && clientY > rect.top$ && clientX < rect.right && clientX > rect.left) {
            // ιΌ ζ η§»ε¨ε°ζε»εη΄ θε΄εζηΆδ»£ηεη΄ ε
            if (rect.children) {
              // θ‘¨η€Ίζε»η?ζ εη΄ ει¨ηε­εη΄ 
              // ε€ζ­ιΌ ζ ε¨ε­εη΄ δΈε?ιε―η§»ε¨θε΄
              const allCeils = rect.children.length; // δΈε±allCeilsδΈͺεη΄ 
              const maxRows = Math.floor(rect.width / rect.childWidth); // δΈθ‘δΈ­ζε€ε±η€ΊmaxRowsδΈͺεη΄ οΌfloorζΉζ³ζζζ―δΈε€δΈδΈͺηδΈθ¦
              const fullCols = Math.floor(allCeils / maxRows); // ε±ζfullColsθ‘ζ―ε‘«ζ»‘η
              const restCeils = allCeils % maxRows; // θΏε©δ½restCeilsδΈͺεη΄ οΌδΈε?ζ―ζͺε ζ»‘θ‘ηοΌ
              const top$ = rect.top - (rect.scrollTop || 0);
              const left$ = rect.left - 0; // ζ¨ͺεζ ζ»ε¨οΌζδ»₯δΈΊ0
              const deltRectX = clientX - left$;
              const deltRectY = clientY - top$;
              if (
                (deltRectX > 0 &&
                  deltRectX <= maxRows * rect.childWidth && // θ’«ε‘«ζ»‘θ‘ηζ¨ͺεθε΄
                  deltRectY > 0 &&
                  deltRectY <= fullCols * rect.childHeight) || // θ’«ε‘«ζ»‘θ‘ηη«εθε΄
                (deltRectX > 0 &&
                  deltRectX <= restCeils * rect.childWidth && // ζͺε‘«ζ»‘θ‘ηζ¨ͺεθε΄
                  deltRectY > fullCols * rect.childHeight &&
                  deltRectY <= (fullCols + 1) * rect.childHeight) // ζͺε‘«ζ»‘θ‘ηη«εθε΄
              ) {
                const rows = Math.ceil(deltRectX / rect.childWidth); // ε¨ε―η§»ε¨θε΄εοΌιΌ ζ η§»ε°ζ¨ͺεη¬¬ε ε
                const cols = Math.ceil(deltRectY / rect.childHeight); // ε¨ε―η§»ε¨θε΄εοΌιΌ ζ η§»ε°η«εη¬¬ε θ‘
                if (rect.devider && rect.devider.el) {
                  const deviderOffsetTop = rect.devider.offsetY + (rect.devider.inParent ? 0 : top$);
                  const deviderOffsetLeft = rect.devider.offsetX + (rect.devider.inParent ? 0 : left$);
                  let deviderPosition = '';
                  let deviderTop = 0;
                  let deviderLeft = 0;
                  if (rect.devider.vector === 'horizontal') {
                    // δΈθ‘ε€δΈͺοΌε·¦ε³ζεΊ
                    const rowsMiddle = (rows - 0.5) * rect.childWidth;
                    if (deltRectX < rowsMiddle) {
                      // ιΌ ζ ε¨ε½εεη΄ ε·¦εθΎΉοΌεε²ηΊΏε¨ε½εεη΄ ε·¦ι’
                      deviderPosition = 'left';
                      deviderTop = deviderOffsetTop + (cols - 1) * rect.childHeight;
                      deviderLeft = deviderOffsetLeft + (rows - 1) * rect.childWidth - (rect.devider.width || 0) / 2;
                    } else {
                      // ιΌ ζ ε¨ε½εεη΄ ε³εθΎΉοΌεε²ηΊΏε¨ε½εεη΄ ε³ι’
                      deviderPosition = 'right';
                      deviderTop = deviderOffsetTop + (cols - 1) * rect.childHeight;
                      deviderLeft = deviderOffsetLeft + rows * rect.childWidth - (rect.devider.width || 0) / 2;
                    }
                  } else {
                    // δΈθ‘δΈδΈͺοΌδΈδΈζεΊ
                    const colsMiddle = (cols - 0.5) * rect.childHeight;
                    if (deltRectY < colsMiddle) {
                      // ιΌ ζ ε¨ε½εεη΄ δΈεθΎΉοΌεε²ηΊΏε¨ε½εεη΄ δΈι’
                      deviderPosition = 'top';
                      deviderTop = deviderOffsetTop + (cols - 1) * rect.childHeight - (rect.devider.height || 0) / 2;
                      deviderLeft = deviderOffsetLeft + (rows - 1) * rect.childWidth;
                    } else {
                      // ιΌ ζ ε¨ε½εεη΄ δΈεθΎΉοΌεε²ηΊΏε¨ε½εεη΄ δΈι’
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
                  const obj = { enter: hitItem }; // ε½εεη΄ θ§¦εθΏε₯
                  if (rect.hitItem) {
                    // ε¦ζδΈδΈδΈͺε­ε¨οΌεδΈδΈδΈͺεη΄ θ§¦εη¦»εΌ
                    obj.leave = rect.hitItem;
                  }
                  rect.move(obj, curItem, rect.element);
                  rect.hitItem = hitItem;
                } else {
                  // εη΄ ζ²‘εεοΌθ§¦εη§»ε¨
                  rect.move({ move: rect.hitItem }, curItem, rect.element);
                }
              } else {
                if (rect.hitItem) {
                  // ε¦ζδΈδΈδΈͺεη΄ ε­ε¨οΌεδΈδΈδΈͺεη΄ θ§¦εη¦»εΌ
                  if (rect.devider && rect.devider.el) {
                    rect.devider.el.style.top = `${-10 - rect.devider.height}px`;
                    rect.devider.el.style.left = `${-10 - rect.devider.width}px`;
                    rect.devider.position = null;
                  }
                  rect.move({ leave: rect.hitItem }, curItem, rect.element);
                }
                rect.hitItem = null;
              }
            } else {
              const hitItem = rect.element;
              if (hitItem !== rect.hitItem) {
                const obj = { enter: hitItem }; // ε½εεη΄ θ§¦εθΏε₯
                if (rect.hitItem) {
                  // ε¦ζδΈδΈδΈͺεη΄ ε­ε¨οΌεδΈδΈδΈͺεη΄ θ§¦εη¦»εΌ
                  obj.leave = rect.hitItem;
                }
                rect.move(obj, curItem, rect.element);
                rect.hitItem = hitItem;
              } else {
                // εη΄ ζ²‘εεοΌθ§¦εη§»ε¨
                rect.move({ move: rect.hitItem }, curItem, rect.element);
              }
            }
          } else {
            // θΏι’εεδΈζ¬‘οΌζ―ε­εη΄ εηΆεη΄ δΉι΄ζ²‘ζι΄θ·ηζε΅οΌε―θ½δΈδΌθ§¦εε­εη΄ ηη§»ι€δΊδ»Ά
            if (rect.hitItem) {
              // ε¦ζδΈδΈδΈͺεη΄ ε­ε¨οΌεδΈδΈδΈͺεη΄ θ§¦εη¦»εΌ
              if (rect.devider && rect.devider.el) {
                rect.devider.el.style.top = `${-10 - rect.devider.height}px`;
                rect.devider.el.style.left = `${-10 - rect.devider.width}px`;
                rect.devider.position = null;
              }
              rect.move({ leave: rect.hitItem }, curItem, rect.element);
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
          hitRects.forEach((rect) => {
            if (rect.scroll) {
              // εη΄ ζζ½ε°θε΄δΉε€οΌθ§¦εζ»ε¨ζ‘ζ»ε¨οΌηͺηΆζΎεΌοΌεΊθ―₯εζ­’ζ»ε¨
              rect.scroll.stop(); // εζ­’ζ»ε¨
            }
            let position;
            if (rect.devider && rect.devider.el) {
              // θ·εεηηΊΏε¨ζε»εη΄ ηδ½η½?
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
              transition: 'top .3s, left .3s, opacity .3s',
            };
            if (back) {
              // θ‘¨η€ΊδΈδΈͺζε»εη΄ δΉζ²‘ζοΌε°±η΄ζ₯θΏεδΊ
              // ζ£ζ₯ηΆεη΄ ζ―ε¦ζ»ε¨δΊζ»ε¨ζ‘οΌη§»θ΅°δΊεζεη΄ 
              style.top = `${helperStart.t + helperStart.y - curItem.scrollTop}px`;
              style.left = `${helperStart.l + helperStart.x - curItem.scrollLeft}px`;
            }
            Object.keys(style).forEach((key) => {
              helperStart.el.style[key] = style[key];
            });
          }
          setTimeout(() => {
            if (helperStart.el && helperStart.el.parentNode) {
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
