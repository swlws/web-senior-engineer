# 小程序 WebView（内嵌 H5）工作机制

## 一、概念

小程序 WebView = 在小程序中嵌入一个原生 WebView 容器，用于渲染 H5 页面

- `<web-view src="https://xxx.com">`
- 适合复用已有 H5 页面或第三方页面
- 不是普通 DOM，而是原生 WebView 的一部分
- 独立于小程序渲染引擎（WX 渲染层）

## 二、架构原理

### 1️⃣ 小程序渲染架构回顾

```txt
逻辑层（JS） <-> 渲染层（WXML + WXSS） <-> 原生控件
```

- 逻辑层：执行 JS、管理 data、调用 API
- 渲染层：将 WXML/WXSS 渲染为原生控件（原生 View、Text、Image）
- 通信：通过 JS Bridge（异步消息机制）

### 2️⃣ WebView 特殊点

- WebView 是 独立的原生控件
- 内部渲染由 系统浏览器内核 负责（iOS WKWebView / Android WebView）
- 小程序逻辑层无法直接操作 WebView 内部 DOM
- 页面跳转由 src URL 加载，完全隔离

## 三、逻辑层与 WebView 通信机制

小程序与 WebView 是 两个 JS 沙箱，通信通过：

### 1️⃣ 小程序 → WebView

```html
<web-view id="myWebview" src="https://example.com"></web-view>
```

```js
const webview = this.selectComponent("#myWebview");
webview.postMessage({ foo: "bar" });
```

- postMessage 异步发送数据
- WebView 内 H5 JS 可通过 `window.addEventListener('message', ...)` 接收

### 2️⃣ WebView → 小程序

```js
// H5 内部
window.wx.miniProgram.postMessage({ data: "hello" });
```

- 在小程序逻辑层通过 webview 组件的 bindmessage 事件接收
- 完全异步

### 3️⃣ 注意点

- 只能传 JSON 可序列化对象
- 不支持函数、DOM 元素
- 跨域限制：WebView 内部 H5 可以自由访问网络，但不能直接访问小程序 API

## 四、渲染 / 事件特点

| 特性             | 说明                                                           |
| ---------------- | -------------------------------------------------------------- |
| 渲染独立         | WebView 内部由原生浏览器引擎渲染                               |
| 滚动             | WebView 自带滚动条，逻辑层无法直接控制 scrollTop               |
| fixed / position | 部分 iOS WebView 中 fixed 可能抖动                             |
| 输入法           | iOS 输入法弹起可能遮挡 WebView 内容                            |
| CSS / JS         | 原生 WebView 支持大部分标准 CSS/JS，但小程序逻辑层无法直接干预 |
