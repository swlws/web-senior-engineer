# postMessage 通信方式

postMessage 是前端中 安全地在不同源（域）之间通信的一种机制，并不是直接“解决跨域”，而是提供了跨域通信的能力，它是现代浏览器提供的标准接口，常用于 iframe、窗口之间的数据传输。

## 🧩 一、跨域问题的本质

跨域问题来源于 浏览器的同源策略，它限制了：

- A 页面不能直接访问 B 页面中 JS、DOM、Cookie 等信息，如果它们的协议/域名/端口不同。

## 🚀 二、postMessage 的作用

postMessage 允许：

- 一个页面（父或 iframe）给另一个不同源的页面发送消息
- 被接收方在收到后可决定是否处理该消息

从而实现跨域通信，而无需绕过同源策略。

## 🛠 三、用法示例

### 📤 1. 发送端（比如父页面）

```javascript
const iframe = document.getElementById("myFrame");
iframe.contentWindow.postMessage(
  { action: "login", token: "123" },
  "https://target-domain.com"
);
```

- message: 可以是字符串、对象（会自动 JSON 序列化）
- targetOrigin: 指定允许接收的 origin，必须严格匹配协议+域名+端口

### 📥 2. 接收端（比如 iframe 页面）

```javascript
window.addEventListener("message", function (event) {
  // 安全校验：检查消息来源
  if (event.origin !== "https://frontend.example.com") return;

  // 处理消息
  console.log("收到消息:", event.data);
});
```

- event.origin：发消息方的 origin
- event.data：传递的数据
- 接收方要验证 origin，防止 XSS 攻击

## ✅ 四、典型应用场景

| 场景                   | 描述                                                        |
| ---------------------- | ----------------------------------------------------------- |
| `iframe` 跨域通信      | 父页面与嵌套的第三方 iframe 通信                            |
| `window.open` 跨域通信 | 新窗口打开了第三方域名页面，原窗口与新窗口通信              |
| OAuth 登录             | 第三方登录完成后回调主页面，通过 `postMessage` 回传登录结果 |
| 微前端架构             | 多个子应用之间隔离，但需消息协作                            |

## 🧠 五、postMessage vs CORS

| 特性             | `postMessage`                                | `CORS`                     |
| ---------------- | -------------------------------------------- | -------------------------- |
| 场景             | 页面间通信                                   | 页面请求服务器资源         |
| 传输方式         | JS 对象消息                                  | HTTP 请求与响应            |
| 是否跨域         | 是的                                         | 是的                       |
| 典型用途         | 页面与 iframe、窗口通信                      | 跨域接口请求（如 `fetch`） |
| 是否绕过同源策略 | ❌（仍受限制）<br>但提供了安全可控的跨域通信 | ✅（服务端显式允许）       |

## 🛡️ 六、安全建议

- 明确指定 targetOrigin，不要用 "\*"，防止信息泄露
- 在接收端验证 event.origin
- 注意消息内容结构，防止注入攻击

## 📌 总结

| 问题             | 说明                                      |
| ---------------- | ----------------------------------------- |
| 是否能解决跨域   | ✅ 能用于不同页面/域之间通信              |
| 是否突破同源策略 | ❌ 没有突破，而是在规则下进行安全通信     |
| 典型用途         | iframe 通信、OAuth 登录回调、微前端框架等 |

如你有具体场景（如 OAuth、iframe、微前端），我可以帮你写一个完整的 postMessage 实战示例。
