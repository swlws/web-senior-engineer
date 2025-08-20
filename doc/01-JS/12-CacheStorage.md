# CacheStorage

CacheStorage 是 Service Worker API 提供的一个存储机制，用来缓存 HTTP 请求和响应，常用于 PWA（渐进式 Web 应用） 或前端资源离线缓存。它和浏览器的 localStorage / IndexedDB 不一样，专门为 请求/响应对象 设计，适合存储静态资源（HTML、CSS、JS、图片等）以及 API 返回的数据。

## 🔑 核心概念

- CacheStorage：浏览器里保存多个 Cache 对象的容器。
- Cache：一个具体的缓存对象，可以存储多个 Request → Response 键值对。
- 作用场景：离线可用、快速资源加载、前端加速、PWA 静态文件缓存。

## 📌 常用 API

### 1. 打开一个缓存

```js
caches.open("my-cache").then((cache) => {
  console.log("Cache opened", cache);
});
```

### 2. 添加资源到缓存

```js
caches.open("my-cache").then((cache) => {
  cache.add("/index.html"); // 会发起请求并存储
  cache.addAll(["/styles.css", "/script.js", "/logo.png"]);
});
```

### 3. 自定义存储（put）

```js
caches.open("my-cache").then((cache) => {
  fetch("/data.json").then((response) => {
    cache.put("/data.json", response); // 手动放入
  });
});
```

### 4. 读取缓存（match）

```js
caches.match("/index.html").then((response) => {
  if (response) {
    return response.text();
  }
});
```

### 5. 删除缓存项

```js
caches.open("my-cache").then((cache) => {
  cache.delete("/logo.png");
});
```

### 6. 删除整个缓存

```js
caches.delete("my-cache");
```

### 7. 查看所有缓存名称

```js
caches.keys().then((keys) => {
  console.log(keys); // ['my-cache', 'other-cache']
});
```

## 🚀 Service Worker 场景示例

常见于 PWA 的离线缓存逻辑：

```js
// 安装阶段：缓存静态资源
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("static-cache").then((cache) => {
      return cache.addAll(["/index.html", "/styles.css", "/app.js"]);
    })
  );
});

// 拦截请求：优先走缓存
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request); // 缓存优先，网络兜底
    })
  );
});
```

## ⚖️ 对比

- localStorage：存字符串，小容量（~5MB），同步 API。
- IndexedDB：存结构化数据（对象、文件），异步 API。
- CacheStorage：存 Request/Response，适合网络资源缓存，异步 API。
