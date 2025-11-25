# SplitChunks 代码分割

## 🎯 splitChunks 是什么？

splitChunks 是 Webpack 的**代码分割（Code Splitting）**规则：

> 将重复使用的模块提取成独立 chunk（比如 vendors）、将大体积文件拆分、避免重复打包、提升缓存利用率。

它的作用主要是：

- 减少重复打包相同依赖
- 增加浏览器缓存命中率
- 减小单个 bundle 体积
- 提升首屏加载速度

## ⚙️ Webpack 默认策略（非常关键）

Webpack5 的默认配置已经比 Webpack4 更合理：

```js
optimization: {
  splitChunks: {
    chunks: 'async',   // 默认只分割异步 import()
    minSize: 20000,     // 满足 20kb 才会分割
    minRemainingSize: 0,
    minChunks: 1,
    maxAsyncRequests: 30,
    maxInitialRequests: 30,
    enforceSizeThreshold: 50000,
    cacheGroups: {
      defaultVendors: {
        test: /[\\/]node_modules[\\/]/,
        priority: -10,
        reuseExistingChunk: true
      },
      default: {
        minChunks: 2,
        priority: -20,
        reuseExistingChunk: true
      }
    }
  }
}
```

重点理解：

- ✔ chunks: 'async'
  只对 import() 的模块拆分，不动同步依赖。
- ✔ defaultVendors
  打包所有 node_modules 到一个 vendors chunk（满足 minSize）。
- ✔ default
  把被重复引用 ≥2 次的模块抽成一个 chunk。

## 🚀 常见的生产级配置（推荐）

你在企业项目一般都用这一套即可：

```js
optimization: {
  splitChunks: {
    chunks: 'all',
    minSize: 20000,
    maxInitialRequests: 30,
    maxAsyncRequests: 30,
    cacheGroups: {
      vendors: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
        priority: -10,
      },
      common: {
        minChunks: 2,
        name: 'common',
        priority: -20,
        chunks: 'all',
        reuseExistingChunk: true
      }
    }
  }
}
```

为什么改成 chunks: 'all'？

因为：

- 异步 + 同步代码都能抽成 chunk
- vendors 会更稳定（长期缓存更佳）
- 项目初始加载更快

## 🔥 高级配置场景

### 1. 拆分 React/Vue 等大依赖

适用于 "React/Vue 每次都更新导致缓存失效" 的情况：

```js
splitChunks: {
  cacheGroups: {
    react: {
      test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
      name: 'react-vendor',
      chunks: 'all',
      priority: 20
    },
    echarts: {
      test: /[\\/]node_modules[\\/]echarts[\\/]/,
      name: 'echarts',
      chunks: 'all',
      priority: 20
    }
  }
}
```

优点：

- React/Vue 的独立缓存极其稳定
- 不会因某个三方库升级导致 vendors 整体失效

### 2. 按路由拆包（多页面、微前端常用）

```js
splitChunks: {
  cacheGroups: {
    dashboard: {
      test: /src[\\/]pages[\\/]dashboard/,
      name: 'dashboard',
      chunks: 'all',
      priority: 10
    }
  }
}
```

### 3. 动态拆分，避免 vendors 太大

如果 vendors 超过 1MB，不利于缓存：

```js
minSize: 100000,    // 100kb 以上才拆
maxSize: 250000,    // 超过 250kb 会强制继续拆
```

Webpack 会自动拆成 `vendors~1.js`、`vendors~2.js` 等。

## 📌 splitChunks 常见误区

### ❌ 误区 1：以为拆得越多越好

拆包越多：

- HTTP/2 可以支持，但浏览器调度成本也会增加
- chunk 数量太大，加载性能反而下降

### ❌ 误区 2：所有 node_modules 都应该拆成 vendors

多数项目用 一个 vendors 就足够，但如果有：

- 长期稳定的大依赖（React、Vue、ECharts）
- 变化频繁的小依赖

则应该 按需独立拆包，避免 vendors 缓存被污染。

## 🧠 最佳实践

适用 Vue/React 单页项目：

```js
optimization: {
  runtimeChunk: 'single',       // runtime 独立拆包
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      react: { ... }            // React/Vue 等长缓存大库
      vendors: { ... }          // 其他第三方
      common: { ... }           // 业务公共模块
    }
  }
}
```

并配合：

- CDN 缓存
- hash-based chunk 文件名
- ESM 优化

能做到：

- 极好的缓存稳定性
- 极小首屏 bundle
- 并发加载几十个 chunk 仍很快
