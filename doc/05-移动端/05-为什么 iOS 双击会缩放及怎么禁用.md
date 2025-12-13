# 为什么 iOS 双击会缩放及怎么禁用

## 一、为什么 iOS 要“双击缩放”？

历史背景（非常关键）

- iPhone 初代（2007） 没有移动端网页
- 绝大多数网站是 PC 定宽页面（980px）
- 屏幕只有 320px 宽，内容根本看不清

👉 Apple 的解决方案：

> 双击某一块内容，把它“智能放大”到可读大小

这就是 `Double-Tap Zoom（双击缩放）`

## 二、iOS 双击缩放的工作机制（不是简单放大）

### 1️⃣ Safari 并不是“整体放大页面”

而是：

- 寻找`最近的可读块元素`
- 计算该块的合理宽度
- 把该块 `缩放到 visual viewport`

👉 所以你看到的效果是：

- 双击文本 → 那一列刚好铺满屏幕
- 而不是等比放大整个页面

### 2️⃣ 技术层面发生了什么？

```txt
layout viewport：不变
visual viewport：变小
visualViewport.scale：变大
```

## 三、如何禁用 iOS 双击缩放？（现实方案）

### ✅ 方案 1：禁止用户缩放（最常用，但有争议）

```html
<meta
  name="viewport"
  content="
    width=device-width,
    initial-scale=1,
    maximum-scale=1,
    user-scalable=no
  "
/>
```

效果

- 禁止双指缩放
- 大部分情况下 也会禁用双击缩放

⚠️ 问题

- 违反无障碍规范（WCAG）
- iOS 新版本 可能忽略
- App Store 审核对无障碍敏感

> 👉 不推荐长期使用

### ✅ 方案 2：CSS 层阻止双击行为（更“现代”）

```css
html, body {
  touch-action: manipulation;
}
```

原理

- manipulation 表示：
  - 允许点击、滚动
  - 禁止双击缩放

优点

- 不影响双指缩放
- 符合 Pointer Events 规范
- iOS 13+ 支持良好

> 📌 这是目前最推荐的方案

### 方案 3：监听 touchend 阻止（不推荐）

```js
let lastTouchEnd = 0
document.addEventListener('touchend', e => {
  const now = Date.now()
  if (now - lastTouchEnd <= 300) {
    e.preventDefault()
  }
  lastTouchEnd = now
}, false)
```

❌ 问题：

- hack
- 容易误伤点击
- 滚动卡顿
- 不稳定

## 四、推荐组合方案

```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

```css
html, body {
  touch-action: manipulation;
}
```

👉 最平衡：

- 保留无障碍
- 禁止误触双击缩放
- 不影响正常交互

## 五、一段话

- iOS 双击缩放是为了解决早期 PC 网页在小屏设备上的可读性问题，
- Safari 会在双击时智能放大可读内容块，而不是简单缩放整个页面；
- 技术上表现为 visual viewport 缩放、layout viewport 不变。
- 禁用方式主要通过 viewport 限制或 CSS touch-action，
- 其中 touch-action: manipulation 是更推荐的现代方案。
