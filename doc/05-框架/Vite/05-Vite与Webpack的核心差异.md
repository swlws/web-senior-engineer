# Vite 和 Webpack 的核心差异

从 架构、构建方式、速度、生态、适用场景、痛点解决 这六个维度来对比。

## 1️⃣ 架构理念层面（最重要）

Webpack = Bundle First（以打包为中心）

- 一切资源都必须提前被 loader 转换成 JS，再进入 bundle。
- dev 与 build 构建链路相同 → dev 也要等待打包 → 热更新慢。

Vite = ESM First（以原生 ES Module 为中心）

- Dev Server 不需要打包，基于浏览器原生 ES Module 按需加载。
- 只有真正访问的文件才会 transform。
- Build 才走 Rollup。

> 总结一句话：Webpack 的架构是“先打包再运行”，Vite 是“先运行再打包”。

## 2️⃣ Dev 开发体验的差异（最能感受到的区别）

Webpack（Dev 模式）

- 启动慢（需要先构建 bundle）
- 热更新慢（HMR 要重新打包并 patch）
- 配置复杂（loader + plugin 双体系）

Vite（Dev 模式）

- 秒级启动（不打包 → 按需 transform）
- HMR 极快（只更新当前模块，无需 rebuild）
- 配置简单（Plugin 覆盖 loader+plugin 能力）

> 真实项目中：Vite dev server 能比 Webpack 快 10–100 倍。

## 3️⃣ 构建工具链差异（技术栈不同）

| 功能            | Webpack                 | Vite                     |
| ------------- | ----------------------- | ------------------------ |
| Dev transform | babel/ts-loader 等       | esbuild（Go 编写，10~100x 快） |
| Build         | Webpack 本身              | Rollup                   |
| CSS           | style-loader、css-loader | 内置 + PostCSS             |
| TypeScript    | ts-loader               | esbuild                  |
| Vue           | vue-loader              | @vitejs/plugin-vue       |

Vite 的构建链是：

> esbuild（超快 transform） + Rollup（成熟 bundler）

因此构建出来的产物一般比 Webpack 更干净、更易拆分。

## 4️⃣ Loader & Plugin 差异（思想完全不同）

Webpack：loader + plugin 两条体系

- loader：处理文件
- plugin：处理整个构建生命周期
- chain loader 执行顺序需要靠文档记忆

Vite：只有 plugin 一条体系

- transform 替代 loader
- load 替代 raw-loader/file-loader
- resolveId 替代 alias/路径处理

插件更统一更强，开发插件难度更低。

> Vite 把 Webpack 的 loader + plugin 两套系统合并成一套插件系统。

## 5️⃣ 构建速度和最终构建产物（Build）

Webpack 构建速度

- 取决于 loader 链、打包规模
- 普通项目十几秒，大项目可以几分钟
- 需要 cache、thread-loader、DLL 等优化

Vite 构建速度

- transform 使用 esbuild → 巨快
- 打包使用 Rollup → tree-shaking 更干净
- chunk 拆分更智能

大型项目迁移 Vite 后通常能减半构建时间。

## 6️⃣ 生态 & 适用场景差异

Webpack 强项

- 超大型老项目
- Node 多入口项目
- 超复杂构建自定义场景
- 兼容各种古老 loader / plugin

Vite 强项

- Vue / React / TS 项目
- 中大型业务前端
- 组件库、微前端、工具库
- 要求开发体验的项目

> Webpack 强在“复杂老项目生态丰富”，Vite 强在“现代项目开发体验和性能”。

## 🎯 最后用一句压轴总结

Vite 并不是 Webpack 的替代品，而是从现代 ESM 原生能力出发重新设计的一套“以开发体验为中心”的前端构建方案。
Webpack 是 Bundler First，Vite 是 ESM First，决定了两者架构和性能的本质差异。
