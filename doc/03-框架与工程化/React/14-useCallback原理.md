# useCallback 原理

useCallback 是 React 中一个用于 缓存函数引用 的 Hook，本质上是为了避免函数在每次组件重新渲染时被重新创建，从而减少不必要的子组件渲染或副作用触发。

## 一、基本用法回顾

```jsx
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

等价于：

```jsx
useCallback(fn, deps) === useMemo(() => fn, deps);
```

也就是说：useCallback 只是 useMemo 的一种语义化封装。

## 二、为什么需要 useCallback？

在函数组件中，每次渲染都会重新执行函数体，因此所有定义在组件内部的函数也都会被重新创建。

```jsx
function Example({ onClick }) {
  const handleClick = () => console.log("clicked");
  return <Button onClick={handleClick} />;
}
```

每次渲染，handleClick 都是一个新的函数引用，即使函数体内容没变。
即便子组件使用了 React.memo，但 onClick 的引用变了，也会触发子组件重新渲染：

```jsx
const Button = React.memo(({ onClick }) => {
  console.log("Button render");
  return <button onClick={onClick}>Click</button>;
});
```

解决方案：

```jsx
const handleClick = useCallback(() => console.log("clicked"), []);
```

## 三、实现原理（核心逻辑）

从一个简化版 React Hooks 实现中理解：

模拟实现（伪代码）

```js
let hookStates = [];
let hookIndex = 0;

function useCallback(callback, deps) {
  const prevHook = hookStates[hookIndex];
  if (prevHook) {
    const [prevCallback, prevDeps] = prevHook;
    // 浅比较依赖数组
    const isSame = deps.every((dep, i) => dep === prevDeps[i]);
    if (isSame) {
      hookIndex++;
      return prevCallback; // 依赖未变，返回旧的函数引用
    }
  }
  // 否则更新缓存
  hookStates[hookIndex++] = [callback, deps];
  return callback;
}
```

👉 核心点：

- React 内部维护一个 hook 链表或数组 来保存每个 Hook 的状态；
- 每次组件渲染时，useCallback 会取出上一次的依赖；
- 如果依赖数组没变（浅比较），返回上一次缓存的函数；
- 否则保存新的函数引用和依赖数组。

## 四、和 useMemo 的关系

两者的实现几乎相同：

| Hook                    | 返回值                | 用途         |
| ----------------------- | --------------------- | ------------ |
| `useMemo(fn, deps)`     | `fn()` 的**返回结果** | 缓存计算结果 |
| `useCallback(fn, deps)` | `fn` 本身             | 缓存函数引用 |

其实：

```js
useCallback(fn, deps) === useMemo(() => fn, deps);
```

## 五、源码层面（React Fiber 简化版）

React 在调和阶段会维护一个 Fiber 树，每个 Fiber 节点上会存储 Hook 状态链表：

```js
// 简化版 React 源码片段
function updateCallback(callback, deps) {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  const prevState = hook.memoizedState;
  if (prevState !== null) {
    const prevDeps = prevState[1];
    if (areHookInputsEqual(nextDeps, prevDeps)) {
      return prevState[0]; // 返回缓存的 callback
    }
  }
  hook.memoizedState = [callback, nextDeps];
  return callback;
}
```

✅ React 官方源码位置：

- 文件：packages/react-reconciler/src/ReactFiberHooks.js
- 函数：updateCallback

## 六、依赖项陷阱与优化建议

### 1️⃣ 忘记依赖导致闭包问题

```jsx
const handleClick = useCallback(() => {
  console.log(count); // count 变化但未更新
}, []); // ❌ 永远打印初始 count
```

解决方案：

```jsx
const handleClick = useCallback(() => {
  console.log(count); // count 变化但未更新
}, [count]); // ✅ 依赖 count，每次 count 变化时重新创建
```

### 2️⃣ 不必要的依赖

- 过度依赖会导致频繁生成新函数，失去缓存意义。
- 可使用 `useMemo 缓存复杂对象`、或 `useRef 保存固定引用`。

## 七、总结

| 要点     | 说明                                      |
| -------- | ----------------------------------------- |
| 本质     | 缓存函数引用（语义化的 `useMemo`）        |
| 依赖机制 | 浅比较依赖数组决定是否重建函数            |
| 核心目的 | 避免子组件无谓渲染 / 稳定回调引用         |
| 实现原理 | 保存 `[callback, deps]`，下次渲染比较依赖 |
| 注意事项 | 谨慎选择依赖，避免闭包陷阱                |
