# Compiler 的钩子

Webpack 5：compiler.hooks 全量清单（共 40+ 个）

## 初始化阶段（Initialization）

| Hook                 | 类型         | 说明                            |
| -------------------- | ------------ | ------------------------------- |
| **initialize**       | SyncHook     | Webpack5 新增，编译器初始化完成 |
| **environment**      | SyncHook     | 环境准备                        |
| **afterEnvironment** | SyncHook     | 环境准备之后                    |
| **entryOption**      | SyncBailHook | 处理 entry 配置                 |
| **afterPlugins**     | SyncHook     | 所有插件已加载                  |
| **afterResolvers**   | SyncHook     | 所有 resolvers 已创建           |

## 运行阶段（Run / Watch）

| Hook                | 类型              | 说明                       |
| ------------------- | ----------------- | -------------------------- |
| **beforeRun**       | AsyncSeriesHook   | 执行 run() 前              |
| **run**             | AsyncSeriesHook   | 执行 run() 中              |
| **beforeCompile**   | AsyncSeriesHook   | 编译前（含 watch）         |
| **compile**         | SyncHook          | 创建 compilation           |
| **thisCompilation** | SyncHook          | 创建新 compilation（更早） |
| **compilation**     | SyncHook          | 创建新 compilation（常用） |
| **make**            | AsyncParallelHook | 触发所有模块构建           |
| **finishMake**      | AsyncSeriesHook   | 完成 make 阶段             |
| **watchRun**        | AsyncSeriesHook   | watch 模式触发编译前       |
| **afterCompile**    | AsyncSeriesHook   | 完成编译，未 seal          |

## 构建阶段（Build / Seal）

注意：compiler 主要不负责 build，编译相关钩子在 compilation.hooks 中。
compiler 的构建阶段主要是 emit 相关流程。

## 输出阶段（Emit / Asset Processing）

| Hook          | 类型            | 说明                     |
| ------------- | --------------- | ------------------------ |
| **emit**      | AsyncSeriesHook | 输出 assets 前（可修改） |
| **afterEmit** | AsyncSeriesHook | 输出 assets 后           |

## 完成阶段（Finish / Done）

| Hook                  | 类型            | 说明                       |
| --------------------- | --------------- | -------------------------- |
| **shouldEmit**        | SyncBailHook    | 返回 false 可阻断 emit     |
| **assetEmitted**      | AsyncSeriesHook | 单个 asset 输出后          |
| **failed**            | SyncHook        | 构建出错                   |
| **invalid**           | SyncHook        | watch 模式，文件变动时触发 |
| **done**              | AsyncSeriesHook | 构建完成（最常用）         |
| **infrastructureLog** | SyncBailHook    | Webpack 内部日志           |

## 模块缓存（Caching）

| Hook                     | 类型            | 说明                      |
| ------------------------ | --------------- | ------------------------- |
| **normalModuleFactory**  | SyncHook        | 创建 NormalModuleFactory  |
| **contextModuleFactory** | SyncHook        | 创建 ContextModuleFactory |
| **beforeCompile**        | AsyncSeriesHook | 编译前缓存 hook           |
| **afterCompile**         | AsyncSeriesHook | 编译后缓存 hook           |

## Stats 输出

| Hook            | 类型     | 说明         |
| --------------- | -------- | ------------ |
| **beforePrint** | SyncHook | stats 输出前 |
| **afterPrint**  | SyncHook | stats 输出后 |

## Webpack5 全量代码

```js
const compilerHooks = [
  "initialize",
  "environment",
  "afterEnvironment",
  "entryOption",
  "afterPlugins",
  "afterResolvers",
  "beforeRun",
  "run",
  "watchRun",
  "beforeCompile",
  "compile",
  "thisCompilation",
  "compilation",
  "make",
  "finishMake",
  "afterCompile",
  "shouldEmit",
  "emit",
  "afterEmit",
  "assetEmitted",
  "failed",
  "invalid",
  "done",
  "infrastructureLog",
  "normalModuleFactory",
  "contextModuleFactory",
  "beforePrint",
  "afterPrint",
];
```
