# Vite 与 Webpack 中 loader 与 plugin 能力对比

内容分为：

- 核心概念对照
- Loader、Plugin 能力对照表（最关键）
- 常见生态 Loader vs 对应 Vite 实现方式

## 🧩 1. 核心概念对照：Vite 没有 loader，但插件比 loader 更强

| 特性        | Webpack                                    | Vite                              |
| --------- | ------------------------------------------ | --------------------------------- |
| 文件转换机制    | loader（链式）                                 | plugin → transform / load         |
| 构建核心      | webpack 自己                                 | rollup（build）+ esbuild（transform） |
| 插件目标      | 扩展构建过程                                     | 扩展 dev + build 全周期                |
| 文件系统处理    | file-loader / url-loader                   | 内置 asset 处理（不需要 loader）           |
| CSS       | style-loader / css-loader / postcss-loader | 内置 CSS 处理 + PostCSS               |
| Vue/React | vue-loader / babel-loader                  | plugin-vue / plugin-react         |

Vite 没 loader，是因为：

> Vite 的插件（Plugin）同时具备 loader + plugin 的全部能力。

## 🧩 2. Loader & Plugin 全流程能力对照（最关键）

### ✔ Webpack loader → Vite plugin 的 hook 映射

| Webpack Loader 功能    | 在 Vite 中对应的 Hook                 | 示例                        |
| -------------------- | -------------------------------- | ------------------------- |
| 转换文件（transform file） | `transform(code, id)`            | 替代 babel-loader、ts-loader |
| 加载文件内容（read file）    | `load(id)`                       | 替代 raw-loader             |
| 解析路径（resolve alias）  | `resolveId(id, importer)`        | 替代 resolve.alias          |
| 链式调用                 | `enforce: 'pre' / 'post'` + 多插件  | 与 loader 链等价              |
| 返回 JS 模块             | transform return `{ code, map }` | 和 loader 效果一致             |

### ✔ Webpack plugin → Vite plugin 的 hook 映射

| Webpack Plugin 生命周期                   | Vite Plugin Hook | 作用       |
| ------------------------------------- | ---------------- | -------- |
| compiler.hooks.entryOption            | config()         | 修改配置     |
| compiler.hooks.normalModuleFactory    | resolveId()      | 解析模块     |
| compiler.hooks.compilation            | buildStart()     | 进入构建循环   |
| compilation.hooks.optimizeChunkAssets | generateBundle() | 修改 chunk |
| afterEmit                             | writeBundle()    | 输出产物后执行  |

Vite 的插件生命周期更“平面”，但更简单、覆盖范围更广。

## 🧩 3. 常见 Webpack Loader → 对应 Vite 实现方式

| 需求 / Webpack Loader | Vite 中的替代方案                                                            | 示例                               |
| ------------------- | ---------------------------------------------------------------------- | -------------------------------- |
| babel-loader        | 不需要 → esbuild 提供 TS/JS 转换；如需 Babel → @vitejs/plugin-react、手写 transform | transform                        |
| ts-loader           | 不需要 → Vite 使用 esbuild 处理 TS                                            | 内置                               |
| vue-loader          | @vitejs/plugin-vue                                                     | 官方                               |
| css-loader          | 内置 CSS 处理                                                              | 内置                               |
| style-loader        | HMR + CSS 注入内置                                                         | 内置                               |
| postcss-loader      | 内置 PostCSS                                                             | postcss.config.js                |
| sass-loader         | Vite 内置 sass 支持                                                        | `import './a.scss'`              |
| file-loader         | Vite assets 处理                                                         | `import img from './a.png'`      |
| url-loader          | build.assetsInlineLimit                                                | base64 inline                    |
| raw-loader          | 使用 `?raw`                                                              | `import text from './a.txt?raw'` |
| yaml-loader         | 写一个 plugin → transform                                                 | plugin-yaml                      |
| markdown-loader     | plugin-md → transform                                                  | vite-plugin-md                   |

可以看到：

> Webpack 的 loader 系统，被 Vite 的内置能力 + 插件体系完全覆盖。

## 🧩 4. Webpack 常见插件 → Vite 对应方案

| Webpack Plugin           | Vite 对应方式                    | 说明    |
| ------------------------ | ---------------------------- | ----- |
| DefinePlugin             | define                       | 内置    |
| HtmlWebpackPlugin        | Vite 原生 HTML 作为入口            | 不需要   |
| MiniCssExtractPlugin     | build.cssCodeSplit           | 内置    |
| CopyWebpackPlugin        | vite-plugin-static-copy      | 社区    |
| ProvidePlugin            | 在请求到模块处写 transform 注入 import | 需手写插件 |
| CompressionWebpackPlugin | vite-plugin-compression      | 社区    |
| BundleAnalyzerPlugin     | rollup-plugin-visualizer     | 同样可用  |
| EnvironmentPlugin        | import.meta.env              | 内置    |

Webpack 插件体系 → Vite/rollup 的插件体系，基本一一对应。

## 🎯 最后的总结

- Vite 没有 loader 的概念，所有 loader 的功能都由插件体系（Plugin）里的 load/transform 实现。
- Webpack 的 loader + plugin，在 Vite 中被统一抽象为一个更简单、更强的 Plugin 系统。
- Webpack 的常用 Loader/Plugin 在 Vite 中几乎都有原生或社区等价物。
