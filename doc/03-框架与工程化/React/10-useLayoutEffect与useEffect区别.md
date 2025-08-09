# useLayoutEffect 与 useEffect 区别

useLayoutEffect 和 useEffect 都是 React 中用于处理副作用（side effect）的 Hook，但它们的触发时机不同，适用于不同场景。

## 🧠 一句话理解

- useEffect: 异步执行，在浏览器完成绘制后执行。
- useLayoutEffect: 同步执行，在 DOM 变更后，浏览器绘制前执行。

## ⏱️ 执行时机对比

| 阶段                        | useEffect             | useLayoutEffect              |
| --------------------------- | --------------------- | ---------------------------- |
| 组件渲染前                  | ❌ 不执行             | ❌ 不执行                    |
| 组件渲染后 → DOM 更新后     | ✅ 等待绘制完成后执行 | ✅ 紧跟着 DOM 更新后立即执行 |
| 浏览器绘制前（layout 阶段） | ❌                    | ✅                           |
| 浏览器绘制后（paint 阶段）  | ✅                    | ❌                           |

## 📊 实例演示

```jsx
function App() {
  useEffect(() => {
    console.log("useEffect");
  });

  useLayoutEffect(() => {
    console.log("useLayoutEffect");
  });

  return <div>Hello</div>;
}
```

输出顺序：

```text
useLayoutEffect
useEffect
```

## 🔧 使用场景建议

| 使用场景                        | 建议使用          |
| ------------------------------- | ----------------- |
| 需要读取布局、计算 DOM 尺寸     | `useLayoutEffect` |
| 修改 DOM 位置或滚动（防止闪烁） | `useLayoutEffect` |
| 发送请求、订阅、日志等副作用    | `useEffect`       |
| 动画初始状态设置（如 fade-in）  | `useLayoutEffect` |
| 性能要求不高的副作用            | `useEffect`       |

## ⚠️ 注意事项

### 🔥 阻塞渲染

- useLayoutEffect 会阻塞浏览器绘制，执行时间长会造成页面卡顿、白屏。
- 所以，如果不是必须同步处理 DOM 的副作用，优先选择 useEffect。

### SSR 不兼容警告

- 在服务端渲染（SSR）中，React 会警告你不要使用 useLayoutEffect，建议用 useEffect 或条件判断后再使用。

## 📌 小结对比表

| 特性                  | useEffect         | useLayoutEffect         |
| --------------------- | ----------------- | ----------------------- |
| 是否阻塞浏览器绘制    | ❌ 否             | ✅ 是                   |
| 执行时机              | paint 之后        | layout 之后，paint 之前 |
| 是否适合读取 DOM 信息 | ❌ 否             | ✅ 是                   |
| SSR 是否推荐          | ✅ 是（无副作用） | ❌ 否（会有警告）       |
