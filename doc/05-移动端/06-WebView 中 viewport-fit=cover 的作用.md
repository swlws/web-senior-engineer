# WebView 中 viewport-fit=cover 的作用

按 “为什么需要 → 它到底做了什么 → 在 WebView 里的真实效果 → 常见坑” , 彻底讲清楚 viewport-fit=cover 的作用。

## 一、一句话结论

viewport-fit=cover 决定：

> WebView 是否允许网页内容延伸到「安全区域（safe area）」之外，
> 即是否覆盖刘海 / 圆角 / Home Indicator 区域。

- 不写：内容会被系统“缩进”，避开不安全区域
- 写了 cover：内容铺满整个屏幕，包括刘海区域

## 二、为什么会有 viewport-fit？

问题背景（iPhone X 之后）

全面屏设备出现了：

- 刘海（notch）
- 圆角
- Home Indicator（底部横条）

系统必须防止网页内容：

- 被刘海挡住
- 被 Home Indicator 遮住

👉 默认策略：浏览器自动加“安全边距”

## 三、viewport-fit 的两个取值

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, viewport-fit=cover"
/>
```

| 值             | 行为                 |
| -------------- | -------------------- |
| `auto`（默认） | 内容限制在安全区域内 |
| `cover`        | 内容铺满整个物理屏幕 |

## 四、在 WebView 中到底发生了什么？

### 没有 viewport-fit=cover（默认）

```txt
┌────────────────────┐
│   ⬛ 刘海区         │  ← 不可用
├────────────────────┤
│                    │
│   网页内容区域     │
│                    │
├────────────────────┤
│   Home Indicator   │  ← 不可用
└────────────────────┘
```

- CSS 100vh ≠ 屏幕高度
- innerHeight 被系统扣掉
- WebView 自动 padding

### 使用 viewport-fit=cover

```txt
┌────────────────────┐
│网页内容 + 刘海区   │
│                    │
│                    │
│                    │
│网页内容 + Home区   │
└────────────────────┘
```

- layout viewport = 物理可用屏幕
- 内容可绘制到所有区域
- 风险：被遮挡

## 五、viewport-fit=cover ≠ 自动适配

这是最容易误解的一点。

> cover 只是“放开限制”，并不会帮你避让刘海

你必须配合 safe-area-inset 使用。

## 六、正确的配套用法（标准写法）

### 1️⃣ viewport

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, viewport-fit=cover"
/>
```

### 2️⃣ CSS 使用 safe-area-inset

```css
.page {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

📌 env() 是现代写法
旧写法：constant()（iOS 11）

## 七、在 WebView / Hybrid 中的真实意义

### 常见需求

- 沉浸式页面
- 全屏视频 / 游戏
- 自定义导航栏
- 自绘状态栏背景

### 没有 cover 的问题

- 顶部留白
- 100vh 不等于屏幕高度
- 状态栏颜色无法覆盖

### 使用 cover 后

- 页面真正“全屏”
- 可以自己控制：
  - 顶部安全区
  - 底部 Home Indicator

👉 这是自定义导航栏的前置条件

## 八、常见坑（非常重要）

### ⚠️ 坑 1：100vh 在 iOS 下仍不准确

- Safari 动态工具栏
- 横竖屏切换

👉 建议：

```js
const vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty("--vh", `${vh}px`);
```

### ⚠️ 坑 2：Android 基本忽略 viewport-fit

- Android 没有 notch 标准
- 大多数设备不生效

👉 viewport-fit `主要是 iOS 专属`

### ⚠️ 坑 3：App WebView 可能被宿主覆盖

- iOS WKWebView 的 safe-area
- App 本身可能已处理 inset

👉 必须与 `Native 协调`

## 九、什么时候应该用 viewport-fit=cover？

- ✅ 应该用
  - 自定义导航栏
  - 沉浸式 UI
  - 游戏 / 视频 / H5 活动页
- ❌ 不应该用
  - 普通资讯页
  - 表单密集页
  - 不想处理 safe-area 的页面

## 十、一句话

- viewport-fit=cover 用于允许网页内容绘制到设备的全部物理屏幕，包括刘海和 Home Indicator 区域；
- 默认情况下浏览器会限制内容在安全区域内。
- 使用 cover 后需要配合 safe-area-inset 手动避让，否则内容可能被遮挡，
- 在 WebView 中它是实现沉浸式布局和自定义导航栏的关键配置。
