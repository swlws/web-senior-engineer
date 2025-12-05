# Vue2 如何使用 setup 语法

要在 Vue 2 中使用 setup()，必须依赖 官方插件：`@vue/composition-api`。

## 🎯 关键点：setup 不是 Vue 2 的内置功能

setup() 是 Vue 3 引入的 API。
Vue 2 本体（无论 2.0 ~ 2.7）都没有这个语法。

官方为了让 Vue 2 提前使用 Composition API，发布了插件：

```bash
@vue/composition-api
```

该插件 向 Vue 2 注入 Composition API，包括 setup() API。

## 🚀 支持 setup 的 Vue 2 环境要求

✔ Vue 2 至少 2.5+ 就可以使用 Composition API 插件

但官方实际推荐：

- Vue 2.6.x（最常用、最稳定）
- Vue 2.7.x（更进一步：部分 Vue3 API 内联到 core）

因此，只需要满足：

```txt
Vue 2.6.x 或 Vue 2.7.x
+
安装 @vue/composition-api
```

就能使用 setup。

## 🔍 Vue 2.7 是特殊版本

Vue 2.7 是 Vue2 的最终大版本，也是 Vue2 的“桥接版”：

- 无需安装 `@vue/composition-api`
- Composition API 已被内置（部分实现与 Vue3 一致）
- 仍然可以写 `setup()`

但注意：

| 功能                        | Vue 2.7 是否支持 |
| --------------------------- | ---------------- |
| setup()                     | ✔ 支持           |
| ref/reactive computed watch | ✔ 支持           |
| script setup                | ❌ 不支持        |
| Teleport                    | ❌ 不支持        |
| Fragment                    | ❌ 不支持        |
| Suspense                    | ❌ 不支持        |

所以 Vue 2.7 是：

> 介于 Vue2 与 Vue3 之间的“过渡版”，但不是 Vue3。

## 📌 简单版本结论（可直接记住）

- 🔹 Vue 2.0 ~ 2.6：没有 setup，必须安装 `@vue/composition-api` 才支持 setup
- 🔹 Vue 2.7：天然支持 setup（无需插件），但不支持 script setup

## 📌 推荐方案

如果你现在维护 Vue2 项目：

| Vue 版本  | 最佳方式                                              |
| --------- | ----------------------------------------------------- |
| **2.6.x** | **Vue 2.6 + @vue/composition-api**（企业最稳定）      |
| **2.7.x** | **直接用内置 setup()**（更接近 Vue3，未来迁移更容易） |
