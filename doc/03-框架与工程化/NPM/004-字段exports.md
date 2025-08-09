# 字段 exports

package.json 里的 "exports" 字段有好几种写法，从最简单的到最复杂的，大致可以分成 四类：

## 1. 简单字符串形式（单入口）

直接把包的主入口映射到一个文件。

```json
{
  "exports": "./index.js"
}
```

含义：任何 import 'my-lib' 或 require('my-lib') 都会加载 ./index.js。

用途：最简单的情况，适合只有一个入口文件的库。

## 2. 子路径导出（Subpath Exports）

可以为包暴露多个子路径。

```json
{
  "exports": {
    ".": "./index.js",
    "./utils": "./utils/index.js"
  }
}
```

含义：

- import 'my-lib' 加载 ./index.js。
- import 'my-lib/utils' 加载 ./utils/index.js。

好处：可以精确控制哪些文件对外可见，避免用户直接访问 src/ 这种内部路径。

## 3. 条件导出（Conditional Exports）

根据运行环境、模块系统等动态选择不同文件。

```json
{
  "exports": {
    ".": {
      "import": "./esm/index.mjs",
      "require": "./cjs/index.cjs",
      "types": "./types/index.d.ts"
    }
  }
}
```

常见条件 key：

- "import" → ESM 方式加载时使用
- "require" → CommonJS 加载时使用
- "node" → Node.js 环境使用
- "browser" → 浏览器环境使用
- "default" → 兜底匹配
- "types" → TypeScript 类型声明

优点：可以同时支持 ESM、CJS、类型文件等。

## 4. 通配符子路径（Pattern Exports）

批量映射目录或文件，支持 * 通配符。

```json
{
  "exports": {
    "./features/*": "./src/features/*.js"
  }
}
```

效果：

> import 'my-lib/features/foo' → ./src/features/foo.js

结合条件导出：

```json
{
  "exports": {
    "./features/*": {
      "import": "./src/features/*.mjs",
      "require": "./src/features/*.cjs"
    }
  }
}
```

## exports 与 main、module 的区别

- **exports 是高级功能**：可以根据运行环境、模块系统等动态选择不同文件。
- **main 和 module 是基础功能**：指定打包工具加载的入口文件。
- **exports 可以覆盖 main 和 module**：exports 优先级更高。

## vue-router 例子

```json
{
 "main": "dist/vue-router.common.js",
  "module": "dist/vue-router.esm.js",
  "unpkg": "dist/vue-router.js",
  "jsdelivr": "dist/vue-router.js",
  "exports": {
    ".": {
      "import": {
        "node": "./dist/vue-router.mjs",
        "default": "./dist/vue-router.esm.js"
      },
      "require": "./dist/vue-router.common.js",
      "types": "./types/index.d.ts"
    },
    "./composables": {
      "import": "./composables.mjs",
      "require": "./composables.js",
      "types": "./composables.d.ts"
    },
    "./dist/*": "./dist/*",
    "./types/*": "./types/*",
    "./package.json": "./package.json"
  },
}
```

## ✅ 总结

- 最简单："exports": "./index.js"
- 多个入口：子路径导出
- 跨环境：条件导出
- 批量规则：通配符导出
- 可混合使用，像你给的 vue-router 例子就是 条件导出 + 子路径导出 + 通配符导出 的组合。
