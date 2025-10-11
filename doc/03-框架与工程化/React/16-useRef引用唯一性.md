# useRef 的引用唯一性

const callbackRef = useRef(() => {})

每次 render 时，callbackRef 的引用不会发生变化

## 🧩 一、核心结论先说在前面：

useRef() 返回的对象在整个组件生命周期中是 固定的同一个引用，
React 不会在重新渲染时重新创建它。

## 🧠 二、React 内部机制解析

当你写下：

```js
const callbackRef = useRef(() => {});
```

React 内部大致做了这样的事（伪代码）：

```js
function useRef(initialValue) {
  const hook = getHookForCurrentComponent();

  // 首次渲染时创建对象
  if (!hook.memoizedState) {
    hook.memoizedState = { current: initialValue };
  }

  // 后续渲染时，返回同一个对象引用
  return hook.memoizedState;
}
```

👉 即：

- 第一次渲染：创建一个 { current: fn } 对象；
- 后续渲染：直接返回同一个对象；
- React 不会替换这个对象。

这就是为什么：

```js
const ref1 = useRef();
const ref2 = useRef();
console.log(ref1 === ref2); // false, 不同ref实例
```

但在同一个 ref 上：

```jsx
function App() {
  const ref = useRef();
  console.log("ref identity:", ref);
  // 每次render，ref的引用都相同
}
```

> 👉 输出中 ref 永远是同一个对象。

## 🔍 三、和普通变量对比

| 类型          | 每次 render 是否重建         | 是否跨渲染保留          |
| ------------- | ---------------------------- | ----------------------- |
| 普通变量      | ✅ 会重建                    | ❌ 不保留               |
| `useState` 值 | ❌ 不会重建（除非 setState） | ✅ 保留                 |
| `useRef` 对象 | ❌ 不会重建                  | ✅ 保留（对象本身稳定） |

## 🧩 四、所以为什么 callbackRef 的引用不变？

当你写：

```js
const callbackRef = useRef(() => {});
callbackRef.current = () => console.log(count);
```

每次 render：

- React 返回同一个 callbackRef 对象；
- 你只是修改它的 .current 属性；
- 所以 对象本身引用没变；
- 但 .current 指向的内容可以随意更新，不影响子组件渲染；
- React 也不会因为 .current 变化重新渲染组件（它不是响应式的）。

## 💡 五、可运行对比示例

```jsx
import React, { useRef, useState } from "react";
import ReactDOM from "react-dom/client";

function App() {
  const [count, setCount] = useState(0);
  const ref = useRef(() => {});
  console.log("🔁 render: ref identity ->", ref);

  ref.current = () => console.log("count =", count);

  const handleClick = () => ref.current();

  return (
    <div style={{ fontFamily: "monospace" }}>
      <p>count: {count}</p>
      <button onClick={() => setCount((c) => c + 1)}>count + 1</button>
      <button onClick={handleClick}>log count</button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
```

控制台输出：

```sh
🔁 render: ref identity -> { current: f }
🔁 render: ref identity -> { current: f }
🔁 render: ref identity -> { current: f }
```

可以看到，每次渲染 ref 的引用完全没变。

## ✅ 六、总结一句话

| 概念       | 说明                                        |
| ---------- | ------------------------------------------- |
| `useRef()` | 返回一个在整个组件生命周期内稳定不变的对象  |
| `.current` | 可自由读写，不影响渲染                      |
| React 行为 | 不会因 `.current` 改变而重新渲染            |
| 实际用途   | 持久存储任意可变值（如函数、DOM、计数器等） |
