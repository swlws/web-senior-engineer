# Fiber Tree 的创建过程（React.createElement → beginWork → completeWork）

React Fiber Tree 的创建过程是 React 在 首次渲染（mount） 或 更新（update） 过程中对虚拟 DOM 的一次调度与执行，主要分为 “创建 Fiber 树 → 协调 → 提交” 三个阶段，具体过程如下：

## 📌 Fiber Tree 创建流程（含关键函数调用）

```text

React.createElement
     ↓
jsx 转换成虚拟 DOM（JS 对象）
     ↓
render 函数中调用 ReactDOM.render / createRoot.render
     ↓
scheduleUpdateOnFiber (调度更新)
     ↓
performConcurrentWorkOnRoot (调度任务执行)
     ↓
renderRoot (开始构建 Fiber 树)
     ↓
workLoopConcurrent（并发模式下的循环调度）
     ↓
beginWork（“构建”阶段，从上到下）
     ↓
completeWork（“完成”阶段，从下到上）
     ↓
commitRoot（提交阶段，渲染到 DOM）

```

## 📍各阶段说明

### 1. React.createElement

将 JSX 语法转成 JS 对象（虚拟 DOM）：

```jsx
const element = <App />;
// 等价于
const element = React.createElement(App);
```

### 2. ReactDOM.createRoot(...).render(...)

- 初始化 React 应用，将虚拟 DOM 渲染为 Fiber 树并挂载到真实 DOM 上。
- 触发一次 更新调度。

### 3. scheduleUpdateOnFiber

- 调度器启动，将更新加入队列。
- 判断是否是并发模式（Concurrent）或同步模式（Legacy）。

### 4. performConcurrentWorkOnRoot

React Scheduler 开始执行任务，准备进入渲染阶段。

## 🔁 构建阶段（Fiber 树创建）

### ▶ renderRoot

这是渲染入口，标志着一次 Fiber 树的构建开始。

### ▶ workLoopConcurrent

并发模式下，不会一次性构建完整 Fiber 树，会根据剩余时间分片处理。

### ▶ beginWork

从 Fiber 根节点开始，深度优先遍历构建子 Fiber 节点：

- 处理组件类型（函数组件、类组件、原生标签等）
- 比较新旧 props，生成子节点的 Fiber 对象（newFiber）

### ▶ completeWork

子节点处理完成后，从叶子节点开始“归”：

- 生成 effect 副作用列表
- 标记要执行的 DOM 操作（如 placement、update、deletion）

> 注意：构建阶段是可中断的，Scheduler 会根据时间片判断是否需要暂停。

## ✅ 提交阶段

### ▶ commitRoot

- 整个 Fiber 树构建完成后，进入提交阶段。
- 会依次执行：
  - beforeMutation（生命周期如 getSnapshotBeforeUpdate）
  - mutation（真实 DOM 操作：插入/更新/删除）
  - layout（生命周期如 componentDidMount）

## 🧠 总结图解（顺序执行）

```text
JSX -> createElement -> 虚拟 DOM -> FiberRootNode
                   ↓
scheduleUpdateOnFiber（调度）
                   ↓
performConcurrentWorkOnRoot
                   ↓
     renderRoot → workLoopConcurrent
                   ↓
       beginWork（自顶向下构建）
       completeWork（自底向上收集 effect）
                   ↓
         commitRoot（执行 DOM 操作）
```
