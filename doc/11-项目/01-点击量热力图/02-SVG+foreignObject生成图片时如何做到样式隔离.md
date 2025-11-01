# SVG+foreignObject 生成图片时如何做到样式隔离

做到 样式隔离，也就是确保外部页面的 CSS 不影响 foreignObject 内的内容，同时也让内部样式只作用于该内容

## 1️⃣ 使用 `<style>` 内嵌样式

在 foreignObject 内部写一个 `<style>` 标签，把需要的样式写进去。

```html
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
  <foreignObject width="200" height="200">
    <div xmlns="http://www.w3.org/1999/xhtml">
      <style>
        div {
          color: red;
          font-size: 16px;
        }
      </style>
      <div>我是隔离样式的内容</div>
    </div>
  </foreignObject>
</svg>
```

注意：

- 必须写 xmlns="http://www.w3.org/1999/xhtml"。
- 样式写在 foreignObject 内，外部页面的 CSS 不会自动作用到这里。

## 2️⃣ 使用 CSS 命名空间 / BEM / 类名唯一化

即便内嵌 `<style>`，为了避免被外部样式污染，最好给所有元素加上唯一类名：

```html
<style>
  .my-fo-container div {
    color: red;
  }
</style>
<div class="my-fo-container">
  <div>隔离样式</div>
</div>
```

在生成图片前，把类名前加一个随机 hash，比如 my-fo-container-abc123，保证全局唯一。

## 3️⃣ 使用 Shadow DOM 思路（模拟隔离）

foreignObject 本身不支持 Shadow DOM，但我们可以通过：

- 内部嵌入一个 iframe（然后在 iframe 内写 HTML + CSS）
- 或者通过 JS 动态生成 <style> + inline CSS

实现样式隔离：

```html
<foreignObject width="200" height="200">
  <iframe width="200" height="200" style="border:none;">
    <html>
      <head>
        <style>
          body {
            color: blue;
          }
        </style>
      </head>
      <body>
        内部隔离内容
      </body>
    </html>
  </iframe>
</foreignObject>
```

## 4️⃣ 内联样式（最简单、最稳妥）

把所有 CSS 都转成内联 style：

```html
<div style="color: green; font-size: 16px;">完全隔离样式</div>
```

- 优点：100% 隔离，不受外部 CSS 干扰。
- 缺点：维护成本高，无法复用样式。

✅ 总结推荐方案

- 内嵌 `<style>` + 唯一类名（最常用）
- 内联样式（最稳妥）
- iframe（理论上隔离最彻底，但兼容性差）
- 通常项目中，我会用 内嵌 `<style>` + hash 类名 的方式，既可维护又可隔离。
