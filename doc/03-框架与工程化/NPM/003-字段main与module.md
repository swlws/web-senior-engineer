# 字段 main 和 module 的区别

package.json 里的 main 和 module 字段都是告诉别人（或打包工具）从你的包中入口文件在哪，但它们的用途和目标环境不一样。

## 1. main

- 用途：指定 Node.js 或 CommonJS 环境下的入口文件。
- 被谁用：
  - Node.js require('your-lib')
  - 旧版本的打包工具（webpack 1/2、browserify）
- 一般指向：打包成 CommonJS 格式 的文件（.js）

例子：

```json
{
  "main": "dist/index.cjs.js"
}
```

如果别人这样写：

```js
const lib = require('your-lib');
```

Node.js 就会去找 `dist/index.cjs.js`。

## 2. module

- 用途：告诉现代打包工具（webpack 2+、Rollup、Parcel 等）这个包的 ES Module 版本 入口。
- 被谁用：
  - 支持 import 的打包工具（优先 tree-shaking）
- 一般指向：打包成 ESM 格式 的文件（.mjs 或 .js）

例子：

```json
{
  "module": "dist/index.esm.js"
}
```

如果别人这样写：

```js
import lib from 'your-lib';
```

支持 ESM 的工具会优先用 dist/index.esm.js。

## 3. 关系与区别

| 字段       | 格式        | 目标环境                 | 主要用途        |
| -------- | --------- | -------------------- | ----------- |
| `main`   | CommonJS  | Node.js、旧工具          | `require()` |
| `module` | ES Module | 新版打包工具（Tree Shaking） | `import`    |

- 为什么 module 对 tree-shaking 友好？
  因为 ESM 是静态结构，打包工具可以分析出哪些导出没被用到，直接移除。
- 如果只写了 main → 新旧环境都用它，但可能失去 tree-shaking 优势。
- 如果只写了 module → 旧的 Node.js 可能加载失败（除非用 .mjs 并设置 "type": "module"）。

## 💡 常见做法（库作者）

```json
{
  "main": "dist/index.cjs.js",
  "module": "dist/index.esm.js",
  "exports": {
    "import": "./dist/index.esm.js",
    "require": "./dist/index.cjs.js"
  }
}
```

这样：

- Node.js require() → main 或 exports.require
- 现代打包工具 → module 或 exports.import
