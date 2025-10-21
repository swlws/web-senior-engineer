# useMemo

它的核心目标是: 避免父组件更新时，子组件无意义的重新渲染。

## 🧩 一句话总结

React.memo 是一个高阶组件（HOC），只有当 props 发生变化时才重新渲染组件。

类似于类组件的 PureComponent。

## 🎯 基本使用前后对比示例

```jsx
import React, { useState, memo } from "react";

// 子组件（普通版）
function Child({ count }) {
  console.log("👶 Child 渲染");
  return <div>子组件 count: {count}</div>;
}

// 子组件（使用 React.memo）
const MemoChild = memo(Child);

export default function App() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState("");

  return (
    <div>
      <h2>父组件 count: {count}</h2>
      <button onClick={() => setCount(count + 1)}>增加 count</button>
      <button onClick={() => setText(text + "!")}>修改 text</button>

      {/* 普通子组件 */}
      <Child count={count} />

      {/* memo 子组件 */}
      <MemoChild count={count} />
    </div>
  );
}
```

### 🧠 运行日志（对比）

假设我们点击“修改 text”按钮（即父组件重新渲染）：

```bash
👶 Child 渲染
👶 Child 渲染  ← 普通版每次都会渲染
```

```bash
👶 Child 渲染  ← memo 版本只有首次渲染
```

> ✅ 使用 React.memo 后，当 count 未变化时，子组件不会重新渲染。

## ⚙️ 内部原理

React.memo 内部做的事情其实就是：

```jsx
function memo(Component, areEqual) {
  return function MemoizedComponent(props) {
    const prevProps = usePreviousProps(); // React 内部保存上一次 props
    const shouldUpdate = areEqual
      ? !areEqual(prevProps, props)
      : !shallowEqual(prevProps, props);

    if (!shouldUpdate) {
      // 跳过渲染，直接复用上次的结果（VNode）
      return lastRenderedVNode;
    }

    // 否则正常渲染组件
    const vdom = Component(props);
    lastRenderedVNode = vdom;
    return vdom;
  };
}
```

### 🌟 默认比较逻辑

React 内部使用 浅比较（shallowEqual）：

```jsx
shallowEqual({ a: 1 }, { a: 1 }); // true
shallowEqual({ a: 1 }, { a: 2 }); // false
```

也就是说：

- 对象、函数、数组只比较引用；
- 原始值（字符串、数字、布尔）比较值。

## ⚠️ 常见陷阱

### ❌ 1. 父组件重新定义函数

```jsx
<MemoChild onClick={() => setCount(count + 1)} />
```

每次渲染都会生成新的函数引用，导致 props 变化，MemoChild 仍会更新。

✅ **解决：**使用 useCallback 保持函数引用稳定：

```jsx
const handleClick = useCallback(() => setCount((c) => c + 1), []);
<MemoChild onClick={handleClick} />;
```

### ❌ 2. 对象/数组字面量

```jsx
<MemoChild data={{ name: "Jack" }} />
```

每次 render 都创建了新对象，props 引用不同 → 重新渲染。

✅ 解决： 使用 useMemo

```jsx
const data = useMemo(() => ({ name: "Jack" }), []);
<MemoChild data={data} />;
```

### ⚙️ 3. 自定义比较函数

```jsx
const MemoChild = React.memo(Child, (prev, next) => {
  return prev.value.id === next.value.id; // 自定义比较逻辑
});
```

适合需要深层比较或忽略部分 props 的情况。

## 🚀 对比总结

| 特性       | 普通组件                  | `React.memo`                       |
| ---------- | ------------------------- | ---------------------------------- |
| 默认行为   | 父组件更新 → 子组件必更新 | 父组件更新但 props 未变 → 跳过渲染 |
| 比较方式   | 无                        | 浅比较 props                       |
| 性能       | 简单，但可能多余渲染      | 高效，但需注意引用稳定性           |
| 类组件类比 | 普通 `Component`          | `PureComponent`                    |

## 💡 延伸理解

| React.memo             | useMemo                  | useCallback                |
| ---------------------- | ------------------------ | -------------------------- |
| 组件级缓存（跳过渲染） | 值级缓存（避免重新计算） | 函数级缓存（避免引用变化） |

它们是 性能优化三剑客。
