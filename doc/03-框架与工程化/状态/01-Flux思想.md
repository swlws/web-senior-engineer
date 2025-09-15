# Flux 思想

## 🔎 什么是 Flux

Flux 不是一个框架，而是一种 `前端应用的状态管理思想`，最早由 Facebook 提出，用来解决 React 项目中 数据流混乱 的问题。

它的核心是：`单向数据流（Unidirectional Data Flow）`。

## ⚙️ Flux 的核心要素

1. Action（动作）

- 描述一次事件或用户操作（例如“点击按钮”“新增任务”）。
- 本质上就是一个普通对象 { type, payload }。

2. Dispatcher（分发器）

- 唯一的调度中心，接收 Action 并分发给 Store。
- 保证应用中的 Action 按顺序、统一地流转。

3. Store（状态容器）

- 存放应用的状态和业务逻辑。
- 接收 Dispatcher 派发的 Action，更新状态后通知 View。
- 注意：Store 不是 MVC 中的 Model，它更像是一个「状态和逻辑的集合」。

4. View（视图层，React 组件）

- 通过监听 Store 的变化来更新 UI。
- 用户在 View 上的操作会触发新的 Action，形成闭环。

## 🔄 数据流动过程（单向）

1. 用户在 View 上进行操作（点击、输入等）
2. 触发一个 Action（描述这次操作）
3. Dispatcher 分发这个 Action
4. Store 根据 Action 修改状态
5. View 监听到 Store 变化后，重新渲染

📌 特点：数据永远是单向流动的，不会出现双向绑定带来的状态混乱。

## 📊 对比

- MVC：数据和视图之间可能相互影响，容易出现状态难以追踪的问题。
- Flux：引入 Dispatcher，把所有数据更新过程串起来，保证数据流清晰。
- Redux：是 Flux 思想的具体实现（去掉 Dispatcher，用纯函数 Reducer 替代 Store 的逻辑）。

## ✅ 一句话总结：

Flux 思想的核心是“单向数据流”：Action → Dispatcher → Store → View，它通过这种机制让状态管理更清晰、可预测。
