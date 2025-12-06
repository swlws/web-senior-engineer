# Pinia在设计上为什么去除 Mutation

Pinia 去掉 mutation（突变函数）不是偶然，而是 Pinia 作者 基于 Vue3 思想 + 实践经验后做出的明确设计决策。

下面从 框架思想、使用体验、技术实现、实践反馈 几个维度讲清楚。

## ✅ 一、Pinia 去掉 mutation 的根本原因：Vue3 时代 mutation 已经不再有价值

Vuex（特别是 Vuex2）设计 mutation 的初衷：

1. 所有修改 state 的行为必须可追踪
2. 同步更新与异步更新分离（mutation 同步，action 异步）
3. DevTools 能追踪每次 mutation 变化

在 Vue2（基于 Object.defineProperty）时代，这种约束有意义。

但是到了 Vue3 + Proxy：

**👉 代理机制让所有 state 变更自动可追踪**

开发者不再需要区分“同步变更”还是“异步操作触发的变更”。

## ✅ 二、mutation 带来的痛点比好处多

### 1. 过度样板代码（boilerplate）

Vuex 必须写：

```js
mutations: {
  setCount(state, n) {
    state.count = n
  }
}
```

而 Pinia 直接：

```js
count++
```

或者：

```js
this.count = n
```

可维护性和可读性更高。

### 2. mutation 与 action 的角色模糊

真实业务里：

几乎所有业务逻辑都写在 actions
actions 最后还要 `commit('xx')` 调用 mutation。

导致：

- mutation 全是“没有业务含义”的 setter
- action 才是真正逻辑部分

➡ 项目越大越冗余。

Pinia 直接把两者合成 action：

- 写逻辑
- 写异步
- 写同步
- 写 state 修改

全部在一个 action 里完成。

### 3. mutation 强制同步的限制毫无意义

Vuex 的设计：

> “mutation 必须同步执行，否则 DevTools 无法正确追踪”

到了现代框架时代：

- DevTools 可以自动追踪异步 action 内的 state 改动
- 没必要人为区分同步 / 异步

Pinia 也验证了一点：

**👉 开发者根本不需要 mutation**

## ✅ 三、Pinia 设计风格：更接近 Composition API

Pinia 更像是：

```js
useXXXStore() === useXXX()
```

它与 Composition API 思想一致：

- state 就是 reactive()
- 修改 state 就是赋值
- 方法就是逻辑

你不会在 Composition API 中写：

```js
function setUserName(name) {
  state.name = name
}
```

你会直接：

```js
state.name = name
```

因此 Pinia 很自然地去掉 mutation。

## ✅ 四、DevTools 在 Proxy 时代不再需要 mutation 这种 hook

Vue3 的 Proxy 完全能追踪：

- 哪个 store
- 哪个 state 字段
- 何时被修改
- 修改前后值

DevTools 可以自动捕捉所有更改，不需要 mutation 这种中间层。

## ✅ 五、Pinia 的官方目标：更易用、更轻、更符合 Vue3

Pinia 作者 Eduardo 明确说过（总结）：

> Mutation 只是 Vuex 历史包袱，在现代应用中没有意义。
> Action 完全可以承担 mutation 的功能，因此移除。

Pinia 的目标：

- 让 store 更像普通 JS 模块
- 让开发体验更好
- 让代码逻辑更集中
- 清除 Vuex 遗留下来的不必要概念

## 🎯 Pinia 去掉 mutation 的核心价值总结

| Vuex                      | Pinia          | 说明            |
| ------------------------- | -------------- | ------------- |
| state + mutation + action | state + action | 减少概念，提升可读性    |
| mutation 必须同步             | 无限制            | 去掉历史包袱        |
| mutation 仅用于追踪            | Proxy 已能追踪     | 不再需要 mutation |
| 逻辑分散                      | action 集中逻辑    | 更自然           |
| 较多样板代码                    | 极简写法           | 更轻量           |

## 🔥 一句话总结

Pinia 去掉 mutation，是因为在 Vue3 + Proxy 时代，mutation 的唯一作用（追踪更新）已经被自动实现，而它带来的复杂性和样板代码反而成了负担。
