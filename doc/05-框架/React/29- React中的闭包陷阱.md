# React 中的闭包陷阱

## 🧩 一、闭包陷阱的本质

在 React（尤其是函数组件）中，我们经常写这种代码：

```js
function MyComponent() {
  const [count, setCount] = useState(0);

  function handleClick() {
    console.log(count);
  }

  useEffect(() => {
    const timer = setInterval(() => {
      console.log("count in interval:", count);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return <button onClick={handleClick}>+1</button>;
}
```

👉 问题：

- 点击按钮后打印的 count 是最新的；
- 但 setInterval 打印的 count 永远是第一次的值（0）。

为什么？
因为 闭包捕获了旧的 count 值。

React 的函数组件每次渲染时，内部的函数都会重新创建一份新的闭包，绑定当时的状态值。
如果你在 useEffect([]) 里定义函数，那么这个闭包捕获的是第一次渲染时的 count。

## ⚠️ 二、常见陷阱场景

### 1️⃣ 定时器 / 异步回调中使用旧状态

```js
useEffect(() => {
  const timer = setInterval(() => {
    console.log(count); // 永远是旧值
  }, 1000);
  return () => clearInterval(timer);
}, []);
```

#### 原因：

useEffect 的依赖数组为空，意味着回调函数只绑定了初始的闭包。

#### 解决方案：

1、把 count 加入依赖：

```js
useEffect(() => {
  const timer = setInterval(() => console.log(count), 1000);
  return () => clearInterval(timer);
}, [count]);
```

2、或者用函数式更新：

```js
useEffect(() => {
  const timer = setInterval(() => {
    setCount((prev) => prev + 1);
  }, 1000);
  return () => clearInterval(timer);
}, []);
```

3、或者使用 useRef 保存最新值：

```js
const countRef = useRef(count);
useEffect(() => {
  countRef.current = count;
}, [count]);

useEffect(() => {
  const timer = setInterval(() => console.log(countRef.current), 1000);
  return () => clearInterval(timer);
}, []);
```

### 2️⃣ useCallback / useMemo 中的旧值问题

```js
const handleClick = useCallback(() => {
  console.log(count);
}, []); // 🚨 count 没有在依赖中
```

#### 结果：

点击按钮打印的 count 永远是第一次的值。

#### 解决方案：

```js
const handleClick = useCallback(() => {
  console.log(count);
}, [count]);
```

或者（如果你不想重新创建函数）：

```js
const countRef = useRef(count);
useEffect(() => {
  countRef.current = count;
}, [count]);
const handleClick = useCallback(() => {
  console.log(countRef.current);
}, []);
```

### 3️⃣ 事件监听器中闭包过期

```js
useEffect(() => {
  const handler = () => console.log(count);
  window.addEventListener("click", handler);
  return () => window.removeEventListener("click", handler);
}, []); // count 永远是 0
```

#### 解决办法：

同样是依赖或 ref：

```js
useEffect(() => {
  const handler = () => console.log(count);
  window.addEventListener("click", handler);
  return () => window.removeEventListener("click", handler);
}, [count]);
```

或者稳定的 ref：

```js
const countRef = useRef(count);
useEffect(() => {
  countRef.current = count;
}, [count]);
useEffect(() => {
  const handler = () => console.log(countRef.current);
  window.addEventListener("click", handler);
  return () => window.removeEventListener("click", handler);
}, []);
```

## 🧠 三、闭包陷阱的核心认知

- 函数组件 = 渲染快照
  每次 render 内部所有变量（包括 state、props、函数）都是独立的快照。
- 闭包 = 捕获快照
  函数在创建时，记住了当时作用域的变量引用。
- useEffect / useCallback 等 hook 的依赖控制，决定闭包是否更新。

一句话总结：

> React 的闭包陷阱，本质是「函数组件每次渲染都会创建一个新的闭包环境，而我们意外地使用了旧的闭包」。

## ✅ 四、实战建议

| 场景                   | 推荐做法                                |
| ---------------------- | --------------------------------------- |
| 异步任务、定时器       | 使用依赖或 `useRef` 保存最新值          |
| 回调函数中使用 state   | 用函数式更新（`setState(prev => ...)`） |
| useCallback 中依赖状态 | 正确声明依赖数组                        |
| 事件监听器             | 用 `ref` 或更新依赖                     |
| 想要持久函数引用       | 用 `useEvent`（React 19 起官方支持）    |

## 🔮 五、React 官方的解决方案（useEvent）

React 19 推出的 useEvent 专门解决闭包陷阱：

```js
import { useEvent } from "react";

function MyComponent() {
  const [count, setCount] = useState(0);

  const handleClick = useEvent(() => {
    console.log(count); // 总是最新值
  });

  return <button onClick={handleClick}>log</button>;
}
```

👉 它的原理：创建一个稳定的函数引用，但内部总能访问到最新的状态快照。

## 📚 总结一句话

React 中的“闭包陷阱” = 你以为访问的是最新的 state，其实访问的是旧闭包捕获的值。
