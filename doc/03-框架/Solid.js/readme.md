# Solid.js 框架

- 作者：Ryan Carniato
- 核心思想：
  使用 细粒度响应式系统（Fine-grained reactivity），直接操作 DOM，而非通过虚拟 DOM diff。
- 特点：
  - 响应式更新精确到节点级别。
  - 编译优化 + 原生 DOM 渲染。
  - JSX 语法兼容（外观像 React，性能像 Svelte）。
  - 拥有 SSR 支持和完善生态。
- 对比：
  Solid 采用 signal 机制，只有数据变化的部分会更新，无需整棵树 diff。
