# useDeferredValue 优化

useDeferredValue 是 React 18 并发特性（Concurrent Features）中的另一个重要 API，和 startTransition 是**“孪生兄弟”**。

两者都用来延迟非紧急更新，让 React 在高负载场景下依然流畅。
但它们的使用方式和语义略有不同 👇

## 🚀 一、useDeferredValue 是什么

useDeferredValue(value) 会返回一个延迟版本的值，当 value 更新过快时，React 可以“推迟”同步更新 UI，从而避免卡顿。

### ✅ 示例

```jsx
import { useState, useDeferredValue } from "react";

function App() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query); // 👈 延迟版本

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <SearchResults query={deferredQuery} />
    </div>
  );
}

function SearchResults({ query }) {
  // 模拟耗时渲染
  const list = Array.from({ length: 5000 }, (_, i) => `${query}-${i}`);
  return (
    <ul>
      {list.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
```

🧠 React 会：

- 立即更新输入框（保证输入流畅）；
- 延迟渲染 <SearchResults />；
- 若用户继续打字，React 会丢弃旧的 deferred 更新，渲染最新的结果。

## ⚙️ 二、内部机制简化理解

- 每次 query 改变时，useDeferredValue 不会马上更新；
- 它会调度一个「低优先级任务」；
- 当主线程空闲时，React 才会把 deferredQuery 更新为最新值；
- 若中途用户又输入了新内容 → React 丢弃之前那次延迟更新。

**🎯 本质：**

useDeferredValue 是一种「自动使用 startTransition」的方式，用来在依赖某个值的渲染较重时，延迟那部分渲染。

## 🧩 三、与 startTransition 的区别

| 特性     | `startTransition`                     | `useDeferredValue`                            |
| -------- | ------------------------------------- | --------------------------------------------- |
| 使用方式 | 包裹一段更新逻辑                      | 包裹一个值                                    |
| 控制粒度 | 明确指定哪段更新延迟                  | 自动延迟依赖该值的渲染                        |
| 典型场景 | 触发大范围更新时使用                  | 值变化频繁时使用                              |
| 返回值   | 无返回值（直接执行）                  | 返回延迟值                                    |
| 示例     | `startTransition(() => setList(...))` | `const deferredList = useDeferredValue(list)` |

✅ 可以这么理解：

- startTransition → 手动告诉 React「这段更新是低优先级」；
- useDeferredValue → 自动让「依赖这个值的更新」变低优先级。

## 💡 四、典型使用场景

### 输入框 + 复杂渲染：

```jsx
const [text, setText] = useState("");
const deferredText = useDeferredValue(text);
<List keyword={deferredText} />;
```

→ 保证输入流畅，延迟复杂渲染。

### 过滤大数据：

```jsx
const deferredFilter = useDeferredValue(filter);
const filteredList = useMemo(
  () => bigList.filter((item) => item.includes(deferredFilter)),
  [deferredFilter]
);
```

### 搜索建议、排序、图表更新等高负载任务。

## ⚡ 五、与性能关系

在高并发下：

- 用户交互（高优）需要立即执行；
- 列表过滤 / 渲染（低优）可延后；
- useDeferredValue 让 React 在两者之间平衡。

这正是 React Fiber + 并发模式的调度优势所在：

> “把渲染拆片，让低优任务延后执行，高优任务不卡顿。”

## 🧠 六、可以配合 useTransition

其实：

```jsx
const deferredValue = useDeferredValue(value);
```

≈ 等价于：

```jsx
const [isPending, startTransition] = useTransition();
let deferredValue = value;

useEffect(() => {
  startTransition(() => {
    deferredValue = value;
  });
}, [value]);
```

所以可以说：

> useDeferredValue 是 useTransition 的语法糖，用于值延迟，而非手动包逻辑。

## ✅ 七、总结一句话

useDeferredValue 让 React 在“频繁变动的输入 + 重渲染”场景下保持流畅。
它会返回一个「延迟更新」的值，使得依赖该值的渲染变成低优先级任务。

## 🧩 一句话对比总结

| API                  | 功能                   | 用法   |
| -------------------- | ---------------------- | ------ |
| `startTransition()`  | 标记一段更新为低优先级 | 包函数 |
| `useDeferredValue()` | 返回值的低优先级副本   | 包变量 |
