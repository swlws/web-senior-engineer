# 列表懒加载

## 1️⃣ 滚动事件监听（scroll）

原理：监听页面滚动，计算滚动位置是否接近底部，触发加载。

```js
window.addEventListener("scroll", () => {
  const { scrollTop, clientHeight, scrollHeight } = document.documentElement;
  if (scrollTop + clientHeight >= scrollHeight - 50) {
    loadMore();
  }
});
```

- ✅ 优点：实现简单，兼容性好
- ❌ 缺点：需要防抖/节流，否则频繁触发；精度依赖滚动计算

## 2️⃣ IntersectionObserver

原理：利用浏览器原生 API 监控元素是否进入可视区域，例如在列表底部放一个“哨兵元素”。

```js
const sentinel = document.querySelector("#sentinel");
const io = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    loadMore();
  }
});
io.observe(sentinel);
```

- ✅ 优点：性能好，不用手动计算滚动位置
- ❌ 缺点：IE 不支持，需要 polyfill

## 3️⃣ 分页 + 按需请求

原理：后端分页接口，前端每次请求一页数据，append 到列表。

- 常和 scroll 事件 或 IntersectionObserver 结合
- 每次触底加载下一页，直至数据加载完

- ✅ 优点：数据可控，后端压力小
- ❌ 缺点：需要接口支持分页

## 4️⃣ 虚拟列表（Virtual List）

原理：只渲染可视区域的数据，其余部分用占位符撑开高度。

常见库：react-window、react-virtualized、vue-virtual-scroller

- ✅ 优点：适合长列表，极大减少 DOM 数量
- ❌ 缺点：实现复杂，可能影响 SEO

## 5️⃣ 图片懒加载（场景特化）

### HTML 原生属性：

```html
<img src="preview.jpg" data-src="real.jpg" loading="lazy" />
```

### JS 实现（结合 IntersectionObserver）：

```js
const imgs = document.querySelectorAll("img[data-src]");
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      const img = e.target;
      img.src = img.dataset.src;
      io.unobserve(img);
    }
  });
});
imgs.forEach((img) => io.observe(img));
```

## 6️⃣ 分片渲染（分批次渲染）

原理：如果数据量大，一次加载会卡顿，可以用 requestIdleCallback / requestAnimationFrame / setTimeout 分批插入 DOM。

- ✅ 优点：避免主线程阻塞
- ❌ 缺点：实现麻烦，数据分批渲染有延迟

## 📊 总结对比表

| 方式                     | 适用场景          | 优点               | 缺点                     |
| ------------------------ | ----------------- | ------------------ | ------------------------ |
| **scroll 事件**          | 通用列表懒加载    | 简单易用           | 需要节流，计算繁琐       |
| **IntersectionObserver** | 列表 / 图片懒加载 | 性能好，API 优雅   | IE 不支持，需要 polyfill |
| **分页请求**             | 后端数据列表      | 数据可控，接口友好 | 依赖接口设计             |
| **虚拟列表**             | 超长列表 (>1w)    | 节省 DOM，提高性能 | 实现复杂，不利 SEO       |
| **图片懒加载**           | 图片类内容        | 节省流量，加载快   | 图片加载前有占位         |
| **分片渲染**             | 首屏大数据渲染    | 避免卡顿，体验流畅 | 数据展示延迟             |
