# TreeShaking 原理

Tree Shaking 是前端构建工具中的一项关键优化机制。它的本质是 在打包阶段通过静态分析移除未被使用的代码（dead code），从而减小最终构建产物体积。

## 🧠 Tree Shaking 的原理

### 1. 基于 ES Module 的静态结构

Tree Shaking 依赖于 ESM 的特性：

- import / export 是静态结构，可在编译阶段解析。
- 构建工具能准确分析出哪些模块和导出成员实际被用到了。

例如：

```js
// util.js
export const used = () => {};
export const unused = () => {};

// app.js
import { used } from "./util";
used();
```

在打包时，构建工具只保留 used 函数，移除 unused。

### 2. 构建工具的静态分析（Static Analysis）

工具（如 Webpack、Rollup）会做：

- 模块依赖图分析（module graph）
- 导入导出分析（谁引用了谁）
- 副作用检测（是否有副作用）

当某个模块或导出没有被任何地方引用，且没有副作用，即可移除。

---

## 🚨 Tree Shaking 失效的常见场景

### 🔁 1. 使用 CommonJS（require / module.exports）

```js
// common.js
exports.a = () => {};
exports.b = () => {};

// app.js
const { a } = require("./common");
```

> ❌ 失效原因：require 是运行时动态执行，构建工具无法静态分析。

✅ 解决办法：改用 ES Module：

```js
export const a = () => {};
```

### 🎭 2. 动态导入或动态属性访问

```js
import * as utils from "./utils";
const fn = utils["doSomething"];
fn();
```

> ❌ 构建工具无法确定 utils 中具体用到了哪些成员，因此不移除未使用的函数。

### 🧨 3. 有副作用（side effects）

如导入模块后立即执行某些代码：

```js
// polyfill.js
console.log("polyfill loaded");
```

即使没有引用导出成员，也可能保留整个模块。

> 构建工具默认不会移除有副作用的模块。

✅ 解决方案：在 package.json 中显式声明无副作用：

```json
{
  "sideEffects": false
}
``
```

或使用数组方式排除 CSS 等副作用文件：

```json
{
  "sideEffects": ["*.css"]
}
```

### 🏷️ 4. Babel 转译破坏 ES Module

某些 Babel 插件或 preset（如 @babel/preset-env）默认会将 import/export 转换成 CommonJS。

> ❌ 这会破坏静态结构，Tree Shaking 失效。

✅ 解决方案：

- 使用带有 modules: false 的配置，保留 ES Module：

````js
presets: [['@babel/preset-env', { modules: false }]]
```
````

### 🧱 5. 第三方库没有使用 ESM 或声明副作用

例如某些库只提供 CJS 版本，或没有正确标记 "sideEffects"。

### ✅ 总结：Tree Shaking 有效的必要条件

| 条件                       | 是否必须 | 说明                                   |
| -------------------------- | -------- | -------------------------------------- |
| 使用 ES Module             | ✅       | 动态结构不行（如 CommonJS）            |
| 无副作用                   | ✅       | 模块中没有立即执行的代码               |
| 构建工具支持 Tree Shaking  | ✅       | 如 Webpack 2+、Rollup、Vite            |
| Babel 保留 `import/export` | ✅       | Babel 不应转换为 `require`             |
| 第三方库声明副作用情况     | ⚠️       | 没声明会保留所有代码（无论是否被使用） |
