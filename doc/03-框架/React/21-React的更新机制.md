# React 的更新机制

“React 中的同步更新与异步更新”是理解 React 渲染机制（尤其是 Fiber 架构）的一大关键

## 🧩 一、什么是同步更新与异步更新

| 类型                                             | 含义                                                        | 触发时机                                              | 特征                           |
| ------------------------------------------------ | ----------------------------------------------------------- | ----------------------------------------------------- | ------------------------------ |
| **同步更新（Synchronous Update）**               | React 会**立即执行更新与重新渲染**                          | 在非 React 管理的上下文中（如事件监听器外）           | 更新阻塞 JS 线程，直到完成     |
| **异步更新（Asynchronous / Concurrent Update）** | React 会**将更新任务调度到 Fiber 调度器中**，可中断、可合并 | 在 React 的批量更新机制中（如事件回调、`setTimeout`） | 提高流畅度，可被打断、延迟执行 |

## ⚙️ 二、React 17 及之前（旧机制）

在 React 17 之前，React 的更新是同步的（synchronous）：

```jsx
setCount(count + 1);
console.log(count); // 输出旧值（因为更新在下一轮渲染前生效）
```

- React 会立即执行状态更新。
- 但是 DOM 更新是批量进行的（通过 React 的事务机制）。
- 也就是说：setState 本身是同步的，但渲染是延后的。

## ⚡ 三、React 18 后（Fiber + Concurrent 模式）

React 18 引入了 并发渲染（Concurrent Rendering） 概念，使更新分为两种模式：

### 1️⃣ 同步更新（同步优先级）

例如：

- 用户输入（受控输入框）
- 紧急交互（点击按钮立即响应）
- React 仍然会同步执行这些更新，保证交互响应及时：

```jsx
<input value={value} onChange={(e) => setValue(e.target.value)} />
```

React 内部优先级高 → 立即执行渲染。

### 2️⃣ 异步更新（可中断 / 可延迟）

例如：

- 低优先级任务（如后台数据加载）
- useTransition、useDeferredValue 等触发的更新

示例：

```jsx
const [isPending, startTransition] = useTransition();

function handleClick() {
  startTransition(() => {
    setTab("profile"); // 异步更新
  });
}
```

→ React 会调度这次更新为 可中断的异步任务：

- 当前主线程任务（比如动画）可先执行；
- Fiber 调度器会稍后再渲染；
- 避免主线程卡顿。

## 🧠 四、为什么说 setState 是“异步”的？

这其实是个 语义陷阱：

```jsx
setCount(count + 1);
console.log(count);
```

这里 count 没变，不是因为 setState 真异步，而是：

- React 批量更新机制（Batching）在同一事件循环中合并多次 setState；
- React 等到所有事件执行完后，再统一触发一次渲染。

✅ 例子：

```jsx
function App() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount((c) => c + 1);
    setCount((c) => c + 1);
  }

  return <button onClick={handleClick}>{count}</button>;
}
```

点击一次后，count → 2。
因为两次更新被合并批处理。

## 🔍 五、总结对比

| 对比项           | 同步更新           | 异步更新（并发模式）     |
| ---------------- | ------------------ | ------------------------ |
| 是否可中断       | 否                 | ✅ 是                    |
| 是否立即更新视图 | ✅ 是              | ❌ 延迟                  |
| 常见场景         | 紧急交互、受控输入 | 数据加载、非紧急状态     |
| React 内部机制   | Fiber 同步执行     | Fiber Scheduler 调度执行 |
| 优点             | 快速响应           | 提高流畅度、避免掉帧     |
| 缺点             | 阻塞主线程         | 调试复杂度高             |

## 💬 六、补充：React 18 中的「自动批处理」

在 React 18 前，只有 React 事件中才会批量更新；
在 React 18 起，所有上下文（包括 setTimeout）都会自动批量更新：

```jsx
setTimeout(() => {
  setCount((c) => c + 1);
  setFlag((f) => !f);
  // 只触发一次渲染 ✅
});
```

## ✅ 总结一句话

React 的“异步更新”并不是指 setState 真异步执行，而是指 React 在 Fiber 架构下通过调度机制实现的“可中断、可合并、可延迟”的更新流程。
