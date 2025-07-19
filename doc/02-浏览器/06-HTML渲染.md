# HTML 渲染

## 几大过程

- HTML 解析（构建 DOM）：自上而下构建 DOM Tree
- CSS 解析（构建 CSSOM）：解析样式表，构建 CSSOM 样式对象模型
- Render Tree 构建：DOM + CSSOM → 渲染树（Render Tree）
- 布局（Layout）：计算元素的位置和大小
- 分层（Layer）：将页面元素分层，提高渲染效率
- 绘制（Painting）：将元素绘制为像素点
- 合成（Compositing）：将多个图层合成，形成最终页面

## defer 和 async 的区别

- defer 是在 HTML 解析完成后执行，按顺序执行
- async 是在加载完成后立即执行，不保证顺序
- 通常用于加载外部脚本，如统计脚本、广告脚本等

## preload 和 prefetch 的区别

- preload 是在页面加载时提前加载资源，如 CSS、JS、图片等
- prefetch 是在用户空闲时预加载资源，如下一页的内容
- 通常用于提高页面加载速度，如预加载字体、图片等

## 产生新分层的方式

- 为特定元素创建独立图层（如 `position: fixed`, `transform`, `will-change`）
- 图层越多，合成成本越高，但动画更流畅

## 回流和重绘

- **reflow（回流）**：布局阶段发生变更 → 会影响后续 paint 与 composite，代价较高
- **repaint（重绘）**：仅影响绘制阶段（如 color 变化），不会重新布局
- 使用 `transform`, `opacity` 动画可避免回流重绘，提升性能
- 使用 `requestAnimationFrame` 可与渲染节奏同步，减少掉帧
