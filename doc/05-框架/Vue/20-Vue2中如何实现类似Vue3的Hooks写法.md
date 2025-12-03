# Vue2 中如何实现类似 Vue3 的 Hooks 写法

Vue 2 本身没有 Composition API，所以需要使用 多种方式模拟 Hook 特性。

## ✅ Vue 2 中实现 hooks 的 4 大方式

### 方式一：使用官方 Composition API 插件（首选）

> Vue2 + @vue/composition-api
> 这是官方提供的 “Vue 2 版本的 Composition API”。

📌 使用场景：

- 想在 Vue2 中完全使用 Vue3 风格的 Hooks
- 想无缝迁移到 Vue3
- 想写 useXxx 这种 composables

安装

```bash
npm install @vue/composition-api
```

main.js

```ts
import Vue from "vue";
import VueCompositionAPI from "@vue/composition-api";

Vue.use(VueCompositionAPI);
```

定义 composable（useCounter）

```ts
import { ref } from "@vue/composition-api";

export function useCounter() {
  const count = ref(0);
  const inc = () => count.value++;
  return { count, inc };
}
```

使用（与 Vue3 完全一致）

```ts
import { useCounter } from "@/composables/useCounter";

export default {
  setup() {
    const { count, inc } = useCounter();
    return { count, inc };
  },
};
```

- ✔️ 优点：最接近 Vue3，迁移成本低
- ✔️ 逻辑复用能力最强
- ✔️ TS 支持最好

### 方式二：基于 mixins + 工厂函数 模拟 hooks 风格

Vue 2 内置 mixins，但它最终会“注入到组件”，而不是返回一个“逻辑对象”。
为了让它更像 hook，需要使用“工厂函数生成 mixin”。

定义一个 useXxx（mixin 工厂）

```js
export function useMouse() {
  return {
    data() {
      return {
        x: 0,
        y: 0,
      };
    },
    mounted() {
      window.addEventListener("mousemove", this._handler);
    },
    beforeDestroy() {
      window.removeEventListener("mousemove", this._handler);
    },
    methods: {
      _handler(e) {
        this.x = e.clientX;
        this.y = e.clientY;
      },
    },
  };
}
```

使用

```js
import { useMouse } from "@/mixins/useMouse";

export default {
  mixins: [useMouse()],
};
```

⚠️ 注意：

- mixin 内部的变量不能像 Vue3 的 ref 一样独立
- 命名冲突风险更大

- ✔️ 优点：Vue2 原生支持
- ❌ 缺点：不像真正的 hooks（不返回逻辑对象）

### 方式三：利用 Renderless Component（无渲染组件）模拟 hooks

Renderless Component 是 Vue 2 时代非常重要的逻辑复用方式。

核心思想：

- 将逻辑封装在一个组件中
- 通过 scoped-slot 把逻辑暴露出去
- 业务组件仅消费逻辑数据

定义逻辑组件

```html
<!-- MouseProvider.vue -->
<template>
  <slot :x="x" :y="y"></slot>
</template>

<script>
  export default {
    data() {
      return { x: 0, y: 0 };
    },
    mounted() {
      window.addEventListener("mousemove", this.move);
    },
    beforeDestroy() {
      window.removeEventListener("mousemove", this.move);
    },
    methods: {
      move(e) {
        this.x = e.clientX;
        this.y = e.clientY;
      },
    },
  };
</script>
```

使用

```html
<MouseProvider v-slot="{ x, y }">
  <div>{{ x }} - {{ y }}</div>
</MouseProvider>
```

- ✔️ 优点：解耦 UI 和逻辑
- ❌ 缺点：写法繁琐，迁移成本大

React 时代的 render-props。

### 方式四：使用事件总线 / 外部状态容器（不推荐）

有团队会将逻辑封装成一个独立模块，然后通过：

- EventEmitter
- RxJS
- Vue.observable
- Vuex module
- mitt
- pub/sub

把数据“推”给组件。

示例（Vue.observable）

```js
import Vue from "vue";
export const mouseState = Vue.observable({ x: 0, y: 0 });

window.addEventListener("mousemove", (e) => {
  mouseState.x = e.clientX;
  mouseState.y = e.clientY;
});
```

使用

```html
<div>{{ mouseState.x }}</div>
```

⚠️ 缺点非常明显：

- 全局单例，不可多实例
- 无法销毁
- 不是真正意义的 composable

只适用于极少数场景。

## 🔥 最推荐的最佳方案

如果你项目允许安装依赖，务必使用官方 @vue/composition-api：

- Vue 2 使用 Vue 3 的 hooks 的唯一正确解法。

这是当时官方为 Vue3 做的过渡方案，用于：

- 让 Vue2 也能用 Composition API
- 让 Vue3 迁移更顺滑
- 保证 API 一致性

## 🧩 对比总结

| 方式                  | 可复用性   | 写法接近 Vue3 | 是否推荐      |
| --------------------- | ---------- | ------------- | ------------- |
| @vue/composition-api  | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐    | ✅ 强烈推荐   |
| mixins 工厂           | ⭐⭐⭐     | ⭐⭐          | ⚠️ 可用       |
| renderless component  | ⭐⭐⭐⭐   | ⭐            | ⚠️ 可用但笨重 |
| observable / EventBus | ⭐         | ⭐            | ❌ 不推荐     |
