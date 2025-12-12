# iPhone 刘海屏安全区域（safe-area-inset）

## 1. 什么是 Safe Area？

iPhone X 之后的全面屏出现了 刘海（notch） 和 底部 Home Indicator。

为避免内容被遮挡，iOS 定义了四个“安全区域变量”：

| 变量名                   | 含义           |
| ------------------------ | -------------- |
| `safe-area-inset-top`    | 顶部刘海高度   |
| `safe-area-inset-bottom` | 底部手势条高度 |
| `safe-area-inset-left`   | 左侧曲屏/异形  |
| `safe-area-inset-right`  | 右侧曲屏/异形  |

这些值在不同设备、横竖屏、是否全屏模式下都会不同。

## 2. CSS 中如何使用？

基础语法：使用环境变量（env）

```css
padding-bottom: env(safe-area-inset-bottom);
padding-top: env(safe-area-inset-top);
```

## 3. H5 中让 safe area 生效的关键（非常重要）

👉 必须在 meta 中启用独占全屏布局模式：

```html
<meta
  name="viewport"
  content="width=device-width, initial-scale=1, viewport-fit=cover"
/>
```

否则 safe-area-inset 永远是 0。

为什么？

- 默认 viewport-fit=auto → WebView 给你留黑边，不会给安全区
- viewport-fit=cover → 内容会延伸到屏幕边缘，此时 safe-area-inset 变量才生效

## 4.实战问题：安卓是否支持？

安卓大多数浏览器不支持 safe-area-inset

因此建议加 fallback：

```css
padding-bottom: 16px;
padding-bottom: calc(env(safe-area-inset-bottom) + 16px);
```

## 5.小程序中的 safe area

小程序不支持 CSS 的 env()，但提供了 API：

① getWindowInfo（推荐）

```js
const info = wx.getWindowInfo();
console.log(info.safeAreaInsets.bottom); // px
```

结果示例：

```json
{
  "top": 47,
  "bottom": 34,
  "left": 0,
  "right": 0
}
```
