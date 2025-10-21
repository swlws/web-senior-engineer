# 开发模式 hooks 执行两次

为什么在 React 开发模式（development） 下组件、useEffect、useCallback、useMemo 等 Hook 会执行两次，而在 生产模式（production） 下只执行一次。

## 🧩 一、问题表现

在开发模式下，你可能看到：

```js
function App() {
  console.log("App render");
  useEffect(() => {
    console.log("effect run");
  }, []);
  return <div>hi</div>;
}
```

控制台输出：

```bash
App render
App render
effect run
```

## 🧠 二、根本原因：React.StrictMode（严格模式）

### 🔹 StrictMode 是什么

React 18+ 默认在开发环境中会开启 <React.StrictMode> 包裹：

```js
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

> ✅ 它只在 开发模式 下生效。
> 在生产环境中，StrictMode 完全不会触发额外逻辑。

## 🎯 三、为什么要“执行两次”？

React 官方文档解释得非常清楚：

> React 会在严格模式下有意地重复执行`部分生命周期`逻辑（包括`函数组件本身`），以帮助你发现不安全的副作用。

换句话说，这不是 bug，而是一个调试机制。

### 🧩 目的

在 React 的新架构（Concurrent Rendering）中，渲染是可中断、可重试的。
因此 React 想确保：

- 你的组件 不会在渲染过程中引起`副作用（side effects）`；
- 渲染逻辑是`纯函数式`的，可以安全地重复执行。

### 🔍 被“执行两次”的范围

严格模式下，React 会双调用以下内容：

| 类型                     | 是否执行两次            |
| ------------------------ | ----------------------- |
| 函数组件本身             | ✅ 是                   |
| `useState` 初始值函数    | ✅ 是                   |
| `useEffect` 清理 & 执行  | ✅ 是                   |
| `useMemo` 初始化函数     | ✅ 是                   |
| `useCallback` 初始化函数 | ✅ 是                   |
| `useRef` 初始值函数      | ✅ 是（仅第一次渲染内） |

## 🧪 四、举例验证

```jsx
function App() {
  const [count, setCount] = useState(() => {
    console.log("🧩 useState init");
    return 0;
  });

  const ref = useRef(() => {
    console.log("🧩 useRef init");
  });

  useEffect(() => {
    console.log("🎯 useEffect run");
    return () => console.log("🧹 cleanup");
  }, []);

  console.log("🔁 render");
  return <button onClick={() => setCount((c) => c + 1)}>+</button>;
}
```

开发模式下输出：

```bash
🧩 useState init
🧩 useRef init
🔁 render
🧩 useState init
🧩 useRef init
🔁 render
🧹 cleanup
🎯 useEffect run
```

## ⚙️ 五、生产模式下不会双执行

如果你用：

```bash
npm run build
serve -s build
```

再打开控制台，会发现只输出一次。
StrictMode 在生产构建中不会触发双执行。

## 🚧 六、如何临时关闭严格模式（仅调试）

找到入口文件（例如 main.jsx 或 index.js）：

```jsx
// 原来是这样：
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 改成这样（仅测试用）
root.render(<App />);
```

这样你会看到组件只渲染一次。
⚠️ 不推荐长期关闭，它在开发阶段很有价值。

## ✅ 七、总结

| 现象                       | 原因                     | 说明               |
| -------------------------- | ------------------------ | ------------------ |
| 函数组件执行两次           | React.StrictMode         | React 有意重复渲染 |
| useEffect 执行两次         | React 严格模式测试副作用 | 确保清理逻辑正确   |
| useRef、useState init 重跑 | 模拟挂载-卸载流程        | 验证可重入性       |
| 生产模式只执行一次         | StrictMode 仅在 dev 生效 | 性能无影响         |
