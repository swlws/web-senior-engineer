# Vite 中插件的能力

✅ Vite 中没有 Webpack 那种 “loader” 的概念

但 存在等价的能力，由 插件（Plugin）体系 代替 loader 的所有功能。

## 🧩 1. Webpack 的 “loader” 是什么？

Webpack 里面 loader = 对文件进行转换的函数，例如：

- babel-loader
- vue-loader
- css-loader
- url-loader
- file-loader
- ts-loader

loader 的核心特点：

- 单一职责（处理文件 → 输出 JS）
- 线性链式执行（从右向左）
- 不能控制整个构建流程，只能处理模块内容

它不是插件，只是 transform pipeline 的一环。

## 🧩 2. Vite 为什么没有 loader？

核心原因：Vite 基于浏览器原生 ESM，不需要提前把所有内容打包成 JS。

Vite 构建体系是：

- dev：按需加载 → 每个模块直接走 transform
- build：使用 Rollup → 不再需要 loader 这种概念

因此，Vite 直接使用统一的 plugin 系统来做所有的事情。

## 🧩 3. loader 在 Vite 中由什么替代？

Webpack loader 在 Vite 中全部由 插件（Plugin）中的 transform/load/resolveId 替代：

对应关系如下：

| Webpack              | Vite          |
| -------------------- | ------------- |
| loader               | transform()   |
| loader 中的 file read  | load()        |
| loader 中的 alias/路径处理 | resolveId()   |
| pitch loader         | Vite 无对应（不需要） |

例如：

- Webpack 中处理 .vue 需要 vue-loader
- Vite 中：

```ts
plugin: [
  vue()
]
```

`@vitejs/plugin-vue` 的底层就是实现：

- resolveId() 用于识别 vue-module
- load() 加载 .vue 文件内容
- transform() 解析 script/template/style

> 可以说：Vite 的 plugin = loader + plugin（结合体）

## 🧩 4. transform 的能力比 Webpack loader 更强

Vite 的 plugin transform 支持以下：

- 文件解析
- AST 转换
- 注入 HMR
- 注入热更新逻辑
- 控制构建产物
- 修改打包 chunk
- 在 dev 和 build 中的行为不同

例如：

```ts
export default {
  name: 'my-transform',
  enforce: 'pre',
  transform(code, id) {
    if (id.endsWith('.md')) {
      const html = markdownToHtml(code)
      return `export default ${JSON.stringify(html)}`
    }
  }
}
```

只几行代码，就能写一个 md-loader 的替代品。

## 🧩 5. Dev 与 Build 中 transform 行为不同

Vite 运行两次构建体系：

- dev 模式（Esbuild + Vite 自己的模块系统）
  - transform() 使用 esbuild 进行 TS/JS/Faster 编译
  - 即时按需编译
- build 模式（Rollup）
  - transform() 挂载为 Rollup 插件
  - 统一通过 Rollup 打包模块

这一点也是 Vite 与 loader 最大的不同：

> loader 只在 Webpack 中执行一次 transform；
> Vite 的 transform 既能在 dev 中执行，也能在 build 中执行。

## 🧩 6. 那 Vite 有没有等价于 Webpack “文件处理” 的能力？

Webpack 有 url-loader、file-loader

Vite 内置能力：

- assets inline（base64）
- assets 包装文件 url
- CSS 处理
- 动态 import

通过 build.assetsInlineLimit、alias、resolve 都可以实现。

没有 loader，是因为：

> Vite 把所有“加载逻辑”整合进统一的插件体系，而不是 loader + plugin 的双体系。

## 🎯 最终总结

- Vite 中没有 Webpack 那种 loader 的概念。
- Vite 使用插件（Plugin）替代 loader 的所有功能。
- Vite 插件统一实现：
  - 文件解析（load）
  - 文件转换（transform）
  - 路径解析（resolveId）
  - 构建产物修改（generateBundle）
- 这套体系比 loader 更强，更统一。
- Vue、React、TS、CSS 都是通过 Vite 插件处理的，而不是 loader。
