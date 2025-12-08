# Taro 编译优化

针对 Taro（小程序/H5）编译与打包的实战优化清单，包含“为什么这样做”、优先级、可直接 paste 的配置示例/命令，以及注意事项。

优先做这些，收益最大，快速优化清单

## 一、开启持久化 / 文件缓存（filesystem cache）

立即显著加快二次编译。

### 理由

Webpack5 的 filesystem cache 能把中间产物缓存到磁盘，二次改动时只编译变化部分。

Taro 从 v3.5 起支持并建议开启（但需自己设计缓存失效策略）。

- [doc](https://docs.taro.zone/docs/config-detail?utm_source=chatgpt.com#cache)

### 配置

```js
// config/index.js
const config = {
  // ...
  mini: {
    cache: {
      enable: true, // 开启 filesystem cache（dev/prod 都会启）
      // 可选：name, buildDependencies 等配置会被合并到 webpack cache
    },
  },
};
module.exports = config;
```

> 开启后要注意 CI/构建服务器清理缓存或使用不同 cache.name 以避免脏缓存。

## 二、依赖预编译（prebundle / module federation）与 esbuild 加速第三方依赖

首次构建可能稍慢，但二次构建非常快。Taro 内置对依赖预编译的支持（参考 Vite 思路，使用 esbuild 打包依赖并作为模块联邦 remote）。

- [doc](https://docs.taro.zone/docs/prebundle)

## 三、使用 esbuild/swc 代替 Babel（或用于压缩/minify）

大幅提升编译和压缩速度。

### 理由

Taro 支持用 esbuild 作为 JS 压缩器`（jsMinimizer = 'esbuild'）`并可配置 `esbuild.minify`。此外，Taro 也在一定场景用 `@swc/register` 替代 `@babel/register` 来加速。

### 开启 esbuild minify

```js
// config/index.js
module.exports = {
  mini: {
    jsMinimizer: "esbuild", // 或查看文档的具体字段
    esbuild: {
      minify: {
        enable: true,
        config: {
          target: "es5",
        },
      },
    },
  },
};
```

> esbuild 对某些非常规第三方库的压缩可能有兼容性问题（遇到问题时回退 terser）。

## 四、多线程 + 缓存（thread-loader + cache-loader / babel cacheDirectory）

对 CPU 密集型 loader（Sass、Babel）提升明显。

### 理由

- thread-loader 开启多线程，利用多核 CPU 并行处理。
- cache-loader 缓存编译结果，避免重复编译。
- babel-loader 开启 cacheDirectory 缓存 Babel 编译结果。

可以直接使用社区插件 taro-plugin-compiler-optimization，它封装了 thread-loader + cache-loader 等策略，把编译时间降到 ~原来 1/3（实测/社区文章）。安装并加入 plugin 即可。

- [小程序编译优化指南](https://docs.taro.zone/docs/compile-optimized)

### 配置

```bash
npm i -D thread-loader cache-loader taro-plugin-compiler-optimization
```

```js
// config/index.js
module.exports = {
  // ...
  plugins: ["taro-plugin-compiler-optimization"],
};
```

## 五、缩小 Babel/TS 转换范围（exclude node_modules，include 具体 src）并开启 babel 缓存

在自定义 webpack 配置中确保 babel-loader 有 `cacheDirectory: true`，并且只处理 src，避免处理大量 `node_modules`。Webpack 官方/社区长期建议这样做。

### 配置

webpackChain 示例（在 app.js 或 Taro 自定义 config hook）：

```js
// 使用 webpack-chain 修改 loader（示例）
chain.module
  .rule("babel")
  .test(/\.(js|jsx|ts|tsx)$/)
  .include.add(path.resolve(__dirname, "src"))
  .end()
  .exclude.add(/node_modules/)
  .end()
  .use("babel-loader")
  .loader("babel-loader")
  .options({ cacheDirectory: true });
```

## 六、按需分包 / 子包（小程序）

小程序端通过分包/子包能有效避免“包太大导致无法预览”的问题（社区实践多数项目都靠分包解决）

在开发小程序时，Taro 编译器依赖 SplitChunksPlugin 插件抽取公共文件，默认主包、分包依赖的 module 都会打包到根目录 vendors.js 文件中（有一个例外，当只有分包里面有且只有一个页面依赖 module 时，会打包到分包中依赖页面源码中），直接影响到小程序主包大小，很容易超出 2M 的限制大小。

`miniSplitChunksPlugin` 插件，在打包时通过继承 SplitChunksPlugin 进行相关 module 依赖树分析，过滤出主包中无依赖但分包独自依赖的 module 提取成 sub vendor chunks，过滤出主包中无依赖但多个分包共同依赖的 module 为 sub common chunks，利用 SplitChunksPlugin 的 cacheGroup 功能，将相关分包依赖进行文件 split。

- [智能提取分包依赖](https://docs.taro.zone/docs/mini-split-chunks-plugin)

### 配置

```js
// config/index.js
module.exports = {
  // ...
  mini: {
    optimizeMainPackage: {
      enable: true,
      exclude: [
        path.resolve(__dirname, "../src/utils/moduleName.js"),
        (module) => module.resource?.indexOf("moduleName") >= 0,
      ],
    },
  },
};
```

目前只支持微信小程序

## 七、生产构建关闭不必要的功能

如关闭 sourceMap、移除 dev-only 插件/日志、减少 polyfills、使用 CDN 加载大包等，都可减少构建产物大小与压缩时间。

例：enableSourceMap: false（生产环境）。

## 八、CheckList

- [ ] 升级到 Taro >= 3.5（支持 Webpack5、依赖预编译等）并核对版本。
- [ ] 在 config/index.js 开启 mini.cache.enable = true 并在 CI/本地设计 cache 清理策略。
- [ ] 安装并启用 taro-plugin-compiler-optimization（快速收益）。
- [ ] 将 jsMinimizer 配置为 esbuild（或在 dev 使用 esbuild，prod 根据兼容性选择），并开启 esbuild.minify.enable。
- [ ] 调整 babel-loader：cacheDirectory: true、仅 include src、exclude node_modules。
- [ ] 做分包/子包拆分，减少小程序每次上传/预览体积。
