# WebP/AVIF 的兼容性检测

本质是 JS 端动态检测浏览器是否支持 WebP/AVIF 格式，从而决定加载哪种图片。
下面按 原理 → JS 检测方法 → HTML / CSS fallback → 工程实践 → 面试总结 系统讲清楚。

## 一、原理

1. WebP / AVIF 是新一代图片格式
   - WebP: 支持有损、无损、透明、动画
   - AVIF: 压缩率更高，支持 HDR
2. 浏览器支持差异
   - Chrome、Edge、Opera: 支持
   - Firefox: 支持
   - Safari: WebP 支持自 14+，AVIF 支持 16+
   - IE / 老版本 Safari: 不支持

**结论：**加载前必须判断兼容性，否则可能显示失败。

## 二、JS 检测方法（推荐）

利用 Image 对象尝试加载

```js
function checkImageFormat(format) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.width === 1);
    img.onerror = () => resolve(false);
    const base64Map = {
      webp: "data:image/webp;base64,UklGRiIAAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=",
      avif: "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAG1pZjFtaWYxAAACAG1ldGEAAAABbWluZgAAABxtZGF0EgAKBQEBAQ==",
    };
    img.src = base64Map[format];
  });
}
```

📌 核心思路：

- 利用 Image 对象尝试加载
- 尝试加载一个最小的 base64 图片，onload 成功即支持。

## 三、HTML / CSS fallback 方法

### 1️⃣ <picture> 标签（最稳妥）

```html
<picture>
  <source srcset="image.avif" type="image/avif" />
  <source srcset="image.webp" type="image/webp" />
  <img src="image.jpg" alt="示例图片" />
</picture>
```

浏览器会按顺序选第一个支持的格式，不支持就回退到 `<img> 的 jpg/png`。

### 2️⃣ CSS 背景图 fallback

```css
.box {
  background-image: url("image.jpg");
}

@supports (background-image: url("image.webp")) {
  .box {
    background-image: url("image.webp");
  }
}
```

> ⚠️ CSS @supports 不能直接判断格式，只能测试属性是否支持，JS 更精确。

## 四、工程实践建议

1. 首选 `<picture>` 标签 + 多格式，保证兼容性
2. JS 动态判断用于：
   - SPA 路由懒加载
   - CDN 按格式切换
3. WebP/AVIF 优化：
   - WebP：主流浏览器支持率 ~95%
   - AVIF：压缩率更高，但兼容性略差
4. 移动端 / WebView 特殊注意：
   - Android WebView 最新版支持 WebP / AVIF
   - iOS WebView：Safari 14+ 支持 WebP，16+ 支持 AVIF

## 五、常见坑

| 坑                               | 说明                             |
| -------------------------------- | -------------------------------- |
| 用 Image.onload 判断时忘记 width | 某些浏览器 onload 不保证可视内容 |
| AVIF 支持率低                    | fallback 必须准备 jpg/png        |
| CSS 只用 @supports 判断          | 无法精确判定格式，JS 更可靠      |
| WebView 旧版本                   | 不支持新格式，需要检测或降级     |

## 六、总结

`WebP/AVIF` 的兼容性检测通常有两种方式：

- HTML 层面使用 <picture> 标签，按格式顺序提供 fallback；
- JS 层面利用 Image 对象尝试加载一个 base64 最小图，onload 成功则表示支持；在工程中常结合动态切换资源与 fallback 保证跨浏览器和 WebView 的兼容性
