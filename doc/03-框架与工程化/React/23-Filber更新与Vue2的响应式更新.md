# Filber 更新与 Vue2 的响应式更新

React（Fiber 架构）和 Vue2（基于依赖追踪的响应式系统）在组件更新机制上存在非常本质的差异。
React 强调`「可调度的更新流程」`，而 Vue2 强调`「精确依赖追踪」`。

## 🧩 一、整体对比概览

| 对比项           | **React（Fiber 架构）**                   | **Vue 2.x（响应式系统）**                       |
| ---------------- | ----------------------------------------- | ----------------------------------------------- |
| **更新触发机制** | `setState()` / `useState()` 明确触发      | `Object.defineProperty` 劫持 + 依赖追踪自动触发 |
| **更新粒度**     | 自上而下（以组件为单位）                  | 精确依赖（以数据为单位）                        |
| **调度机制**     | Fiber Scheduler（可中断、可恢复、可合并） | 微任务 + 异步队列（`nextTick`）                 |
| **渲染策略**     | 虚拟 DOM diff（每次更新整棵子树）         | 精确依赖更新（仅更新使用到的 watcher）          |
| **可中断性**     | ✅ 可中断（Concurrent Mode）              | ❌ 不可中断                                     |
| **批量更新**     | React 18：自动批处理（Fiber lanes）       | 异步批量更新（`nextTick`）                      |
| **目标**         | 高并发性能（响应流畅度）                  | 响应式精准更新（开发简便）                      |

## 🧠 二、更新触发机制差异

### 🔹 React：显式更新

React 的数据流是单向的、显式的：

```jsx
setCount(count + 1);
```

- 调用 setState → 触发 Fiber 架构调度；
- React 不追踪依赖，而是每次 render 都重新执行；
- React 通过 虚拟 DOM diff 判断哪些子树需要更新。

➡️ 优点：逻辑简单，纯函数化渲染。
➡️ 缺点：需要重新执行 render，代价较大。

### 🔹 Vue 2：自动依赖追踪

Vue 2 用 Object.defineProperty 劫持属性 getter/setter：

```js
data: {
  count: 0;
}

this.count++; // setter -> 通知依赖的 watcher 重新执行
```

- 每个响应式属性有自己的 Dep（依赖收集器）；
- 组件渲染时触发 getter，收集依赖；
- setter 修改数据时，只通知那些依赖它的 watcher。

➡️ 优点：更新精准，只更新受影响的部分。
➡️ 缺点：依赖追踪复杂，响应式边界不透明。

## ⚙️ 三、渲染调度差异

#### 🧩 React Fiber 调度（基于优先级 + 可中断）

React 将更新任务拆分为「可中断的 Fiber 单元」：

```txt
setState()
  ↓
加入 Fiber 更新队列
  ↓
Scheduler 根据优先级执行
  ↓
时间不够？暂停
  ↓
下次空闲继续
  ↓
最终统一 commit
```

- 使用 时间切片（Time Slicing）；
- 高优先级任务（用户输入）可以中断低优先级任务；
- 最终在一次 commit 阶段更新 DOM。

### 🧩 Vue2 调度（基于队列 + nextTick）

Vue 的调度简单直接：

```txt
数据变更
  ↓
Watcher 入队（去重）
  ↓
下一轮 tick（微任务）统一执行 watcher.run()
  ↓
渲染虚拟 DOM

```

- 所有同步多次修改都会被合并；
- 没有任务优先级或中断机制；
- 执行是同步的（一次性更新完毕）。

## 🧮 四、更新粒度对比

| 场景             | React                                            | Vue2                               |
| ---------------- | ------------------------------------------------ | ---------------------------------- |
| 状态更新         | 整个组件重新 render                              | 仅依赖数据的 watcher 触发          |
| 子组件是否重渲染 | 根据 props diff 决定                             | watcher 追踪到子组件依赖才更新     |
| 优化手段         | `React.memo`, `useMemo`, `shouldComponentUpdate` | `computed`, `watch`, `v-once`      |
| 数据流方向       | 自上而下（props 传递）                           | 双向绑定（props + emit / v-model） |

## 🧩 五、举个例子更直观

### 🧠 React 版

```jsx
function Parent() {
  const [count, setCount] = useState(0);
  return (
    <>
      <button onClick={() => setCount((c) => c + 1)}>+1</button>
      <Child count={count} />
    </>
  );
}
```

→ 每次点击：

- Parent 重新 render；
- Child 根据 props diff 决定是否更新；
- 没有依赖追踪，全靠 diff 判断。

### 🔮 Vue 2 版

```vue
<template>
  <div>
    <button @click="count++">+1</button>
    <Child :count="count" />
  </div>
</template>

<script>
export default {
  data() {
    return {
      count: 0,
    };
  },
};
</script>
```

→ 每次 count++：

- setter 通知依赖 count 的 watcher；
- Parent 重新 render；
- Vue 自动追踪哪些子组件依赖 count；
- 仅依赖 count 的子组件重新 render。

## 🧩 六、性能与设计哲学差异

| 维度         | React                             | Vue2                          |
| ------------ | --------------------------------- | ----------------------------- |
| 哲学         | 函数式、可预测更新（状态驱动 UI） | 响应式、自动追踪依赖          |
| 性能优化思路 | 减少 render 次数（memoization）   | 减少 watcher 数量（精准依赖） |
| 并发性能     | ✅ Fiber 支持时间切片、优先级调度 | ❌ 无并发调度能力             |
| 开发体验     | 明确、纯函数式逻辑                | 自动、数据驱动逻辑            |

## 🧭 七、总结一句话

> Vue2 是“数据驱动视图”——谁变了就更新谁；
> React 是“状态驱动渲染”——每次 render 都重新计算 UI，只在必要时 diff 更新。

| 能力     | React（Fiber）        | Vue2（响应式）   |
| -------- | --------------------- | ---------------- |
| 更新粒度 | 粗（组件级）          | 细（依赖级）     |
| 更新方式 | 可中断任务调度        | 异步批量 watcher |
| 哲学     | 显式声明 + 函数式更新 | 自动依赖追踪     |
| 优化方向 | 减少 render 次数      | 控制依赖数量     |
