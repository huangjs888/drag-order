<!--
 * @Author: Huangjs
 * @Date: 2021-05-10 15:55:29
 * @LastEditors: Huangjs
 * @LastEditTime: 2021-12-29 16:07:48
 * @Description: ******
-->
## drag-order
对栅栏结构里的item，实现拖拽，排序等操作。
### 使用方法
```javascript
import dragOrder from '@huangjs888/drag-order';

 // 数组代表有多个元素去拖起操作，一个的时候可以直接设置为对象
const elements = [
  {
    // mousedown注册对象
    element: document.createElement('div'),
    // 有值表示使用element的子元素作为真正的mousedown注册对象，那么element则为代理,key和value则为寻找该元素的关键点
    bubble: ['data-id', 'list-item'],
    // mousedown后生成的随鼠标一起移动的元素，返回元素对象及初始坐标，可以直接是一个生成好的对象
    helper: function helper() {
      return {
        domEl: document.createElement('div'), // 使用自己构造的，不使用，这不传，会自动构造和拖动元素一样的元素
        className: 'helper', // 样式class
        isMouse: true, // 计算位置时是参照左顶点位置（false）还是鼠标当前位置（true）
        offsetX: -10, // x偏移量
        offsetY: -6, // y偏移量
      };
    },
  },
];
// 数组代表可判断撞击元素为多个，一个的时候可以直接设置为对象
const targets = [
  {
    // 需要判断是否击中的目标元素或容器
    element: document.createElement('div'),
    // 表示判断击中element的子孙元素，element则为容器，默认所有的子元素等宽高，另外子元素较多，父元素出现滚动条，则拖拽时会判断自动滚动，默认只有竖向滚动条，无左右滚动条
    children: [],
    // children为true的时候可以设置，设置后返还排序时相应的分割线，比如放在谁和谁之间，会有个分割线，可以直接是一个生成好的对象
    devider: function devider() {
      return {
        className: 'devider', // 样式class
        offsetX: 0, // x偏移量
        offsetY: -6, // y偏移量
        wide: 1, // 分割线粗细
        color: '#000', // 分割线颜色
      };
    },
    // 移动的时候事件，主要有进入撞击元素，离开撞击元素和在撞击元素上移动三种事件, 移动速度太快的话可能，扑捉不到
    move: function move() {},
    // 鼠标松开后的回调函数return true表示helper元素不再回到原来的位置
    drop: function drop() {},
  },
];
dragOrder(elements, targets);
```
