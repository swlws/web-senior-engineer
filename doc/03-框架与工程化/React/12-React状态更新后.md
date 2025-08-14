# React 状态发生后会发生什么

React 里状态（state）更新后，会触发一整套流程，大致分成三个阶段：触发更新 → 协调（Reconciliation） → 提交（Commit）。

## 1️⃣ 状态更新被触发

- 当你调用 setState（类组件）或 setXxx（函数组件的 useState）时，React 会：
  - 把新的更新任务放到 更新队列（Update Queue）。
  - 标记对应组件为 “脏组件”（dirty）。
  - 根据当前的更新优先级（可能是同步的，也可能是批量异步的）调度一次渲染。

## 2️⃣ 协调阶段（Render Phase）

这一阶段 React 会计算出新的 UI 树（虚拟 DOM），但还没改 DOM：

- 调用组件函数/类的 render 方法：
  - 函数组件：重新执行函数体 → 重新计算 Hooks。
  - 类组件：执行 render()。
- React 会用新的 Virtual DOM 和旧的 Virtual DOM 做比较（Diff 算法）。
- 得到一个 变化补丁（Patch），记录需要在哪些地方改 DOM。
- 注意：
  - 这个阶段是可中断的（Concurrent Mode 下，React 可以暂停、丢弃、重新计算）。
  - 不会触发浏览器的重绘或回流。
  - 不能在这个阶段直接读写 DOM，否则可能和最终结果不一致。

## 3️⃣ 提交阶段（Commit Phase）

这一阶段 React 会真正修改 DOM，并触发生命周期 / effect：

1. Before mutation（变更前）：
   - 调用 getSnapshotBeforeUpdate（类组件）等。
2. Mutation（变更）：
   - 按补丁修改真实 DOM。
3. Layout & Effects（布局与副作用）：
   - 执行 componentDidMount / componentDidUpdate（类组件）。
   - 执行 useLayoutEffect 回调。
   - 浏览器开始重绘（Repaint）。
   - 执行 useEffect 回调（异步调度到下一个宏任务）。

## 4️⃣ 总结时序

一次典型的状态更新后，顺序是：

```text
setState / setXxx
   ↓
调度更新（可能批量合并）
   ↓
Render Phase（计算新 Virtual DOM）
   ↓
Diff（找出变化）
   ↓
Commit Phase（真实 DOM 更新）
   ↓
执行生命周期 / useEffect
```

💡 额外细节：

- 批量更新：在 React 18 里，默认批量处理多次状态更新（即多次 setState 合并成一次渲染）。
- 异步性：setState 并不会立即更新 state 变量，而是等到下一次渲染时才会得到新值。
- Concurrent Mode：协调阶段可能被打断并重试，但提交阶段是不可中断的。
