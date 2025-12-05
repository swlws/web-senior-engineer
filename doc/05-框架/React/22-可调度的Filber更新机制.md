# 可调度的 Filber 更新机制

## 🧩 一、React 为什么要引入 Fiber

React 在 16 以前的架构（称为 Stack Reconciler），存在一个致命问题：

渲染是不可中断的。

### 🔴 举个例子：

```jsx
<App>
  <Header />
  <Main />
  <Footer />
</App>
```

当你调用一次 setState：

- React 会递归遍历整个组件树；
- 对每个节点执行 render()；
- 一旦开始，就会一直执行到底（stack call）。

🧨 如果组件树很大（几千节点），浏览器主线程就被长时间占用；
→ 用户的输入、动画、滚动全部卡顿。
→ 这就是“长任务阻塞 UI”的问题。

## ⚙️ 二、Fiber：为了解决同步渲染的“不可中断性”

React Fiber 的核心目标：

> 把一次“不可打断的递归更新”，变成一个“可分段、可暂停、可恢复”的异步过程。

🌱 Fiber 是什么？

> Fiber 是 React 内部对组件的数据结构和执行单元的重新设计。

可以理解为：

> 每一个组件（VNode）在 Fiber 架构中，对应一个 Fiber 节点（FiberNode 对象）。

这个节点里包含了：

- 当前组件的状态、props；
- 上下文信息（父、兄弟、子 Fiber）；
- 任务优先级；
- 指向旧 Fiber（实现 diff）；
- 指向更新队列（实现批量合并）。

## 🧵 三、Fiber 让渲染「可被切片、可中断、可恢复」

在 Fiber 架构下，渲染变成了一个可被调度的“工作循环（work loop）”。

伪代码（简化版）：

```jsx
function workLoop(deadline) {
  while (nextUnitOfWork && deadline.timeRemaining() > 0) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }

  if (nextUnitOfWork) {
    // 时间不够了，暂停当前任务，浏览器优先处理动画或输入
    requestIdleCallback(workLoop);
  } else {
    commitRoot(); // 所有 Fiber 都完成，统一提交到 DOM
  }
}
```

🧠 关键思想：

- Fiber 更新分为两阶段：
  - Render 阶段（可中断）：构建 Fiber 树，计算变更。
  - Commit 阶段（不可中断）：一次性提交 DOM 更新。
- 每个 FiberNode 是一个“可恢复的执行单元”
  - React 处理完一个 Fiber 节点后，会记录下“下一个 Fiber”；
  - 如果浏览器空闲时间不够（deadline.timeRemaining() 低），就暂停；
  - 下次从中断的 Fiber 节点恢复执行。

## ⏱️ 四、调度机制（Scheduler）如何实现“可延迟、可合并”

Fiber 之上还有一个 调度器（Scheduler），它控制任务的优先级与时间切片。

**核心思想：**

React 内部把每次更新封装成一个“任务”（task），任务包含：

```js
{
  callback: performFiberWork,
  priority: LanePriority,  // 优先级（例如：Immediate、UserBlocking、Normal、Idle）
  expirationTime: number,  // 到期时间
}
```

Scheduler 负责：

- 决定哪个任务先执行；
- 判断当前帧是否还有空余时间；
- 在空闲时继续未完成任务；
- 合并相同优先级的任务（批量更新）；
- 丢弃过期或被替代的任务。

## 🧠 五、为什么 Fiber 能「合并」「延迟」「中断」

| 能力              | Fiber 如何实现                                              |
| ----------------- | ----------------------------------------------------------- |
| ✅ **可中断**     | 每个 Fiber 是独立单元，`performUnitOfWork` 执行后可暂停     |
| ✅ **可恢复**     | Fiber 节点保存上下文信息（return、child、sibling）可继续    |
| ✅ **可合并**     | 更新被放入更新队列（UpdateQueue），同一批次更新时合并       |
| ✅ **可延迟**     | 调度器按优先级延后低优先级任务（如 `useTransition`）        |
| ✅ **可分段执行** | 利用 `requestIdleCallback` 或 `MessageChannel` 分帧执行任务 |

## 🧩 六、可视化流程图（简化）

```txt
用户 setState
      ↓
更新加入任务队列（Fiber Update）
      ↓
Scheduler 根据优先级挑任务
      ↓
workLoop 循环执行 Fiber 节点（可暂停）
      ↓
时间不够 → 暂停，等浏览器空闲
      ↓
继续执行剩余 Fiber
      ↓
所有 Fiber 完成 → commit 到 DOM
```

## 🚀 七、总结一句话

Fiber 让 React 从“递归式同步渲染”变成了“可调度的异步任务系统”。
它通过把每个组件拆分成可暂停的小单元（FiberNode），并由调度器根据优先级控制执行，从而实现：

- ✅ 可中断
- ✅ 可恢复
- ✅ 可延迟
- ✅ 可批量合并
- ✅ 不阻塞主线程渲染（流畅 UI）
