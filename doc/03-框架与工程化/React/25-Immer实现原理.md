# Immer 实现原理

Immer 是一个非常巧妙的 不可变数据（immutable data）管理库，它的核心原理是：

> “通过 Proxy 代理可变操作，在保持不可变数据结构的同时，让开发者像写可变代码一样去修改对象。”

## 🧩 一、核心思想

在没有 Immer 时，我们通常要手动“深拷贝”：

```js
const nextState = {
  ...state,
  todos: state.todos.map((todo) =>
    todo.id === 1 ? { ...todo, done: true } : todo
  ),
};
```

使用 Immer：

```js
import produce from "immer";

const nextState = produce(state, (draft) => {
  draft.todos[0].done = true; // 像直接修改一样写
});
```

但实际上，state 是不可变的，draft 是一个代理对象（Proxy）。
Immer 会追踪所有修改，最终生成一个新的不可变对象。

## ⚙️ 二、核心步骤概览

Immer 的核心函数是：

```ts
produce(baseState, recipe) => nextState
```

它的执行流程大致如下：

1. 创建 Proxy 代理（Draft）
   - 使用 Proxy 代理 baseState。
   - 拦截所有的 get / set 操作。
   - get 时，如果访问的是对象属性，则递归生成子代理。
   - set 时，记录被修改的属性。
2. 执行用户的修改函数（recipe）
   - 用户在 recipe(draft) 中修改 draft。
   - 这些修改操作被 Proxy 拦截并记录。
3. 检测是否有修改
   - 如果未发生任何修改，直接返回 baseState（共享引用）。
   - 如果有修改，则“基于拷贝”生成新的不可变对象。
4. 递归 finalize 阶段
   - 将代理对象转回普通对象。
   - 对被修改的部分进行浅拷贝。
   - 未修改的部分保持原引用。

## 🔍 三、核心代码原理（简化版）

下面是一个高度简化版的核心逻辑：

```js
function produce(baseState, recipe) {
  const proxies = new WeakMap(); // 记录代理
  const copies = new WeakMap(); // 记录被修改的副本

  function createProxy(base) {
    return new Proxy(base, {
      get(target, key) {
        const value = target[key];
        // 如果是对象，递归代理
        if (typeof value === "object" && value !== null) {
          if (!proxies.has(value)) {
            proxies.set(value, createProxy(value));
          }
          return proxies.get(value);
        }
        return value;
      },
      set(target, key, value) {
        // 第一次修改时创建副本
        if (!copies.has(target)) {
          copies.set(
            target,
            Array.isArray(target) ? [...target] : { ...target }
          );
        }
        const copy = copies.get(target);
        copy[key] = value;
        return true;
      },
    });
  }

  const draft = createProxy(baseState);
  recipe(draft); // 用户修改 draft

  return finalize(baseState);

  function finalize(base) {
    if (copies.has(base)) {
      const copy = copies.get(base);
      for (const key in copy) {
        const value = copy[key];
        if (typeof value === "object" && value !== null) {
          copy[key] = finalize(value);
        }
      }
      return copy;
    }
    return base;
  }
}
```

这个实现展示了 Immer 的“懒拷贝 + Proxy 拦截 + 结构共享”机制。

## 🧠 四、性能优化机制

Immer 的设计非常注重性能。它通过 结构共享（structural sharing） 避免了无谓的拷贝。

- 只在第一次修改时复制对象（Copy-on-Write）
- 没有被修改的部分仍然指向旧对象（复用内存）
- 最终生成的对象仍是全新的不可变对象树

举例：

```js
const base = { a: { x: 1 }, b: 2 };
const next = produce(base, (draft) => {
  draft.a.x = 2;
});

console.log(base === next); // false
console.log(base.b === next.b); // true （未修改，引用复用）
```

## 🧩 五、关键内部概念（Immer 源码中的实现）

Immer 内部有一些核心对象和术语：

| 名称            | 含义                                                         |
| --------------- | ------------------------------------------------------------ |
| **Draft**       | 被 Proxy 包裹的可变版本                                      |
| **Base State**  | 原始不可变对象                                               |
| **Copy**        | 被修改的浅拷贝                                               |
| **Draft State** | 保存当前代理状态的内部对象                                   |
| **ImmerScope**  | 管理一轮 `produce()` 调用的上下文（draft 栈、parent 关系等） |

## 🧬 六、Immer 源码架构（简要）

```txt
produce()
 ├── createProxy()      创建草稿代理
 ├── markChanged()      记录修改
 ├── finalize()         生成最终对象
 ├── ImmerScope         管理作用域
 └── DRAFT_STATE symbol 内部状态管理
```

每个 draft 都有一个隐藏的内部字段：

```js
const DRAFT_STATE = Symbol("immer-state");

draft[DRAFT_STATE] = {
  base, // 原始数据
  copy, // 修改后的副本
  parent, // 父 draft
  scope, // 当前作用域
  modified, // 是否已修改
  finalized, // 是否已完成
};
```

## 🧾 七、总结对比

| 对比项       | 传统 Immutable.js    | Immer                    |
| ------------ | -------------------- | ------------------------ |
| 语法风格     | 函数式链式调用       | 直接“可变写法”           |
| 实现方式     | 自定义不可变数据结构 | Proxy + 普通对象         |
| 学习曲线     | 高                   | 低                       |
| 性能优化     | 结构共享             | Copy-on-Write + 结构共享 |
| 底层语言支持 | 自己实现持久化结构   | 借助 JS Proxy            |

## 🚀 八、关键特性总结

- ✅ 不可变数据的自动管理
- ✅ 仅在修改时才复制（Lazy Copy）
- ✅ 支持嵌套对象、数组
- ✅ 结构共享提升性能
- ✅ 保持类型安全（在 TS 下）
- ✅ 支持 patch 生成、applyPatches
