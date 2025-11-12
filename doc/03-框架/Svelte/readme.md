# Svelte 框架

- 作者：Rich Harris
- 核心思想：
  “编译时框架” —— Svelte 在构建阶段将组件编译成高效的原生 JS 操作代码，而非运行时的虚拟 DOM diff。
- 特点：
  - 无运行时虚拟 DOM。
  - 直接编译为精准的 DOM 更新语句。
  - 状态变化 → 自动触发最小化 DOM 操作。
  - 体积小、性能极佳。
- 典型代码：

  ```js
  <script>
  let count = 0;
  </script>

  <button on:click={() => count++}>
  Clicked {count} times
  </button>
  ```
