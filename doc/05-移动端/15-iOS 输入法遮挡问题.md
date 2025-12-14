# iOS 输入法遮挡问题

这是 iOS H5 / WebView 的老大难问题之一，而且和 viewport / visualViewport / fixed / overscroll / WebView 是同一条技术链。

## 一、什么是 iOS 输入法遮挡问题？

典型现象：

- 输入框在页面下半部分
- 聚焦后 键盘弹起
- 输入框被键盘挡住
- 页面不会自动滚到可视区
  （或滚了但回弹）

👉 Android 基本不会，iOS 非常常见

## 二、根因是什么？（核心原理）

### 1️⃣ iOS 键盘 ≠ resize viewport

在 iOS 中：

- 键盘弹起不会改变 layout viewport
- 只影响 visual viewport
- 100vh ≠ 可视高度

📌 所以：

- 页面认为高度没变
- 但用户看到的区域变小了

### 2️⃣ position: fixed 的特殊行为（致命）

iOS 中：

```css
position: fixed;
```

- 固定在 layout viewport
- 不会随键盘上移

👉 fixed 元素（如底部按钮 / 输入框）最容易被键盘遮挡

### 3️⃣ body 滚动机制特殊

- 实际滚动的是 viewport
- `scrollIntoView()` 在 iOS 上经常失效
- overscroll + 回弹干扰滚动定位

## 三、常见「错误 / 不稳定」方案（❌）

### ❌ 1. 只用 100vh

```css
.page {
  height: 100vh;
}
```

👉 键盘弹起后 高度不变

### ❌ 2. 监听 resize

```js
window.addEventListener('resize', ...)
```

👉 iOS 不一定触发

### ❌ 3. scrollIntoView 直接滚

```js
input.scrollIntoView();
```

👉 iOS 中：

- 会被回弹
- 滚不到位

## 四、真正可用的解决方案（分场景）

### ✅ 方案一：visualViewport（现代首选）

> 核心思想: 用 visualViewport 的高度变化感知键盘

示例

```js
const vv = window.visualViewport;

vv.addEventListener("resize", () => {
  const keyboardHeight = window.innerHeight - vv.height;

  if (keyboardHeight > 0) {
    document.body.style.paddingBottom = `${keyboardHeight}px`;
  } else {
    document.body.style.paddingBottom = "";
  }
});
```

优点

- 精准
- 不依赖 UA
- iOS 13+ 支持

📌 这是当前最推荐方案

### ✅ 方案二：输入框聚焦时滚动（兜底）

```js
input.addEventListener("focus", () => {
  setTimeout(() => {
    input.scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
  }, 300);
});
```

### ✅ 方案三：避免 fixed，改 absolute + 容器滚动（非常重要）

错误

```css
.footer {
  position: fixed;
  bottom: 0;
}
```

正确

```css
.page {
  position: relative;
}

.footer {
  position: absolute;
  bottom: 0;
}
```

👉 让页面滚动带着输入框走

### ✅ 方案四：WebView 特有方案（Hybrid）

iOS 原生侧

```objc
webView.scrollView.contentInsetAdjustmentBehavior =
  UIScrollViewContentInsetAdjustmentNever;
```

或监听：

```objc
UIKeyboardWillChangeFrameNotification
```

👉 原生通知键盘高度 → 注入 JS

## 五、弹窗 / 表单场景推荐组合（工程级）

```css
.page {
  min-height: 100vh;
}
```

```js
if (window.visualViewport) {
  visualViewport.addEventListener("resize", () => {
    const diff = window.innerHeight - visualViewport.height;
    document.documentElement.style.setProperty(
      "--keyboard-offset",
      `${diff}px`
    );
  });
}
```

```css
.page {
  padding-bottom: var(--keyboard-offset);
}
```

## 六、特殊情况说明（⚠️）

- 1️⃣ 微信 WebView
  - visualViewport 有时不触发
  - 必须加 scrollIntoView 兜底
- 2️⃣ iOS 输入法切换
  - resize 会多次触发
  - 需 debounce
- 3️⃣ Safari 地址栏伸缩
  - 与键盘行为叠加
  - 不要用 innerHeight 单独判断
