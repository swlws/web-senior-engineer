# Vue 的事件模型

Vue 的事件模型由 两大部分组成：

- DOM 事件模型（指 v-on 在原生 DOM 上绑定事件）
- 组件事件模型（自定义事件 emit/on）

它们分别对应：

```txt
DOM Event → addEventListener
Component Event → $emit → 父组件监听
```

Vue 与 React 不同：

- Vue 没有合成事件（无需事件委托到 root）
- Vue 在 DOM 上真实绑定事件
- Vue 的组件事件不依赖 DOM 冒泡，而是父子通信机制

## 1. Vue DOM 事件模型（v-on / @）

### 1.1 v-on 的本质

对 DOM：

```html
<button @click="handle"></button>
```

编译后等价于：

```js
el.addEventListener('click', handle)
```

Vue 不会像 React 那样统一绑定到 document（React SyntheticEvent）。

Vue 的做法是：

**✔ 按组件模板真实绑定 DOM listener**

Vue 使用 patch 过程（VNode → DOM）决定是否添加或移除 DOM 事件。

## 2. Vue 的事件修饰符（真正体现 Vue 事件模型）

Vue 为了更易用，在编译阶段内联生成不同的事件包装器。

| 修饰符              | 本质                        |
| ---------------- | ------------------------- |
| `.stop`          | `event.stopPropagation()` |
| `.prevent`       | `event.preventDefault()`  |
| `.capture`       | 绑定 capture 阶段的 listener   |
| `.self`          | event.target === el 时触发   |
| `.once`          | 只执行一次，自动移除 listener       |
| `.passive`       | passive: true             |
| `.native` （Vue2） | 监听子组件根节点的原生事件             |

示例：

```html
<button @click.stop.prevent="fn">
```

编译后：

```js
el.addEventListener('click', (event) => {
  event.stopPropagation();
  event.preventDefault();
  fn(event);
})
```

Vue 会把修饰符 “下沉” 到 bind 阶段。

## 3. Vue 组件事件模型（$emit / v-on）

组件事件是 `逻辑事件，不走 DOM 冒泡`

```html
<!-- 子组件 -->
<button @click="$emit('submit')"></button>

<!-- 父组件 -->
<MyForm @submit="onSubmit"/>
```

### 本质

父组件渲染子组件时，会在 VNode 上登记：

```js
vnode.data.on = {
  submit: onSubmit
}
```

当子组件执行 `$emit('submit')` 时：

```js
this.$vnode.data.on.submit()
```

也就是：

> ✔ 组件事件 = VNode 上注册的回调，不依赖 DOM

因此：

- 组件事件不会冒泡到 DOM
- 组件事件不会跨层级传播
- 组件事件与浏览器事件完全无关

## 4. Vue2 vs Vue3 的事件模型对比

### Vue2 事件绑定逻辑

依赖 createPatchFunction 中的 updateDOMListeners

- 根据 VNode 的 data.on 增删 DOM 事件
- 使用 createFnInvoker 包装回调，使其保持引用稳定（减少 remove/add）

### Vue3 事件绑定逻辑

Vue3 编译时会生成更智能的 patch flag，使事件绑定更高效：

```js
_patchProp(el, 'onClick', prevFn, nextFn)
```

Vue3 会直接用：

```js
el.addEventListener(type, invoker);
```

且只有当事件真正变化时才更新 invoker 的 value，减少频繁 add/remove。

## 5. Vue3 的 v-model 与组件事件

Vue3 使用：

| 功能         | 事件                  |
| ---------- | ------------------- |
| v-model    | `update:modelValue` |
| 额外 v-model | `update:xxx`        |

示例：

```html
<Comp v-model="value" />
```

等价于：

```html
<Comp :modelValue="value" @update:modelValue="value = $event" />
```

这是 Vue3 事件模型非常核心的一部分。

## 6. 特殊事件说明

### 6.1 表单 input 的监听（Vue2 vs Vue3）

Vue2：

- v-model input = input + composition events 合成逻辑

Vue3：

- 使用原生 input 事件（composition 已更好地被原生兼容）

### 6.2 .native（Vue2）已废弃

Vue2：

```html
<MyBtn @click.native="fn"/>
```

Vue3：

已废弃，因为 Vue3 的组件事件可以通过 emits 声明，避免与 DOM 混淆。

## 7. Vue 自身没有 “事件委托机制”，但你可以手动做

Vue 不像 React：

- React：所有事件统一委托在 root
- Vue：逐节点绑定 DOM 事件

但你可以手写事件委托：

```html
<div @click="delegateClick">
  <button data-type="add">Add</button>
  <button data-type="delete">Delete</button>
</div>
```

```js
delegateClick(e) {
  const type = e.target.dataset.type;
  if (type === 'add') ...
}
```

Vue 并不会阻止你这样做。

## 8. 与 React 事件模型对比

| 对比项      | Vue          | React              |
| -------- | ------------ | ------------------ |
| DOM 事件绑定 | 真实 DOM 绑定    | document/root 统一绑定 |
| 是否使用合成事件 | ❌ 没有         | ✔ SyntheticEvent   |
| 组件事件是否冒泡 | ❌ 不会冒泡       | ❌ 不会冒泡             |
| DOM 冒泡   | 原生冒泡         | React 自己模拟         |
| 性能       | 高频事件会一直绑定/解绑 | 少量 listener 性能高    |
| 事件修饰符    | 语法级支持        | JS 手写支持            |
| v-model  | 借助组件事件       | controlled input   |

Vue 更“原生”，React 更“抽象化”。

## 9. 常见 “事件相关坑”

### 9.1 Vue2 .native 与组件事件混淆

```html
<MyButton @click="fn"/>  // 等于监听组件事件
<MyButton @click.native="fn"/> // 监听原生 DOM 事件
```

### 9.2 事件对象丢失（Vue2 中 inline handler）

```html
<button @click="fn(1)">Click</button>
```

等价：

```js
el.addEventListener('click', $event => fn(1, $event))
```

### 9.3 v-for 中绑定事件的性能问题

每个元素都会绑定 listener，解决办法：

- 使用事件委托
- 或在 Vue3 使用 block diff 减少成本

## 🧾 总结

Vue 事件模型 = DOM 事件（真实绑定） + 组件事件（父子通信，不依赖 DOM） + 事件修饰符（封装事件逻辑）。

关键点：

- Vue 没有合成事件，DOM 事件真实绑定在元素上
- Vue 事件修饰符映射为真实的事件包装逻辑
- 组件事件是 $emit → 父组件监听，与 DOM 冒泡无关
- Vue3 patch 事件更加智能，不频繁 add/remove
- Vue2 .native 已废弃
- v-model === update:modelValue 事件机制
- 不推荐在 template 大量绑定高频事件，可手动使用事件委托
