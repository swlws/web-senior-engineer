# Android 键盘弹起导致 resize 问题

这是一个和 iOS 完全相反、但同样高频的问题点。

可以把它理解成：Android = 会 resize，iOS = 不 resize（只动 visualViewport）。

## 一、现象（Android 的“正常但坑爹”行为）

在 Android 浏览器 / WebView 中：

- 输入框聚焦
- 软键盘弹起
- window.innerHeight 变小
- window.onresize 被触发

```js
window.addEventListener("resize", () => {
  console.log(window.innerHeight);
});
```

👉 这在 Android 是`系统设计行为，不是 bug`

## 二、根因：Android 会「重排窗口」

Android 的核心策略

> 软键盘 = 改变可用窗口高度

即：

- 键盘弹起
- WebView / 浏览器 窗口高度缩小
- 页面重新 layout

对比 iOS（非常重要）

| 平台    | 键盘弹起                        |
| ------- | ------------------------------- |
| Android | resize layout viewport          |
| iOS     | 不 resize，只改 visual viewport |

👉 所以：

- Android：resize 可靠
- iOS：resize 不可靠

## 三、Android 键盘 resize 的典型影响

### 1️⃣ 100vh 失效 / 抖动

```css
.page {
  height: 100vh;
}
```

键盘弹起后：

- 100vh 变小
- 页面内容被压缩
- 弹窗 / 底部栏抖动

### 2️⃣ fixed 元素被顶上来（看起来“正确”，但有坑）

```css
.footer {
  position: fixed;
  bottom: 0;
}
```

👉 键盘弹起：

- footer 会跟着上移
- 有时反而符合预期
- 但动画 / 切换时会闪

### 3️⃣ resize 被频繁触发

- 键盘动画过程中
- 输入法高度变化
- 候选栏展开

👉 resize 可能触发 多次

## 四、Android 正确处理键盘 resize 的方式

### ✅ 方案一：用 resize 直接判断（Android 专用）

```js
const originHeight = window.innerHeight;

window.addEventListener("resize", () => {
  const current = window.innerHeight;

  if (current < originHeight) {
    console.log("键盘弹起");
  } else {
    console.log("键盘收起");
  }
});
```

📌 在 Android 非常可靠

### ✅ 方案二：结合 visualViewport（统一写法）

```js
function onViewportChange() {
  const vh = window.visualViewport?.height || window.innerHeight;
  const diff = window.innerHeight - vh;

  document.body.style.paddingBottom = diff > 0 ? `${diff}px` : "";
}

window.addEventListener("resize", onViewportChange);
window.visualViewport?.addEventListener("resize", onViewportChange);
```

👉 一套代码兼容 Android + iOS

### ✅ 方案三：避免 resize 时重排主布局（关键）

错误做法

```js
window.onresize = () => {
  setState(...) // React 中触发大面积重渲染
}
```

正确

- 只调整 padding / translate
- 不改整体 layout

## 五、Android WebView 特有配置（Hybrid 必会）

windowSoftInputMode

| 模式         | 行为                       |
| ------------ | -------------------------- |
| adjustResize | 页面高度缩小（默认、常见） |
| adjustPan    | 页面不 resize，只平移      |

```xml
<activity
  android:windowSoftInputMode="adjustResize" />
```

📌 adjustResize 才会触发 resize

## 六、常见坑（Android 专属）

### ❌ 1. 用 resize 判断旋转

- 键盘也会触发
- 必须结合 orientation

### ❌ 2. resize 里直接滚动

```js
window.scrollTo(...)
```

👉 会与系统滚动冲突

### ❌ 3. 用 innerHeight 直接做 vh 单位

- 键盘收起 / 地址栏变化都会影响

## 七、Android vs iOS 键盘行为一图流（记忆用）

```txt
Android:
  键盘 → 窗口变小 → resize → innerHeight 变

iOS:
  键盘 → visualViewport 变 → 不 resize
```

## 八、面试标准回答（推荐）

- Android 中软键盘弹起会改变 WebView 或浏览器的可用窗口高度，
- 从而触发 window resize 事件并导致 innerHeight 变化；
- 这是系统层面的设计，用于让页面重新布局，
- 与 iOS 键盘仅影响 visual viewport 而不触发 resize 的机制不同。
