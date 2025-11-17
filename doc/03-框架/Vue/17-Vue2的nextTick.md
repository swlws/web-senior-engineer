# Vue2 的 nextTick

在 Vue 2 中，this.$nextTick 的调度策略其实非常“动态”——既可能是微任务（microtask）也可能是宏任务（macrotask），取决于当前运行环境支持的 API 以及 Vue 的内部降级策略

## ✅ Vue 2 $nextTick：何时是微任务？何时是宏任务？

Vue 2 的 nextTick 调度顺序（从高到低）：

1. Promise（微任务）
2. MutationObserver（微任务）
3. setImmediate（宏任务）
4. setTimeout（宏任务）

只有上层不可用时才降级。

## 🧩 一：什么时候是微任务？

### ✔ 1. 支持 Promise 时 —— 使用 Promise.then（微任务）

现代浏览器 & Node 10+ 均支持 Promise，因此 绝大多数场景 $nextTick 都是微任务。

Vue 2 内部判断：

```js
if (typeof Promise !== "undefined" && isNative(Promise)) {
  // microtask
  timerFunc = () => {
    Promise.resolve().then(flushCallbacks);
  };
  isUsingMicroTask = true;
}
```

➜ 所以：99% 的情况下 $nextTick 是微任务

包括 Vue 2 在 Chrome、Safari、Firefox、Node.js 中运行。

### ✔ 2. 如果 Promise 不可用，但支持 MutationObserver —— 微任务

非常老的浏览器（如早期 IE11 Polyfill）Promise 不可用时，Vue 会降级到：

```js
MutationObserver(microtask);
```

所以也是 微任务。

## 🧩 二：什么时候是宏任务？

只有在微任务方案不可用时，Vue 才会使用宏任务：

### ✔ 1. 支持 setImmediate —— 宏任务

IE10 / Edge 早期浏览器支持 setImmediate。

此时：

```js
timerFunc = () => {
  setImmediate(flushCallbacks);
};
```

这是 宏任务。

### ✔ 2. 最终兜底：setTimeout(fn, 0) —— 宏任务

```js
timerFunc = () => {
  setTimeout(flushCallbacks, 0);
};
```

此时是 宏任务。

这是所有环境都支持的兜底方式。

## 🔍 总结成一句话（可直接背）

在现代浏览器中，Vue 2 的 this.$nextTick 基本永远是微任务（Promise.then）。
只有在 Promise 不可用的情况下，Vue 才回退到宏任务（setImmediate 或 setTimeout）。
