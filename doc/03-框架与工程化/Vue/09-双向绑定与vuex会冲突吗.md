# 双向绑定与 vuex 会冲突吗

不会直接冲突，但它们在 理念 和 使用场景 上是有差异的，所以如果混用不当会产生问题。

## 1. 双向绑定的本质

在 Vue 中，双向绑定（通常是 v-model）本质上是：

- 通过 props 将值传给子组件
- 子组件通过 emit 事件通知父组件更新

等价于 父传子值 + 子通知父更新 的简写。

## 2. Vuex 的本质

Vuex 强调 单向数据流：

- state 是唯一数据源，集中管理
- 组件通过 getter 获取 state
- 修改数据必须经过 mutation/action，可追踪、可调试

## 3. 潜在的“冲突”

如果在使用 Vuex 时，还对某个 state 绑定了 v-model，就可能出现以下情况：

### ❌ 不推荐的写法：

```html
<input v-model="$store.state.user.name" />
```

- 这样会 直接修改 state，绕过 mutation
- 破坏 Vuex 的规范性（不可追踪、不利于调试）

## 4. 正确的结合方式

可以借助 计算属性的 getter/setter 实现：

```html
<template>
  <input v-model="userName" />
</template>

<script>
  export default {
    computed: {
      userName: {
        get() {
          return this.$store.state.user.name;
        },
        set(value) {
          this.$store.commit("updateUserName", value);
        },
      },
    },
  };
</script>
```

这样：

- v-model 双向绑定依旧好用
- 数据修改还是走 Vuex 的 mutation，符合单向数据流

## 5. 总结

- 双向绑定和 Vuex 不冲突
- 但 不要直接改 Vuex state，必须通过 mutation
- 推荐用 computed 的 getter/setter 结合 v-model
