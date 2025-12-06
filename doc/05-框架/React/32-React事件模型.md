# React 事件模型

React 的事件系统并不是直接使用浏览器 DOM 事件，而是基于**合成事件（SyntheticEvent）**构建的一套统一事件模型，用于屏蔽差异、提升性能，并融合 React 的 Fiber 架构。

层级：

```txt
用户事件
  ↓
原生 DOM 事件
  ↓（事件委托）
React 事件监听器（root container）
  ↓
事件分发（事件系统）
  ↓
合成事件对象 SyntheticEvent
  ↓
触发组件的 onClick / onChange / onInput ...
```

## 1. React 的事件委托（Event Delegation）

### React 16 及之前

所有事件统一绑定在 document 上：

```js
document.addEventListener("click", dispatchEvent);
```

### React 17+

绑定位置变成了 React Root Container：

```html
<div id="root"></div>
```

为什么要从 document 移到 root？原因：

1. 避免多个 React 版本混合时冲突
2. 避免与第三方库（如 jQuery、微前端 app）在 document 上的事件竞争
3. 更符合 “多 root mount” 的趋势（多 react app 共存）

## 2. SyntheticEvent（合成事件包装器）

React 对不同浏览器的原生事件进行统一封装：

```js
function handleClick(e) {
  console.log(e.nativeEvent); // 浏览器事件
  console.log(e); // SyntheticEvent
}
```

SyntheticEvent 主要作用：

| 功能                         | 说明                           |
| ---------------------------- | ------------------------------ |
| 统一事件 API                 | 解决 IE/早期浏览器差异         |
| 支持事件池（React17 已废弃） | 以前回调结束后事件对象会被清空 |
| 自动绑定 this 指向组件       | 不需要手动 bind                |
| 结合 Fiber 架构              | 在合适时机批处理更新           |

## 3. React 事件是如何触发的？

完整流程（React 17）：

```js
rootContainer.addEventListener('click', reactDispatcher);

reactDispatcher() {
    // → 找到事件目标 DOM
    // → 模拟冒泡路径
    // → 生成 SyntheticEvent
    // → 在 Fiber 树中分发 onClick 回调
}
```

也就是说：

1. React 模拟了 DOM 冒泡机制
   并不会直接使用浏览器事件的冒泡流程，而是通过 Fiber 找到路径。
2. React 事件监听器不直接绑定在元素上
   即使写了很多 onClick，DOM 中实际上只会看到少量监听器。

## 4. React 中事件冒泡与捕获

React 有内置的 “捕获版本事件”：

```jsx
<div onClickCapture={...}>
```

和原生事件一样，React 支持：

- 捕获阶段：onClickCapture
- 冒泡阶段：onClick

执行顺序：

```txt
父.capture → 子.capture → 子 → 父
```

但：

> ⚠ React 的捕获/冒泡都是“模拟出来的”, 因为 React 事件已经脱离原生 DOM 冒泡，顺序是 React 自己实现的。

## 5. 事件批处理（Event Batching）

在 React 18 前：

- 只有 React 事件中 setState 才会 批量更新
- 原生事件中 setState 是 同步更新（不会合并）

示例：

```js
button.onclick = () => {
  setCount(count + 1);
  setCount(count + 1);
};
```

- React17 → 执行两次，count += 2
- React18 → 自动批处理，count += 1（合并）

React 18 自动批处理来源：

- 所有入口（宏任务/微任务/异步/原生事件）都会自动批处理。

## 6. React 合成事件 vs 原生事件区别

| 对比项         | React 合成事件               | 原生 DOM 事件            |
| -------------- | ---------------------------- | ------------------------ |
| API            | 完全一致                     | 浏览器原生 API           |
| 冒泡           | React 自己模拟               | 浏览器冒泡               |
| 绑定方式       | 统一委托在根节点             | 直接绑定到元素           |
| 性能           | 减少 listener 数量，提升性能 | 大量 DOM listener 性能差 |
| 阻止冒泡       | `e.stopPropagation()`        | 一样                     |
| 默认行为       | `e.preventDefault()`         | 一样                     |
| this           | 绑定正确 this                | 需 bind                  |
| 事件对象可复用 | React17 以前是               | 原生事件对象不可复用     |

## 7. React 中 stopPropagation 的陷阱

在 React 中：

```js
function childClick(e) {
  e.stopPropagation();
}
```

只会阻止 React 自己的合成冒泡，但是：

**❗ 阻止不了浏览器的原生事件冒泡**

如果你在原生 DOM 监听器中捕获同事件，它仍然会执行。

## 8. React + 原生 DOM 混用时的捕获顺序

假设：

```html
<div id="root"></div>
```

- React 事件绑定在 #root
- 原生事件绑定在元素本身

执行顺序：

```txt
原生 capture
React capture
React bubble
原生 bubble
```

> 为什么？React 在原生事件的回调里执行自己的模拟冒泡。

## 9. React17 移除事件池（Pooled Event）

旧版本：

```js
e.persist(); // 防止事件对象被回收
```

React17+ 已经 完全删除事件池，所以：

- 不会再全部属性置空
- 事件对象是普通对象
- 也不需要 persist

## 10. 特殊事件：onChange 的模拟机制

在 React 中：

- input 的 onChange ≈ 原生的 input + change 混合事件
- checkbox/radio 的 onChange ≈ 原生 click

React 目的是：

**确保用户每次输入都触发 onChange**

这是 React 事件模型中最复杂的一部分（事件合成技巧）。

## 11. 事件委托会失效的情况

React 无法委托以下事件，必须真实绑定：

| 事件           | 原因                               |
| -------------- | ---------------------------------- |
| onScroll       | not bubble                         |
| onFocus/onBlur | modern browsers focusin/out 才冒泡 |
| onMedia events | video/audio 相关事件               |

## 🧾 总结

React 事件模型 = 合成事件 + 事件委托 + 模拟冒泡 + Fiber 驱动的批处理。

关键点：

1. React 的事件统一委托到 root（React17+）
2. React 自己实现了事件冒泡，不依赖 DOM 冒泡
3. SyntheticEvent 对原生事件做了包装（React17 删除事件池）
4. React18 起所有事件都是批量更新
5. stopPropagation 只阻止 React 冒泡，不影响原生
6. 部分事件（scroll、focus）不会委托，直接绑定
7. onChange 是 React 自己模拟的一套输入事件机制
