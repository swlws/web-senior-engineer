# CoverView 优化卡顿问题

> cover-view 不参与正常的页面渲染流程，而是放在一个独立的“原生层”渲染。
> 滚动时不需要重新进行小程序的 JS → WXML → DOM → 布局 → 绘制流程，所以更流畅。

这就是它能“浮在页面上还不卡”的核心。

## 🧩 小程序的渲染架构（关键背景知识）

微信小程序有两层：

| 层级                       | 负责内容                             | 说明                     |
| -------------------------- | ------------------------------------ | ------------------------ |
| **逻辑层（JS Thread）**    | React/Taro、业务逻辑、setData        | 运行在独立的 JSCore 线程 |
| **视图层（WebView）**      | vDOM → WXML → CSS → 渲染             | 每个页面一个 WebView     |
| **原生层（Native Layer）** | 组件：map、video、canvas、cover-view | 直绘到系统原生 UI 层     |

## ❗ 核心问题：滚动为什么会卡？

滚动（scroll）时会触发：

1. WebView 强制重绘（尤其遇到 fixed、复杂布局时）
2. JS 与 WebView 之间同步 scrollTop
3. 组件位置、布局计算（layout）
4. 重排（reflow）和重绘（repaint）

特别是顶部导航吸顶、悬浮按钮等 `固定定位元素`，WebView 每滚动一帧都要重新算它的位置 → `抖动、掉帧`。

## 💡 cover-view 的底层原理：脱离 WebView 的独立渲染层

### ✔ 关键点 1：cover-view 是 原生组件

它不属于 WebView 的 DOM 树，不走小程序的布局系统。

它直接由微信客户端（Native）渲染，类似浮在页面上的独立 UI。

> 即使 WebView 滚动、重绘，cover-view 不受影响。

### ✔ 关键点 2：不参与滚动、布局、重绘

滚动列表时 WebView 的 Canvas 视图在滚动，但 cover-view 是另一个独立层，不会跟着 WebView 一起重绘。

因此：

1. 🚀 原生层不需要重新布局
2. 🚀 不需要重新绘制
3. 🚀 每一帧都能稳定 60FPS

### ✔ 关键点 3：不触发 setData → 无通信开销

普通 View 的位置变化会触发：

> JS → data → WXML → DOM → 样式 → 渲染 → 绘制

而 cover-view 的位置由`原生层`直接处理，不会走小程序通信管道。

## 🧪 举例：下拉列表 + 固定悬浮按钮

```tsx
<ScrollView>
  ...
</ScrollView>

<CoverView class="btn-fixed">按钮</CoverView>
`
```

滚动时：

- ScrollView → WebView 重绘（开销大）
- CoverView → 完全不参与重绘

WebView 再卡，cover-view 还是超级流畅。

## 🎨 cover-view 渲染层级示意图

```txt
┌──────────────────────┐
│ 原生层（Native Layer）│  ← CoverView、Map、Video
└──────────────▲───────┘
               │
┌──────────────┴───────┐
│ WebView（视图层）     │  ← 普通 View、按钮、文本等
│ ScrollView 滚动会重绘 │
└──────────────────────┘
```

cover-view 在 WebView 上面，被系统层渲染。

## ⚠️ 为什么 cover-view 限制多？（不能嵌套、多层级、CSS 支持弱）

因为它是 Native 绘制的，不走 WebView：

- 不支持 overflow
- 不支持 transform
- z-index 不完全生效
- 只能浅层嵌套
- 有些 CSS 语法特性完全不支持

本质原因：单独渲染层（Native Layer）不能模拟完整浏览器能力。

## 📌 总结

cover-view 通过将自己放在 WebView 之外的 Native 独立 UI 层渲染，使其脱离小程序的布局与重绘路径。滚动、布局变化期间 WebView 会频繁重排，而 Native 层不会，因此 cover-view 能保持稳定、高帧率渲染。
