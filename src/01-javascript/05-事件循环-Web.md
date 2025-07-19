# 浏览器事件循环

浏览器的事件循环是 JavaScript 在浏览器中实现 异步非阻塞编程模型 的核心机制。

## 🧠 背景知识

- JavaScript 是单线程的（主线程执行 JS 代码）。
- 主线程负责执行以下任务：
  - JavaScript 执行
  - UI 渲染
  - 用户交互事件处理
  - 定时器处理
  - 网络回调处理

所有这些都通过 事件循环机制 来协调执行顺序。

## 🌀 宏任务与微任务

### 1. 宏任务（Macro Task）

每次事件循环执行的“主任务”。

常见宏任务类型：

- setTimeout
- setInterval
- setImmediate（Node 专有）
- I/O
- MessageChannel
- requestAnimationFrame
- 整体的 script 执行（第一次执行）

### 2. 微任务（Micro Task）

在当前宏任务执行完后立即执行的任务。

常见微任务：

- Promise.then/catch/finally
- MutationObserver
- queueMicrotask

## 📋 浏览器事件循环执行顺序

```text
【一次完整的事件循环流程】：
1. 执行一个宏任务（如 script 脚本 或 setTimeout 回调）
2. 执行所有微任务（清空 microtask 队列）
3. 如果此时可以渲染，则进行渲染（UI Update）
4. 执行下一个宏任务
```

## 🔁 执行顺序图示

```text
┌────────────────────────┐
│   执行一个宏任务       │ ← 例如 script、setTimeout 回调
├────────────────────────┤
│   执行所有微任务       │ ← Promise.then / queueMicrotask
├────────────────────────┤
│   渲染（如有）         │ ← requestAnimationFrame 等
├────────────────────────┤
│   下一轮事件循环开始   │
└────────────────────────┘
```

## 🎨 与 UI 渲染关系

浏览器事件循环每一轮中可能执行一次渲染操作：

- 渲染通常发生在：
  - 微任务清空后
  - 下一轮宏任务前
- 理论上一帧（16ms）只能渲染一次，避免阻塞渲染是性能优化关键。

## 🧵 与 Node.js 对比

| 特性   | 浏览器                                | Node.js                            |
| ---- | ---------------------------------- | ---------------------------------- |
| 宏任务  | `setTimeout`, `script` 等           | `setTimeout`, `setImmediate` 等     |
| 微任务  | `Promise.then`, `MutationObserver` | `Promise.then`, `process.nextTick` |
| 渲染   | 每轮循环后尝试渲染页面                        | 无页面渲染                              |
| 特殊机制 | `requestAnimationFrame`            | `process.nextTick`, libuv 阶段循环     |

## ✅ 总结

- 浏览器事件循环控制主线程执行顺序，协调任务、微任务和渲染。
- 宏任务之间穿插微任务队列执行。
- 优化性能时，应合理安排微任务、避免阻塞渲染。
