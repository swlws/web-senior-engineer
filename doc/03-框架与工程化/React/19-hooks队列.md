# Hooks 队列

✅ 每个函数组件实例都有自己独立的 Hooks 队列（链表/数组），而不是全局共用一个。

## 🧩 一、为什么不是全局的？

如果 React 只用一个全局 Hooks 队列，那么多个组件同时渲染时，Hooks 的调用顺序就会乱掉，根本无法区分「哪个组件的第一个 useState」「哪个组件的第二个 useEffect」。
这会导致状态错乱。

## 🧬 二、正确的设计：每个组件实例有自己的 Hooks 链表

React Fiber 架构下，每个 Fiber 节点（即组件实例） 都有一个 memoizedState 属性，用来存储该组件的 Hooks 链表：

```js
FiberNode {
  type: FunctionComponent,
  memoizedState: HookObject, // useState/useEffect/... 构成的链表
  ...
}
```

当 React 渲染一个函数组件时：

- React 会把当前 Fiber 设为 currentlyRenderingFiber;
- 在执行组件函数时，每次调用 useXXX，React 就会在这个 Fiber 的 memoizedState 链表上添加一个节点；
- 下一次渲染时，会从这个链表头开始依次读取对应的 Hook 值（通过调用顺序保证对应关系）。

## 📦 三、示意图（简化）

比如有组件：

```jsx
function Counter() {
  const [count, setCount] = useState(0);
  useEffect(() => console.log(count), [count]);
  return <button>{count}</button>;
}
```

内部 Hook 链表类似于：

```txt
Fiber(Counter)
 ├─ memoizedState → Hook(useState)
 │                     └→ next → Hook(useEffect)
 │                                     └→ next → null
```

每次`重新渲染` Counter 时，React 都会：

- 从头遍历 memoizedState；
- 按调用顺序依次取出对应的 Hook 对象；
- 更新值或复用已有状态。

## ⚙️ 四、关键点总结

| 对比项             | 说明                                                                    |
| :----------------- | :---------------------------------------------------------------------- |
| **Hooks 存储位置** | 每个 Fiber（组件实例）都有独立的 Hooks 链表                             |
| **全局变量**       | React 仅有一个全局指针 `currentlyRenderingFiber` 指向当前正在渲染的组件 |
| **调用顺序要求**   | Hooks 必须在组件顶层调用，顺序固定，以便链表能正确对应                  |
| **链表结构原因**   | Hooks 数量可能动态变化，链表结构更适合顺序遍历和扩展                    |

## 🧠 举个例子验证

如果 Hooks 是全局的，下面这种写法就会直接错乱：

```jsx
function App() {
  const [a] = useState(1);
  return <Child />;
}

function Child() {
  const [b] = useState(2);
  return <div>{b}</div>;
}
```

渲染顺序：

```txt
App render → useState(a)
Child render → useState(b)
```

如果共用全局 hooks 队列，那么第二次渲染 App 时，
useState(a) 可能会拿到上次 Child 的状态，彻底乱套。

## 总结一句话 ✅

React 并非全局使用一个 Hooks 队列，而是每个组件 Fiber 节点都有独立的 Hooks 链表，React 通过全局变量记录「当前渲染的 Fiber」，结合固定的 Hook 调用顺序，实现状态与组件实例一一对应。
