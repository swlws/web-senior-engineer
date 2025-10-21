# startTransition 优化

startTransition 是 React 18 并发特性（Concurrent Features） 的代表性 API —— 它是让 React 具备“高并发性能”的关键工具之一。

## 🚀 一、startTransition 是什么

> startTransition 用来把一段 非紧急的状态更新 标记为「可延迟（低优先级）」的更新。

这样 React 就能：

- 先响应用户交互（高优任务）；
- 再去渲染大规模计算或数据更新（低优任务）。

### ✅ 基本使用

```jsx
import { useState, startTransition } from "react";

function App() {
  const [text, setText] = useState("");
  const [list, setList] = useState([]);

  const handleChange = (e) => {
    const input = e.target.value;
    setText(input); // 高优先级更新（立即响应输入）

    // 👇 低优先级更新（列表计算可延迟）
    startTransition(() => {
      const filtered = bigList.filter((item) => item.includes(input));
      setList(filtered);
    });
  };

  return (
    <div>
      <input value={text} onChange={handleChange} />
      <List data={list} />
    </div>
  );
}
```

🧠 React 会：

- 立即更新输入框 → 保证流畅；
- 延迟更新列表 → 在空闲时再渲染；
- 这样用户打字不会卡顿。

## ⚙️ 二、startTransition 背后的机制

React Fiber 支持多种优先级任务，比如：

- 用户输入、动画 → 高优先级；
- 数据加载、过滤渲染 → 低优先级。

startTransition 会把更新标记成 “Transition” 类型的任务。
Scheduler 调度时会优先执行高优任务（保证交互流畅），延后执行低优任务。

> 如果中途又来了新的输入：React 会「丢弃」旧的低优任务，执行新的渲染。
> （比如用户输入变化快时，不会浪费性能去渲染过时的中间状态。）

## 📊 三、简单可感知的例子

```jsx
function Demo() {
  const [query, setQuery] = useState("");
  const [list, setList] = useState([]);

  const handleInput = (e) => {
    const q = e.target.value;
    setQuery(q);

    startTransition(() => {
      // 模拟一个耗时计算
      const result = Array.from({ length: 5000 }, (_, i) => `${q}-${i}`);
      setList(result);
    });
  };

  return (
    <div>
      <input value={query} onChange={handleInput} />
      <ul>
        {list.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
```

- 👉 不用 startTransition 时，输入会明显卡顿；
- 👉 使用 startTransition 后，输入变得顺滑。

## 🧩 四、配套 Hook：useTransition

useTransition 是 startTransition 的 Hook 版本，它还能告诉你「是否正在进行 transition」。

```jsx
const [isPending, startTransition] = useTransition();

startTransition(() => {
  setList(filtered);
});

return <>{isPending && <span>Loading...</span>}</>;
```

isPending 可用于在低优更新期间展示「加载中」状态。

## ⚡ 五、startTransition vs 普通更新

| 特性         | 普通更新           | `startTransition` 更新 |
| ------------ | ------------------ | ---------------------- |
| 优先级       | 高（立即执行）     | 低（延迟执行）         |
| 是否可中断   | 否                 | ✅ 是                  |
| 是否可丢弃   | 否                 | ✅ 是（可丢弃旧渲染）  |
| 是否阻塞输入 | 可能               | ❌ 不会                |
| 典型用途     | 输入框值、按钮点击 | 列表渲染、过滤、排序   |

## 🧠 六、在 Fiber 层面的本质区别

- 普通更新：标记为 “同步优先级”任务（sync priority）；
- Transition 更新：标记为 “并发优先级”任务（concurrent priority）；
- Scheduler 会在浏览器空闲时才执行 transition。

内部使用的核心是：

```js
scheduler.postTask(() => workLoopConcurrent(), { priority: "background" });
```

## 💬 七、最佳使用场景

✅ 使用 startTransition 的典型场景：

- 输入搜索时过滤大列表；
- 页面切换时加载大量组件；
- 滚动分页加载；
- 图表、动画、大量计算的延迟更新。

⚠️ 不建议滥用：

> 不要把所有更新都放进 startTransition，否则会造成“反应迟钝”。

## ✅ 八、总结一句话

> startTransition 让 React 拥有了“高并发调度能力” —— 它能把低优先级渲染延后执行，从而保证用户交互的流畅性。

📌 一句话总结：

> “startTransition 让 React 能在高负载下依然丝滑。”
