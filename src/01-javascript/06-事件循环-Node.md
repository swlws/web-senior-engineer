# Node.js 事件循环

Node.js 的事件循环（Event Loop）是其异步非阻塞 I/O 模型的核心机制，使其在单线程上高效处理大量并发操作。

## 🧠 背景知识

V8 引擎：负责执行 JavaScript 代码。

- libuv：实现跨平台的异步 I/O（如文件操作、网络、定时器等）。
- Node.js 虽然是单线程，但内部通过 线程池（libuv 的 threadpool）处理部分任务，如文件系统操作、DNS 查询、加密等。

## 🌀 事件循环的阶段

事件循环分为多个阶段，每个阶段处理不同类型的回调：

| 阶段名                   | 说明                                      |
| --------------------- | --------------------------------------- |
| **timers**            | 执行 `setTimeout()` 和 `setInterval()` 的回调 |
| **pending callbacks** | 执行一些系统操作的回调（如 TCP 错误）                   |
| **idle, prepare**     | 内部使用                                    |
| **poll**              | 等待新的 I/O 事件，并执行其回调                      |
| **check**             | 执行 `setImmediate()` 的回调                 |
| **close callbacks**   | 执行 `close` 事件的回调，如 `socket.on('close')` |

## 🔁 事件循环顺序图

```text
┌─────────────────────────────┐
│           timers            │ ← setTimeout/setInterval
├─────────────────────────────┤
│    pending callbacks        │
├─────────────────────────────┤
│     idle, prepare           │
├─────────────────────────────┤
│          poll               │ ← 主要的 I/O 处理区
├─────────────────────────────┤
│          check              │ ← setImmediate
├─────────────────────────────┤
│     close callbacks         │ ← socket.on('close')
└─────────────────────────────┘
```

## ⚡ 宏任务与微任务

| 类型  | 示例                               | 执行时机         |
| --- | -------------------------------- | ------------ |
| 宏任务 | `setTimeout`, `setImmediate`     | 事件循环阶段之间     |
| 微任务 | `Promise.then`, `queueMicrotask` | 当前阶段执行完后立即执行 |

## 🔍 process.nextTick vs Promise.then

| 方法                   | 优先级   | 执行时机             |
| -------------------- | ----- | ---------------- |
| `process.nextTick()` | 高于微任务 | 当前阶段完成后立即执行      |
| `Promise.then()`     | 微任务   | 当前宏任务完成后，微任务队列执行 |

## 🧪 setImmediate vs setTimeout

输出时序不稳定，输出的时序取决于事件循环的上下文。

| 特性            | `setTimeout(fn, 0)`       | `setImmediate(fn)`      |
| ------------- | ------------------------- | ----------------------- |
| 所属阶段          | **Timers 阶段**             | **Check 阶段**            |
| 何时执行          | 指定时间后（>= 0ms）进入 Timers 阶段 | Poll 阶段后，进入 Check 阶段时执行 |
| 延迟性           | 受系统时间精度、最小延迟限制影响          | 更快，不受最小延迟限制             |
| 嵌套 I/O 回调时的顺序 | 可能比 `setImmediate` 晚      | 通常比 `setTimeout` 先      |
| Node 专有       | 否                         | ✅ 是 Node.js 独有          |

注意事项：

| 场景               | 建议使用           |
| ---------------- | -------------- |
| 想在 I/O 操作完成后尽快执行 | `setImmediate` |
| 想延迟一定时间后执行任务     | `setTimeout`   |
| 需要更精确控制执行顺序（跨平台） | 不推荐混用两者        |

## 🧵 多线程的参与（线程池）

以下操作会进入 libuv 的线程池（非主线程）：

- fs.readFile
- crypto.pbkdf2
- dns.lookup

它们完成后，结果会通过事件循环回调进入 JS 主线程。

## 📝 总结

- Node.js 使用事件循环在单线程中实现异步非阻塞 I/O。
- 每个事件循环包含多个阶段，负责处理不同类型的任务。
- 微任务（Promise.then）在每个阶段之后执行，process.nextTick 优先于微任务。
- libuv 提供线程池处理阻塞型任务，增强并发能力。
