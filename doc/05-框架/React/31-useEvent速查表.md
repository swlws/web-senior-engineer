# useEvent 速查表

适用于 React 19+（或 React 18 + 自行 polyfill）

## 🎯 一、核心理念

useEvent 用来创建一个：

- 引用稳定 ✅（不会因为状态变化重新创建）
- 逻辑实时 ✅（内部始终访问最新的 state/props）的函数。

一句话记忆：

> 「不变的函数 + 最新的状态」 = useEvent

## 🧩 二、与 useCallback 对比

| 对比项             | `useCallback`         | `useEvent`                 |
| :----------------- | :-------------------- | :------------------------- |
| 函数引用是否变化   | ✅ 随依赖变化         | 🚫 永远不变                |
| 捕获的状态值       | ⚠️ 创建时的旧快照     | ✅ 最新状态                |
| 是否解决闭包陷阱   | ❌ 可能出错           | ✅ 完全避免                |
| 是否重新绑定副作用 | ✅ 会导致             | 🚫 不会导致                |
| 典型用途           | 子组件优化 / 依赖管理 | 异步任务、事件监听、定时器 |
| 依赖数组           | 必填                  | 无需                       |

## ⚙️ 三、常见使用场景模板

### ① 定时器（Timer）

❌ 问题写法：

```js
useEffect(() => {
  const id = setInterval(() => console.log(count), 1000);
  return () => clearInterval(id);
}, []); // count 永远是 0
```

✅ useEvent 方案：

```js
const logCount = useEvent(() => console.log(count));

useEffect(() => {
  const id = setInterval(logCount, 1000);
  return () => clearInterval(id);
}, [logCount]);
```

### ② 事件监听（Event Listener）

❌ useCallback 容易失效：

```js
const handleScroll = useCallback(() => {
  console.log(scrollY);
}, []); // 捕获旧值
```

✅ useEvent 写法：

```js
const handleScroll = useEvent(() => {
  console.log(window.scrollY);
});

useEffect(() => {
  window.addEventListener("scroll", handleScroll);
  return () => window.removeEventListener("scroll", handleScroll);
}, [handleScroll]); // 引用稳定
```

### ③ 异步回调 / Promise 内部逻辑

```jsx
const [user, setUser] = useState(null);

const fetchUser = useEvent(async () => {
  const res = await fetch("/api/user");
  const data = await res.json();
  // ✅ 总能访问最新状态
  if (!user?.isDeleted) setUser(data);
});
```

### ④ WebSocket / 消息订阅

```jsx
const onMessage = useEvent((msg) => {
  console.log("latest state:", state);
});

useEffect(() => {
  socket.on("message", onMessage);
  return () => socket.off("message", onMessage);
}, [onMessage]);
```

### ⑤ 防止 useEffect 重复触发

有时我们希望 effect 只在挂载时绑定一次，但又想用最新逻辑：

```jsx
const handleVisibility = useEvent(() => {
  if (document.hidden) pause();
  else resume();
});

useEffect(() => {
  document.addEventListener("visibilitychange", handleVisibility);
  return () =>
    document.removeEventListener("visibilitychange", handleVisibility);
}, [handleVisibility]); // 不会变引用
```

### ⑥ 防抖 / 节流逻辑

```jsx
import { useEvent } from "react";
import { debounce } from "lodash";

function Search() {
  const [query, setQuery] = useState("");

  const handleSearch = useEvent(
    debounce(() => {
      console.log("fetching:", query);
    }, 500)
  );

  useEffect(() => {
    handleSearch();
  }, [query, handleSearch]);
}
```

✅ handleSearch 不会变引用，query 总是最新。

## 🧠 四、在 React 18 中兼容实现

```jsx
function useEvent(callback) {
  const ref = useRef(callback);
  useEffect(() => {
    ref.current = callback;
  }); // 重点：每次 render 都更新 ref.current
  return useCallback((...args) => ref.current(...args), []);
}
```

💡 这样即可在 React 18 项目中安全使用。

## 🔒 五、useEvent 的几个关键特性

| 特性              | 说明                                           |
| ----------------- | ---------------------------------------------- |
| 🧱 稳定引用       | `useEvent` 返回的函数不会因为渲染而改变        |
| 🧠 自动同步       | 内部会始终指向最新的闭包逻辑                   |
| 🔄 无需依赖       | 不需要依赖数组，也不会引起 useEffect 重新执行  |
| ⚡ 高性能         | 无多余 rebind，避免 useCallback 带来的重复渲染 |
| 💬 React 官方支持 | 自 React 19 起成为核心 Hook                    |

## 🚀 六、实践建议（项目规范级）

| 场景                           | 推荐做法                               |
| ------------------------------ | -------------------------------------- |
| 回调函数依赖 state             | 用 `useEvent`                          |
| 子组件 props 回调              | 继续用 `useCallback`（用于 memo 优化） |
| 全局监听器 / 定时器            | 用 `useEvent`                          |
| WebSocket、Promise、setTimeout | 用 `useEvent`                          |
| React 18 项目                  | 临时用自定义 polyfill 版本             |

## 📦 七、项目内快速模板

可以定义一个简易封装文件，例如：

```js
// hooks/useStableEvent.js
import { useCallback, useEffect, useRef } from "react";

export function useStableEvent(fn) {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  }); // 重点：每次 render 都更新 ref.current
  return useCallback((...args) => ref.current(...args), []);
}
```

这样无论是 React 18 还是 React 19，使用统一：

```jsx
const onMessage = useStableEvent((msg) => console.log(msg));
```

## ✅ 八、总结速览表

| 问题场景                         | 旧写法                     | useEvent 优化         |
| -------------------------------- | -------------------------- | --------------------- |
| 定时器中状态不更新               | useEffect([]) 闭包捕获旧值 | useEvent 包装回调     |
| WebSocket onMessage 使用旧 state | 回调捕获旧值               | useEvent 确保最新     |
| 事件监听逻辑反复解绑重绑         | 依赖数组变化导致多次绑定   | useEvent 稳定引用     |
| 异步请求中状态引用过期           | Promise 闭包捕获旧值       | useEvent 持续更新     |
| 子组件 props 回调                | 不建议用 useEvent          | 用 useCallback + 依赖 |
