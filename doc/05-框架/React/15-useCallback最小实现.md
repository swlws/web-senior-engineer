# 最小实现 useCallback

## 🧩 示例代码（可直接运行）

```jsx
import React, { useState } from "react";
import ReactDOM from "react-dom/client";

/** ------------------------------
 * 模拟一个最小的 useCallback 实现
 * ------------------------------ */
let hookStates = [];
let hookIndex = 0;

function useCallbackSim(callback, deps) {
  const prevHook = hookStates[hookIndex];
  if (prevHook) {
    const [prevCallback, prevDeps] = prevHook;
    const same = deps.every((dep, i) => dep === prevDeps[i]);
    if (same) {
      console.log(
        "%c[useCallbackSim] ✅ 依赖未变，复用旧函数引用",
        "color: #4caf50"
      );
      hookIndex++;
      return prevCallback;
    } else {
      console.log(
        "%c[useCallbackSim] 🔁 依赖变更，生成新函数引用",
        "color: #ff9800"
      );
    }
  } else {
    console.log("%c[useCallbackSim] 🆕 首次创建函数", "color: #2196f3");
  }

  hookStates[hookIndex++] = [callback, deps];
  return callback;
}

/** 重置 Hook 索引（模拟 React 每次 render） */
function resetHookIndex() {
  hookIndex = 0;
}

/** ------------------------------
 * 组件示例
 * ------------------------------ */
function Child({ onClick }) {
  console.log("%c[Child] render", "color: #9c27b0");
  return <button onClick={onClick}>点击子组件按钮</button>;
}

const MemoChild = React.memo(Child);

function App() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState("A");

  resetHookIndex(); // 每次渲染前重置索引

  // 使用自定义 useCallback 模拟
  const handleClick = useCallbackSim(() => {
    console.log(`Button clicked, count=${count}`);
  }, [count]); // ✅ 改变 count 会生成新函数

  console.log("%c[App] render", "color: #03a9f4");

  return (
    <div style={{ fontFamily: "monospace" }}>
      <h3>简化版 useCallback 模拟</h3>
      <p>count: {count}</p>
      <p>text: {text}</p>
      <button onClick={() => setCount((c) => c + 1)}>count + 1</button>
      <button onClick={() => setText((t) => t + "!")}>text + "!"</button>
      <hr />
      <MemoChild onClick={handleClick} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
```

## 🧠 演示说明

运行后打开控制台，你会看到类似输出：

```sh
[useCallbackSim] 🆕 首次创建函数
[App] render
[Child] render
```

然后点击不同按钮观察变化：

### 🔹 点击 “count + 1”

```sh
[useCallbackSim] 🔁 依赖变更，生成新函数引用
[App] render
[Child] render  ← 子组件重新渲染！
```

因为依赖 [count] 变化，handleClick 是新引用，React.memo 检测到 props 变化 → 重新渲染。

### 🔹 点击 “text + !”

```sh
[useCallbackSim] ✅ 依赖未变，复用旧函数引用
[App] render
```

## 🎯 结论

| 场景                   | useCallbackSim 输出 | 子组件是否重渲染 |
| ---------------------- | ------------------- | ---------------- |
| 首次渲染               | 🆕 创建函数         | ✅ 是            |
| 依赖变化（count 改变） | 🔁 新函数引用       | ✅ 是            |
| 依赖未变（text 改变）  | ✅ 复用旧函数       | ❌ 否            |
