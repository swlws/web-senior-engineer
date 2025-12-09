# Compilation 钩子

完整、准确、可直接用于开发插件的 `compilation.hooks` 全量清单（70+ 个）。

## 初始化阶段（Setup）

| Hook              | 类型            |
| ----------------- | --------------- |
| **buildModule**   | SyncHook        |
| **rebuildModule** | SyncHook        |
| **failedModule**  | SyncHook        |
| **stopped**       | SyncHook        |
| **finishModules** | AsyncSeriesHook |
| **finishResolve** | SyncHook        |
| **afterResolve**  | SyncHook        |
| **addEntry**      | SyncHook        |
| **failedEntry**   | SyncHook        |
| **succeedEntry**  | SyncHook        |

## 依赖收集（Make / Dependency graph）

| Hook                          | 类型         |
| ----------------------------- | ------------ |
| **seal**                      | SyncHook     |
| **optimizeDependencies**      | SyncBailHook |
| **afterOptimizeDependencies** | SyncHook     |

## 模块构建阶段（Module Build）

| Hook              | 类型     |
| ----------------- | -------- |
| **buildModule**   | SyncHook |
| **rebuildModule** | SyncHook |
| **failedModule**  | SyncHook |
| **succeedModule** | SyncHook |

## 优化阶段（Optimize）

### 优化 dependency graph

| Hook                     | 类型            |
| ------------------------ | --------------- |
| **optimizeModules**      | SyncBailHook    |
| **afterOptimizeModules** | SyncHook        |
| **optimizeChunks**       | SyncBailHook    |
| **afterOptimizeChunks**  | SyncHook        |
| **optimizeTree**         | AsyncSeriesHook |
| **afterOptimizeTree**    | SyncHook        |

### 优化模块 ID / chunk ID

| Hook                       | 类型     |
| -------------------------- | -------- |
| **optimizeModuleIds**      | SyncHook |
| **afterOptimizeModuleIds** | SyncHook |
| **optimizeChunkIds**       | SyncHook |
| **afterOptimizeChunkIds**  | SyncHook |

### 执行各种优化器（minimizer / splitChunks / etc）

| Hook                                   | 类型                 |
| -------------------------------------- | -------------------- |
| **beforeChunkAssets**                  | SyncHook             |
| **additionalChunkRuntimeRequirements** | HookMap → SimpleHook |
| **runtimeRequirementInChunk**          | HookMap              |
| **runtimeRequirementInModule**         | HookMap              |
| **runtimeRequirementInTree**           | HookMap              |

## 生成阶段（Code Generation）

| Hook                | 类型     |
| ------------------- | -------- |
| **beforeModuleIds** | SyncHook |
| **moduleIds**       | SyncHook |
| **beforeChunkIds**  | SyncHook |
| **chunkIds**        | SyncHook |
| **prepareModuleId** | SyncHook |
| **prepareChunkId**  | SyncHook |

### 生成模块代码

| Hook                   | 类型                                      |
| ---------------------- | ----------------------------------------- |
| **renderModule**       | SyncHook                                  |
| **chunkModule**        | SyncHook                                  |
| **processAssets**      | AsyncSeriesHook (⚠️ Webpack5 最重要 hook) |
| **afterProcessAssets** | SyncHook                                  |

### 生成资源（assets）相关阶段

| Hook              | 类型     |
| ----------------- | -------- |
| **beforeHash**    | SyncHook |
| **contentHash**   | SyncHook |
| **afterHash**     | SyncHook |
| **recordHash**    | SyncHook |
| **recordModules** | SyncHook |
| **recordChunks**  | SyncHook |

## Chunks / Assets 输出阶段

| Hook                         | 类型            |
| ---------------------------- | --------------- |
| **assetPath**                | SyncBailHook    |
| **chunkAsset**               | SyncHook        |
| **additionalAssets**         | AsyncSeriesHook |
| **optimizeChunkAssets**      | AsyncSeriesHook |
| **afterOptimizeChunkAssets** | SyncHook        |
| **optimizeAssets**           | AsyncSeriesHook |
| **afterOptimizeAssets**      | SyncHook        |

## 模块解析（Module Factory）

| Hook                   | 类型              |
| ---------------------- | ----------------- |
| **normalModuleLoader** | SyncHook          |
| **loader**             | SyncHook          |
| **inlineChunk**        | SyncWaterfallHook |
| **afterInnerRender**   | SyncHook          |

## 模板渲染（Templates）

Webpack 内部使用不同模板生成 chunk JS 代码：

| Hook               | 类型     |
| ------------------ | -------- |
| **renderManifest** | SyncHook |
| **moduleAsset**    | SyncHook |
| **chunkHash**      | SyncHook |
| **moduleHash**     | SyncHook |
| **fullHash**       | SyncHook |
| **contentHash**    | SyncHook |
| **updateHash**     | SyncHook |

## WebAssembly & 实验能力相关

| Hook        | 类型     |
| ----------- | -------- |
| **finish**  | SyncHook |
| **restart** | SyncHook |

## 完整列表

```js
[
  // entry & module
  "addEntry",
  "failedEntry",
  "succeedEntry",
  "buildModule",
  "rebuildModule",
  "failedModule",
  "succeedModule",

  // deps
  "finishModules",
  "optimizeDependencies",
  "afterOptimizeDependencies",

  // chunks
  "optimizeModules",
  "afterOptimizeModules",
  "optimizeChunks",
  "afterOptimizeChunks",
  "optimizeTree",
  "afterOptimizeTree",
  "optimizeChunkIds",
  "afterOptimizeChunkIds",
  "optimizeModuleIds",
  "afterOptimizeModuleIds",

  // ids
  "beforeModuleIds",
  "moduleIds",
  "beforeChunkIds",
  "chunkIds",
  "prepareModuleId",
  "prepareChunkId",

  // rendering & assets
  "beforeHash",
  "contentHash",
  "afterHash",
  "recordHash",
  "recordModules",
  "recordChunks",
  "beforeChunkAssets",
  "chunkAsset",
  "processAssets",
  "afterProcessAssets",
  "additionalAssets",
  "optimizeAssets",
  "afterOptimizeAssets",
  "optimizeChunkAssets",
  "afterOptimizeChunkAssets",

  // templates
  "renderModule",
  "renderManifest",
  "moduleAsset",
  "chunkHash",
  "moduleHash",
  "fullHash",
  "assetPath",
  "inlineChunk",
  "afterInnerRender",

  // runtime
  "additionalChunkRuntimeRequirements",
  "runtimeRequirementInChunk",
  "runtimeRequirementInModule",
  "runtimeRequirementInTree",

  // loader
  "normalModuleLoader",
  "loader",

  // misc
  "seal",
  "finish",
  "restart",
];
```
