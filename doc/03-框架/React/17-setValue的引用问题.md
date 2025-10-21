# setValue 的引用问题

问题： 在严格模式下或正常渲染的第二次 render 时，count 的引用是否变化？setCount 的引用是否变化？

## 🧩 一、先看这行代码

```js
const [count, setCount] = useState(0);
```

它返回的是一个数组：

- count：当前状态值；
- setCount：更新状态的函数。

## 🧠 二、两者的“引用稳定性”对比

| 名称       | 是否稳定  | 说明                                           |
| ---------- | --------- | ---------------------------------------------- |
| `count`    | ❌ 不稳定 | 每次渲染都会是一个新的值（原始类型或引用类型） |
| `setCount` | ✅ 稳定   | React 在整个组件生命周期中保证是同一个函数引用 |

### ✅ 为什么 setCount 稳定？

React 内部的状态实现大致像这样（伪代码）：

```js
function mountState(initialState) {
  const hook = { memoizedState: initialState };
  const queue = { pending: null }; // 存储更新队列
  const dispatch = (action) => {
    // 更新状态并重新渲染
    const newState =
      typeof action === "function" ? action(hook.memoizedState) : action;
    hook.memoizedState = newState;
    scheduleRender(); // 触发重新渲染
  };
  hook.queue = queue;
  return [hook.memoizedState, dispatch];
}

function updateState() {
  // 从 hook 中取出 memoizedState 和 queue
  return [hook.memoizedState, hook.queue.dispatch];
}
```

> ⚙️ 注意：
> dispatch（也就是我们看到的 setCount）只在 mount 阶段创建一次，
> 后续所有 render 都会复用同一个引用。

所以无论渲染多少次， setCount 都是同一个引用。

### ❌ 为什么 count 不稳定？

- 因为 count 是状态值，不是引用缓存。
- React 每次 render 都会读取当前的最新状态：

```js
// 第一次渲染
count = 0;

// setCount(1) 后
count = 1;
```

所以：

- count 的 值 会变化；
- 对于`引用类型（如对象、数组）`，`引用本身 也会变`；
- 但 React 是通过内部的 Fiber Hook 链表存储每个 Hook 的状态值的，`不会复用旧值`。

## 🧪 三、实验验证

```jsx
import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom/client";

function App() {
  const renderCount = useRef(0);
  const [count, setCount] = useState(0);
  renderCount.current++;

  useEffect(() => {
    console.log("🧩 render:", renderCount.current);
    console.log("count =", count);
    console.log("setCount reference =", setCount);
  });

  return (
    <div style={{ fontFamily: "monospace" }}>
      <p>Count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
```

控制台输出类似：

```bash
🧩 render: 1
count = 0
setCount reference = ƒ dispatchAction()

🧩 render: 2
count = 1
setCount reference = ƒ dispatchAction()
```

可以看到：

- count 变化；
- setCount 是完全相同的函数引用。

## 🧠 四、为什么 React 要保证 setCount 稳定？

主要两个原因：

1. 避免子组件重复渲染
   如果 setCount 每次 render 都是新函数，那么传给子组件的 props 会变，React.memo 就失效。
2. 逻辑一致性
   状态更新函数本质上只是往内部队列推一个任务，它不依赖于组件的当前作用域环境（React 会自己管理 state）。
   因此它完全可以是“稳定函数”。

## ✅ 五、总结

| 项目                       | 是否每次 render 变化 | React 保证稳定性 | 说明                          |
| -------------------------- | -------------------- | ---------------- | ----------------------------- |
| `count`                    | ✅ 是                | ❌ 否            | 状态值，每次渲染都更新        |
| `setCount`                 | ❌ 否                | ✅ 是            | 更新函数，生命周期内稳定      |
| `useCallback(fn, [])` 返回 | ❌ 否（依赖未变）    | ✅ 是            | 手动缓存函数引用              |
| `useRef()` 返回            | ❌ 否                | ✅ 是            | 对象引用固定，`.current` 可变 |
