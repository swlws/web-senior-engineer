# React Fiber

React Fiber 是 React 16 引入的一种 全新的核心架构，用于 高效管理和调度 UI 渲染。它是对旧架构的彻底重写，目的是实现以下三个目标：

## 🎯 React Fiber 的核心目标

| 目标               | 说明                               |
| ---------------- | -------------------------------- |
| ✅ **可中断渲染**      | 避免长时间阻塞主线程，提升响应性                 |
| ✅ **优先级调度**      | 更重要的任务优先处理                       |
| ✅ **增量渲染**（时间切片） | 渲染任务拆分成小块，逐帧处理                   |
| ✅ **异步可控渲染**     | 如 `Suspense`、`Concurrent Mode` 等 |

## 🧩 Fiber 是什么？

> 在 React 中，每一个组件对应一个 Fiber 节点。

一个 Fiber 是一个 JS 对象，包含：

```ts
type Fiber = {
  type: any;               // 组件类型（函数/类/host）
  key: string | null;      // key，用于 diff 优化
  stateNode: any;          // 对应的真实 DOM 或类组件实例
  return: Fiber | null;    // 父节点
  child: Fiber | null;     // 第一个子节点
  sibling: Fiber | null;   // 下一个兄弟节点
  alternate: Fiber | null; // 上一次渲染对应的 fiber
  effectTag: string;       // 副作用标记（如新增/删除）
  ...
}
```

Fiber 节点构成了一棵 Fiber 树（虚拟 DOM 树的底层实现）

## 🔄 Fiber 架构渲染流程（简化版）

### 阶段一：render（diff）阶段

- 构建 Fiber 树，找出需要变更的部分；
- 可以被中断；
- 每个节点收集副作用（effect）；
- 不触发 DOM 操作。

```text
ReactDOM.render() →
  workLoop → build fiber 树 → 收集 effect
```

### 阶段二：commit（提交）阶段

- 执行 DOM 操作（插入、更新、删除）；
- 不能中断；
- 触发 useEffect、ref 回调等副作用。

```text
commitRoot() →
  beforeMutation → mutation → layout
```

## 🧠 Fiber 的设计优势

| 旧架构（Stack Reconciler） | Fiber 架构        |
| --------------------- | --------------- |
| 递归处理组件                | 循环结构，更易中断       |
| 不能中断                  | 可中断，可恢复         |
| 无优先级区分                | 每个 Fiber 节点有优先级 |
| 每次更新都重建整棵树            | Fiber 树复用，增量更新  |

## 🕸️ Fiber 节点结构图

```text
     <App />
       |
    FunctionComponent
       |
     HostComponent
     /          \
 <div>        <button>
```

每个 JSX 元素 → Fiber 节点 → 链接形成 Fiber 树（**单链树结构：child + sibling**）

## 🧵 与 Scheduler 协作

Fiber 架构设计之所以强大，是因为它与 scheduler 协同工作，实现以下调度机制：

- shouldYield()：判断是否需要中断，防止卡顿；
- 每次渲染工作切成小任务，逐帧处理；
- 按优先级调度不同的更新任务（输入交互 > 图片加载 > 日志收集）；

## 🔧 示例：时间切片

```tsx
function App() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const start = performance.now();
    while (performance.now() - start < 100) {
      // 模拟阻塞任务
    }
  }, [count]);

  return (
    <button onClick={() => setCount(c => c + 1)}>Add</button>
  );
}
```

在 React 18 并发模式下，这段阻塞逻辑可被中断，不会卡 UI。

## 🧬 总结

| 特性     | 是否具备 | 说明                            |
| ------ | ---- | ----------------------------- |
| 增量渲染   | ✅    | 将更新任务拆分为小块处理                  |
| 可中断    | ✅    | 保持页面响应流畅                      |
| 优先级调度  | ✅    | 高优任务可抢占低优任务                   |
| 多阶段提交  | ✅    | before → mutation → layout    |
| 并发特性支持 | ✅    | 支持 startTransition、Suspense 等 |

## 🚀 推荐深入方向

- Fiber Tree 的创建过程（React.createElement → beginWork → completeWork）
- effectList 构建与 commit 阶段执行机制
- React 18 并发特性（Concurrent Mode）的调度原理
