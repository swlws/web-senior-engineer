# useEvent

useEvent 正是 React 团队为了彻底解决「闭包陷阱」而在 React 19 中引入的新 Hook。
它让我们可以写出 “不会变引用，但总是拿到最新状态” 的回调函数。

## 🧩 一、useEvent 是什么？

> useEvent 是 React 19 新增的 Hook，用来创建一个「稳定函数引用」的事件处理函数。
> 它不会因为组件重新渲染而改变函数地址，但内部始终能访问最新的状态和 props。

换句话说：

> 它是 React 官方提供的「反闭包陷阱」解决方案。

## 🚫 传统问题：useCallback 无法避免闭包陷阱

来看一个常见例子 👇

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  const handleLog = useCallback(() => {
    console.log("count =", count);
  }, []); // 🚨 count 没有在依赖中

  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
      <button onClick={handleLog}>log</button>
    </div>
  );
}
```

这里 handleLog 在第一次渲染时创建，它闭包捕获了 count = 0。
即使后来 count 变了，它仍然打印 0。

## ✅ 使用 useEvent 彻底解决

```jsx
import { useEvent } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  const handleLog = useEvent(() => {
    console.log("count =", count); // ✅ 总是最新
  });

  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
      <button onClick={handleLog}>log</button>
    </div>
  );
}
```

- 🔹 handleLog 的引用在整个组件生命周期中是稳定不变的；
- 🔹 但它访问的 count 始终是最新的。

## ⚙️ 二、它和 useCallback 的区别

| 特性       | `useCallback`      | `useEvent`                         |
| ---------- | ------------------ | ---------------------------------- |
| 返回的函数 | 会随依赖变化而变化 | 永远稳定（不会变引用）             |
| 捕获的状态 | 捕获创建时的状态   | 始终访问最新状态                   |
| 使用场景   | 避免子组件重复渲染 | 避免闭包陷阱（定时器、事件回调）   |
| 依赖数组   | 必填               | 不需要                             |
| 实现原理   | 缓存函数           | 稳定函数 + 内部 ref 指向最新函数体 |

## 🧠 三、为什么有效？

React 内部对 useEvent 的实现类似：

```jsx
function useEvent(handler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const stableFn = useCallback((...args) => {
    return handlerRef.current(...args);
  }, []);

  return stableFn;
}
```

即：

- 外层返回的函数 stableFn 永远不会变地址；
- 但执行时会调到 handlerRef.current，它总是最新版本。

## ⚡ 四、典型使用场景

### ✅ 1. 事件监听器

```js
function App() {
  const [count, setCount] = useState(0);

  const handleKey = useEvent(() => {
    console.log("Current count:", count);
  });

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]); // handleKey 不会变，安全
}
```

### ✅ 2. 定时器

```jsx
function Timer() {
  const [count, setCount] = useState(0);

  const tick = useEvent(() => {
    setCount((c) => c + 1);
    console.log("tick:", count);
  });

  useEffect(() => {
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tick]);
}
```

### ✅ 3. 避免频繁依赖更新的副作用

```jsx
useEffect(() => {
  async function fetchData() {
    const res = await fetch("/api");
    if (isMountedRef.current) {
      setData(await res.json());
    }
  }

  fetchData();
}, []); // useEvent 不会导致重新绑定
```

## 🚀 五、当前可用性

| React 版本               | 支持状态                |
| ------------------------ | ----------------------- |
| React 18                 | ❌ 不支持（可手动实现） |
| React 19+                | ✅ 官方内置             |
| React 19 RC / Canary     | ✅ 已可使用             |
| React DOM / React Native | ✅ 都支持               |

## 🧩 六、React 18 兼容写法（polyfill）

在 React 18 中，你可以自己实现一个简化版：

```js
function useEvent(fn) {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  });
  return useCallback((...args) => ref.current(...args), []);
}
```

这样在 React 18 里也能用。

## 🪄 七、小结

| 关键词        | 说明                              |
| ------------- | --------------------------------- |
| 📦 `useEvent` | 稳定函数 + 最新状态               |
| ❌ 闭包陷阱   | 再也不会出现                      |
| 💡 用法       | 像 `useCallback` 一样声明事件函数 |
| 🧱 支持版本   | React 19 起原生支持               |
