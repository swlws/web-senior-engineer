# External 与 DLL

## ✅ 一句话总结差异

| 功能                | externals                            | DLL（DllPlugin）                       |
| ----------------- | ------------------------------------ | ------------------------------------ |
| **解决问题**          | 不把某些依赖打包进 bundle，而是使用外部提供的全局变量或运行时模块 | 将变化少的依赖提前构建成 DLL，加速主构建               |
| **构建加速**          | ❌ 不加速构建                              | ✔️ 显著加速（尤其旧时代 Webpack3/4）            |
| **体积优化**          | ✔️ 避免重复打包第三方库                        | ✔️ 把第三方库分离成 DLL                      |
| **方式**            | 运行时依赖外部（CDN、本地 script）               | 构建时依赖提前产物（prebuilt bundle）           |
| **Webpack5 是否推荐** | 推荐，在 Module Federation 与 CDNs 时代依旧常用 | **不推荐、已过时**（Webpack5 官方 discourages） |

## 1. 核心作用对比

### 🌐 externals：告诉 webpack 某些包由外部提供

例如：

```js
externals: {
  vue: 'Vue',
  axios: 'axios'
}
```

含义：

- webpack 构建时遇到 import Vue from 'vue' 不打进 bundle
- 运行环境（HTML）必须提前提供 `<script src=".../vue.js"></script>`
- 构建速度不会变快，但构建结果变小

👉 webpack 不再解析这些包、也不做依赖跟踪，只是“跳过”它们

## 📦 DLL：提前把某些包构建成一个 DLL bundle

webpack 构建前先运行：

```js
webpack --config webpack.dll.js
```

产生：

```bash
dll/vue.dll.js
dll/vue.manifest.json
```

然后主项目中使用：

```js
new DllReferencePlugin({
  manifest: require('./dll/vue.manifest.json')
})
```

效果：

- webpack 构建时不再解析 vue 的源码，而是直接引用预构建好的 DLL
- 加速主工程构建
- 需要额外构建一次 DLL
- Webpack5 开始不推荐（Module Federation 等机制更合理）

👉 DLL 主要解决构建性能问题，是构建时“预编译依赖”技术

## 2. 本质区别（重要）

| 维度       | externals           | DLL                       |
| -------- | ------------------- | ------------------------- |
| **工作阶段** | **运行时** 外部提供依赖      | **构建时** 依赖提前编译好           |
| **行为**   | webpack 完全不打包、不解析该库 | webpack 解析，但用“缓存 DLL”替代源码 |
| **构建速度** | 不影响                 | 大幅加速                      |
| **输出**   | 没有单独产物              | 产生 DLL 文件                 |
| **维护成本** | 很低（只要 CDN 正常）       | 高（DLL 版本变化需重新构建）          |

## 3. Webpack5 中 DLL 为何不再推荐？

Webpack5 官方态度：

- DllPlugin 在 W3/W4 时期解决构建慢问题
- Webpack5 的持久化缓存（filesystem cache）已经替代此功能
- Module Federation、SplitChunks 再加 CDN 更灵活
- 多入口项目 + CDN 时代，DLL 带来的复杂性不值得

👉 DLL 是旧时代“加速 hack”，外部缓存机制已胜任

## 4. 使用体验对比

### 🔹 externals 使用体验

```js
externals: { react: "React" }
```

- 优点
  - 配置简单
  - 体积明显降低
  - 常用于生产 + CDN
- 缺点
  - 要保证全局变量存在
  - 版本管理困难

### 🔹 DLL 使用体验

- 优点
  - 项目较大时，构建速度显著提升（W3/W4）
  - 第三方依赖不需要每次解析
- 缺点
  - 维护成本极高
  - 每次依赖变化就要重新 dll 构建
  - Webpack5 的 filesystem cache 本身已足够快

## 5. 适用场景对比（非常关键）

### 💡 什么时候用 externals？

- 使用 CDN 加速第三方依赖
- 多项目希望共享同一版本的 `React / Vue`
- 想让 bundle 更小
- SSR 中避免重复打包 Node 依赖

👉 externals = 体积优化 & CDN 集成的利器

### 💡 什么时候用 DLL？

严格来说，Webpack5 不建议再用 DLL。

但仍可能用在：

- 旧项目迁移但不敢完全替换构建系统
- 大型工程，但每次构建都很慢（几十分钟）
- 依赖长期不变（例如 lodash、moment）

👉 如果你现在用 Webpack5+，建议改用：

- filesystem cache
- Module Federation
- SplitChunks + CDN externals

代替 DLL。

## 6. 总结一句话版本

### ✔ externals

跳过打包依赖，由外部提供（CDN / window 全局）。
关注运行时，降低体积。

### ✔ DLL

提前打包依赖，主构建复用 DLL 缓存，加速构建。
关注构建时，加速开发（但在 Webpack5 中已被淘汰）。
