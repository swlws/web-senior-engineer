# 事件循环

- JS 是单线程，事件循环机制通过任务队列调度执行。
- 宏任务（macro task）：`setTimeout`、`setInterval`、`setImmediate`。
- 微任务（micro task）：`Promise.then`、`MutationObserver`、`queueMicrotask`。
- 微任务优先于宏任务执行。

## 浏览器事件循环

- 浏览器事件循环分为宏任务队列和微任务队列。
- 宏任务队列：`script`、`setTimeout`、`setInterval`、`setImmediate`。
- 微任务队列：`Promise.then`、`MutationObserver`、`queueMicrotask`。
- 执行顺序：
  1. 执行 `script` 标签中的代码。
  2. 执行所有的微任务。
  3. 执行所有的宏任务。
  4. 重复执行 2、3 步骤。

## Node.js 事件循环

Node.js 的事件循环（Event Loop）是其异步非阻塞 I/O 模型的核心机制，使其在单线程上高效处理大量并发操作。

🧠 背景知识
V8 引擎：负责执行 JavaScript 代码。

- libuv：实现跨平台的异步 I/O（如文件操作、网络、定时器等）。
- Node.js 虽然是单线程，但内部通过 线程池（libuv 的 threadpool）处理部分任务，如文件系统操作、DNS 查询、加密等。
