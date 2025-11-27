# JSONP 通信方式

JSONP（JSON with Padding）是一种 利用 **<script> 标签不受同源策略限制 来实现 跨域 GET 请求 的“绕过”方式**。

它不是一种官方协议，而是一种历史上的技巧，在 CORS 出现前曾广泛用于跨域数据请求。

## 🧠 一、跨域的根本限制

- 浏览器的 同源策略 限制了：
  - 网页中 JS 不能通过 XHR/fetch 请求不同源的接口（除非服务端支持 CORS）
- 但：
  - <script src="..."> 标签不受同源策略限制！
  - 所以可以跨域加载第三方的 JS 文件。

## 🚀 二、JSONP 原理

将数据包裹在一个函数调用中，由页面上定义的回调函数处理。

### 🌐 请求

```html
<script src="https://api.example.com/data?callback=handleData"></script>
```

这会让浏览器去加载远程 JS 文件。

### 🧾 响应（服务器返回）

```javascript
handleData({ message: "hello world" });
```

服务器返回的是一段 JS 代码，浏览器加载后立即执行 —— 执行页面中定义好的 handleData 函数，并把数据作为参数传进去。

### 🧪 页面中的定义

```javascript
<script>
function handleData(data) {
  console.log("获取到数据：", data);
}
</script>
```

## 📌 三、JSONP 特点总结

| 特点         | 描述                                                  |
| ------------ | ----------------------------------------------------- |
| 请求方式     | 只能是 `GET`                                          |
| 是否跨域     | ✅ 是的（利用 `<script>` 可跨域）                     |
| 服务端支持   | 服务端必须返回一段 JS 代码（即 `callbackName(data)`） |
| 返回数据格式 | 不是 JSON，而是 JS                                    |
| 安全性       | ❌ 存在 XSS 风险（接收了远程 JS 执行）                |
| 替代方案     | ✅ `CORS` 更安全、更强大                              |
| 是否还能用   | ⛔ 已过时，不推荐新项目使用                           |

## 🛠 四、简单封装 JSONP 示例（前端代码）

```javascript
function jsonp(url, callbackName) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const callback = `jsonp_cb_${Date.now()}`;

    // 设置全局回调函数
    window[callback] = async function (data) {
      try {
        const fn = window[callbackName];
        if (typeof fn !== "function") {
          throw new Error("JSONP Callback function is not defined");
        }

        await window[callbackName](data);
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        delete window[callback];
        document.body.removeChild(script);
      }
    };

    // 出错处理
    script.onerror = function () {
      reject(new Error("JSONP request failed"));
      delete window[callback];
      document.body.removeChild(script);
    };

    script.src = `${url}?callback=${callback}`;
    document.body.appendChild(script);
  });
}

// 使用示例
jsonp("https://api.example.com/jsonp", "callback")
  .then((data) => console.log(data))
  .catch((err) => console.error(err));
```

## 🧱 五、服务器端支持（Node.js 示例）

```javascript
app.get("/jsonp", (req, res) => {
  const callback = req.query.callback;
  const data = JSON.stringify({ msg: "hello" });
  res.set("Content-Type", "application/javascript");
  res.send(`${callback}(${data})`);
});
```

## ✅ 六、JSONP 的使用场景（历史）

- 早期的百度地图、淘宝、微博登录接口
- 第三方统计脚本（例如 cnzz、百度统计）
- 广告投放脚本（可跨域注入）

## 🔒 七、为什么逐渐被淘汰

- 安全性差（服务端返回的是 JS 代码，容易被恶意注入）
- 只能 GET 请求
- 无法处理复杂认证（如携带 token、带 cookie）
- CORS 支持更广泛、更安全、更灵活

## 📌 总结表

| 项目         | JSONP                                    |
| ------------ | ---------------------------------------- |
| 是否支持跨域 | ✅ 是的，利用 `<script>`                 |
| 请求方式     | ❌ 仅支持 `GET`                          |
| 是否安全     | ❌ 存在 XSS 风险                         |
| 是否推荐     | ❌ 不再推荐使用                          |
| 替代方案     | ✅ `CORS`, `postMessage`, `WebSocket` 等 |
