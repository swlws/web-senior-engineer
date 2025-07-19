# 🧩 React 是如何使用 scheduler 进行任务调度的

React 从 v16（Fiber 架构） 开始引入了“可中断的渲染”，但直到 React 18，才真正结合浏览器的 scheduler API，实现了 基于优先级的任务调度系统，从而支持：

- 🎭 并发特性（如 Transition、Suspense）
- 🧠 调度控制（避免长任务阻塞 UI）
- ⚙️ 多优先级协调（响应高优先用户交互）

## 一、核心机制概览

React 内部使用了 scheduler 包（独立于 React，可独立使用），它是 React 的调度中心。

```bash
npm install scheduler
```

React 不直接依赖浏览器的 scheduler.postTask，但有条件地使用它（如 Chrome 94+），否则回退到基于 MessageChannel 的调度逻辑。

## 二、React 调度流程图（简化版）

```text
用户事件 / 更新请求
      ↓
scheduler.scheduleCallback(priority, callback)
      ↓
任务进入任务队列（优先级堆）
      ↓
判断是否可中断 → 是 → Yield
      ↓
执行时间片段 workLoop
      ↓
React Fiber 树调和 & 提交
```

## 三、scheduler 的关键方法

### 1. scheduleCallback(priority, callback)

React 使用该方法来注册一个工作任务，并传入优先级：

```ts
import { scheduleCallback, NormalPriority } from 'scheduler';

scheduleCallback(NormalPriority, () => {
  // React 内部的 fiber 构建 work loop
});
```

支持的优先级：

| React Scheduler 优先级    | 值（数字越小越重要） | 示例用途            |
| ---------------------- | ---------- | --------------- |
| `ImmediatePriority`    | 1          | 紧急任务，例如动画或输入响应  |
| `UserBlockingPriority` | 2          | 用户可感知的任务（如输入建议） |
| `NormalPriority`       | 3          | 默认更新            |
| `LowPriority`          | 4          | 不重要的更新          |
| `IdlePriority`         | 5          | 空闲时执行的后台任务      |

## 四、与 React Fiber 协作

React 的工作被拆分为一个个小单元（称为 fiber），这些小任务使用 scheduler 注册，并在可中断条件下 yield：

```ts
function workLoopConcurrent() {
  while (work && !shouldYield()) {
    work = performUnitOfWork(work);
  }
}
```

shouldYield() 会判断是否超过了浏览器的一帧时间预算（大约 5ms ~ 16ms），防止长时间运行影响页面响应。当中需要断当前任务，让出 CPU 执行权。

## 五、React 与浏览器 scheduler.postTask 的集成

在 React 18 开始，scheduler 包支持了浏览器原生的 scheduler.postTask（如果可用）：

```ts

const hasNativeScheduler = typeof scheduler !== 'undefined' && scheduler.postTask;

if (hasNativeScheduler) {
  scheduler.postTask(() => {
    // 执行调度任务
  }, { priority: 'user-visible' });
} else {
  // 回退：使用 MessageChannel + requestAnimationFrame
}

```

📦 这是 React scheduler 内部的自动适配行为。你不需要手动干预。

## 六、场景举例：React 中任务优先级的体现

### [✅ startTransition()](https://zh-hans.react.dev/reference/react/startTransition)

startTransition 可以让你在后台渲染 UI 的一部分。

用于将非阻塞更新降级为“低优先级”，实现异步渲染：

```tsx
import { startTransition } from 'react';

startTransition(() => {
  setSearchQuery(input); // 低优先级
});

```

- 高优先：input 输入（可见）
- 低优先：根据 input 渲染结果（可推迟）

### [✅ useDeferredValue()](https://zh-hans.react.dev/reference/react/useDeferredValue)

useDeferredValue 是一个 React Hook，可以让你延迟更新 UI 的某些部分。

用来延迟一些值的响应，以避免高频更新阻塞主线程。

```tsx
import { useState, useDeferredValue } from 'react';

function SearchPage() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  // ...
}
```

## 七、调度 vs 渲染 vs 提交

| 阶段   | 是否可中断 | 描述             |
| ---- | ----- | -------------- |
| 调度阶段 | ❌     | 接收更新请求，决定是否更新  |
| 渲染阶段 | ✅     | 构建 Fiber 树，可中断 |
| 提交阶段 | ❌     | 应用更新到 DOM，不可中断 |

## ✅ 总结

| 特性              | React 调度系统表现                                                                       |
| --------------- | ---------------------------------------------------------------------------------- |
| 可中断更新           | 是（通过 `shouldYield`）                                                                |
| 任务优先级           | 5 个等级（从 `Immediate` 到 `Idle`）                                                      |
| 依赖浏览器 scheduler | ✅ 支持，Chrome 支持时使用原生 `postTask`                                                     |
| 是否开源            | ✅ 在 [scheduler 仓库](https://github.com/facebook/react/tree/main/packages/scheduler) |
| 用途              | 控制 Fiber 渲染、时间切片、并发特性                                                              |
