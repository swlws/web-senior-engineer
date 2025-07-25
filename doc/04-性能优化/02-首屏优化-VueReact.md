# 首屏优化 - Vue/React

从构建配置、加载策略、渲染优化、网络加速、实践落地等角度进行的系统性改造建议，适用于大型或中型项目的性能提升。

## ✅ 一、构建层面优化

### 1. 拆包 + 代码分割（webpack / Vite）

#### Vue

- 配置路由懒加载（异步组件）：
  ```js
  // Vue Router 懒加载
  const Home = () => import(/* webpackChunkName: "home" */ "@/views/Home.vue");
  ```
- 使用动态导入方式对第三方组件库（如 ECharts、Monaco）做懒加载。
- 合理设置 splitChunks（webpack）或 rollupOptions.output.manualChunks（Vite）：
  ```js
  // Vite 示例
  build: {
  rollupOptions: {
      output: {
      manualChunks: {
          vue: ['vue'],
          vendor: ['axios', 'lodash']
      }
      }
  }
  }
  ```

#### React

- 使用 React.lazy 和 Suspense：
  ```js
  const Dashboard = React.lazy(() => import('./pages/Dashboard'))
  <Suspense fallback={<Loading />}>
    <Dashboard />
  </Suspense>
  ```
- 使用动态路由分包（适用于 React Router v6）：
  ```tsx
  const Home = lazy(() => import(/* webpackChunkName: "home" */ "./Home"));
  ```
- 配合 webpack 或 Vite 设置合理的 splitChunks 策略。

### 2. 构建产物压缩（开启 gzip / brotli）

- Webpack 配置：
  ```js
  const CompressionWebpackPlugin = require("compression-webpack-plugin");
  new CompressionWebpackPlugin({
    test: /\.(js|css|html|svg)$/,
    algorithm: "gzip",
  });
  ```
- 服务端（如 nginx）需启用 gzip_static 或 brotli_static

## 🚀 二、加载策略优化

### 1. 关键资源内联

vue.config.js 中开启内联 CSS

```js
css: {
  extract: false; // 会将 CSS 内联至 HTML
}
```

> 注意：适用于只内联首屏的场景，配合 critical 工具提取首屏 CSS。

### 2. HTML 文件中添加资源预加载

```html
<link rel="preconnect" href="https://cdn.example.com" />
<link rel="dns-prefetch" href="//cdn.example.com" />
<link rel="preload" href="/static/js/main.js" as="script" />
```

### 3. 静态资源使用 CDN

将 JS/CSS 文件、图片、字体等资源上传到 CDN。

## 💡 三、渲染路径优化

### 1. 内联骨架屏

```html
<!-- public/index.html -->
<div id="app">
  <div class="skeleton">
    <div class="header"></div>
    <div class="content"></div>
  </div>
</div>
```

> 首次渲染后，通过 mounted 中动态移除骨架。

### 2. 异步加载下层组件

```html
<Suspense>
  <template #default>
    <AsyncBigComponent />
  </template>
  <template #fallback>
    <LoadingPlaceholder />
  </template>
</Suspense>
```

> Vue 3 使用 <Suspense>，Vue 2 可使用自定义懒加载组件方案。

## 📶 四、网络层优化建议

| 项目          | 说明                                                   |
| ------------- | ------------------------------------------------------ |
| CDN 静态资源  | 图片、JS、字体等上传至 CDN                             |
| HTTP 缓存策略 | 配置 `Cache-Control`、`ETag`                           |
| DNS 预解析    | `<link rel="dns-prefetch" href="//api.example.com" />` |
| 使用 HTTP/2   | 支持多路复用、头部压缩                                 |
| 服务端压缩    | 开启 gzip 或 brotli                                    |

## 📦 五、数据接口与请求优化

- SSR/预渲染优先输出 HTML 内容。
- 将接口请求提前嵌入页面（通过 SSR/SSG 方案）。
- 使用懒加载 + 预取机制：

```js
// vue-router 路由组件预取
import(/* webpackPrefetch: true */ "./components/BigComponent.vue");
```

响应式数据：

- 去除不必要的响应式数据。
- 使用 computed 代替 watch。
- 避免在循环中使用响应式数据。
