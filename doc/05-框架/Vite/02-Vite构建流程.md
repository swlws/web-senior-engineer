# Vite 构建流程

下面以 `Vite 3/4/5` 的核心构建流程为主线，讲 Vite 的 Build 流程是如何执行的、涉及哪些 Hook、底层是怎么调用 esbuild 与 Rollup 的。

## 🚀 Vite 构建流程（Build）全流程详解

Vite 的构建流程可以拆成 5 大阶段：

```txt
1. 创建构建环境（createServer / createBuildContext）
2. 解析配置（Config/Plugin 集成）
3. 预构建依赖（esbuild）
4. 使用 Rollup 打包源码
5. 生成产物（writeBundle / optimizeChunks / output）
```

下面按真实执行顺序深度解释。

## 1️⃣ 加载与解析配置（loadConfig + mergeConfig）

执行 vite build → 调用 CLI → 走 build.ts：

主要步骤：

- 加载 vite.config.ts（内部使用 loadConfigFromFile）
- 执行其中所有 Vite 插件的 config()、configResolved() 钩子
- 合并用户配置、插件配置、默认配置

插件会在此时运行：

- config()
- configResolved()

💡 这是插件修改构建行为的重要阶段

如 alias、define、optimizeDeps、esbuild 选项等都会在这时生效。

## 2️⃣ 依赖预构建 optimizeDeps（仅 Dev，构建时不执行）

⚠️注意：build 模式不会自动执行 optimizeDeps，它只在 dev server 时使用，用于依赖预处理。

构建阶段此部分会跳过。

## 3️⃣ 创建 BuildContext（内部构建上下文）

Vite 调用 build.ts 的 doBuild()，创建内部上下文：

- 加载插件
- 记录环境
- 注册 Rollup 插件
- 设置 esbuild 钩子
- 生成构建依赖图（非 dev graph）
- 根据配置决定是否开启 SSR、是否多入口等

## 4️⃣ 核心阶段：调用 Rollup 进行打包（真正的 Build 主体）

Vite 的 build = Rollup 打包 + Vite 自身中间层

Rollup 核心钩子在这里执行：

- resolveId
- load
- transform
- buildStart
- renderChunk
- generateBundle
- writeBundle

内部流程图：

```txt
┌─────────────────────────┐
│   输入：多入口 HTML/JS   │
└─────────────┬───────────┘
              │
       HTML 解析（Vite）
              │
  转换为 Rollup 输入配置
              │
   Rollup 构建依赖图
              │
   transform（esbuild / plugin）
              │
    rollup.generate()
              │
    rollup.write()
              │
      输出产物（dist）
```

Vite 在 transform 阶段会做：

- 使用 esbuild 处理 TS/JS
- 使用 esbuild/minify 插件进行压缩（默认）
- 运行用户插件的 transform
- 添加 HMR 标记（dev）、build 时忽略

## 5️⃣ 写入文件 writeBundle：生成最终产物

Rollup 完成代码生成后：

- 输出 bundle
- 执行插件 writeBundle()
- 输出 sourcemap
- 拆分 vendor chunk（默认开启）
- 生成 manifest.json
- HTML 注入 chunk（入口 js/css）

最终产物结构示例：

```txt
dist/
  index.html
  assets/
    index.xxxxx.js
    vendor.xxxxx.js
    style.xxxxx.css
```

## 🧩 Vite 构建中的插件钩子执行顺序（最重要部分）

以下是 Build 模式下的典型钩子调用顺序（简化版）：

```txt
config()
configResolved()

buildStart()
resolveId()
load()
transform()

moduleParsed()
renderStart()
renderChunk()
generateBundle()
writeBundle()
```

其中 transform 等会对每个模块执行多次。

## ⚙️ esbuild 在 Build 中的作用

Vite 在 Build 中只使用 esbuild 做两件事：

### 1. TS/JS 代码转换（transform）

- 快速处理 TS → JS
- 快速处理 JSX
- 支持插件链中的 pre-transform，比如 SWC、Babel

### 2. 压缩（minify）

默认 build.minify = 'esbuild'，性能远超 terser。

> 真正的代码打包、chunk 划分、树摇优化：Rollup 负责
> Vite 是 Rollup 的高级封装器。

## 📦 Vite 与 Rollup 的关系总结

| 功能                       | Vite        | Rollup |
| ------------------------ | ----------- | ------ |
| 依赖预构建                    | 使用 esbuild  | ❌      |
| TS/JS 转换                 | esbuild     | 可选     |
| 模块打包                     | 调用 Rollup   | ✔️     |
| 浏览器原生 ESM（dev）           | ✔️          | ❌      |
| 构建优化（chunk、tree-shaking） | 通通交给 Rollup | ✔️     |

Vite 构建 = Rollup + esbuild + HTML 入口解析器

## 🎯 一句话总结

Vite 构建时不再使用 dev server 的“原生 ESM 方案”，而是直接走 Rollup 全量打包流程，Vite 自身只做 transform/HTML/插件体系等中间层工作。
