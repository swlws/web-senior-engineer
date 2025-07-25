# WebTransport

WebTransport ——它是浏览器原生支持的一种新型 基于 UDP 的低延迟双向通信协议，是 WebSocket、WebRTC 的潜在替代方案。

## 📌 一、WebTransport 是什么？

WebTransport 是一种浏览器提供的 API，用于通过 HTTP/3（QUIC，底层为 UDP） 实现 低延迟、可靠或不可靠的双向通信。

### ✅ 相比 WebSocket 的优势：

| 功能           | WebSocket | WebTransport             |
| -------------- | --------- | ------------------------ |
| 传输协议       | TCP       | **UDP (QUIC)**           |
| 多流复用       | ❌        | ✅（可并发多个流）       |
| 单向流支持     | ❌        | ✅                       |
| 不可靠数据通道 | ❌        | ✅（节省开销，适合实时） |
| 头部压缩优化   | ❌        | ✅（HTTP/3）             |
| 适合大规模并发 | 一般      | 更优                     |

> ✅ 可以理解为：WebTransport = WebSocket + WebRTC 的综合升级版本

## 🌐 二、浏览器支持情况（2025）

| 浏览器        | 支持情况                      |
| ------------- | ----------------------------- |
| ✅ Chrome 91+ | 完整支持（需 HTTPS + HTTP/3） |
| ✅ Edge 91+   | 支持                          |
| ❌ Safari     | 部分实验支持（需设置）        |
| ❌ Firefox    | 实验性支持中，默认关闭        |

## ⚠️ 三、使用前提

- 必须部署在 HTTPS + HTTP/3 (QUIC) 环境下
- 服务端必须支持 HTTP/3 + WebTransport

## 🧪 四、客户端代码示例（浏览器端）

```js
const transport = new WebTransport("https://your-server.com:4433/webtransport");

await transport.ready;
console.log("✅ 连接已建立");

const stream = await transport.createBidirectionalStream();
const writer = stream.writable.getWriter();
const reader = stream.readable.getReader();

// 发送数据
await writer.write(new TextEncoder().encode("hello from client"));
writer.releaseLock();

// 读取数据
const { value, done } = await reader.read();
if (!done) {
  console.log("📨 接收服务端数据:", new TextDecoder().decode(value));
}
```

## 🧰 五、服务端示例（Node.js + [WebTransport over HTTP/3 实现库](https://github.com/ietf-wg-webtrans/draft-ietf-webtrans-http3)）

目前 Node.js 原生暂未支持 WebTransport over HTTP/3，但你可以通过以下工具来实现服务端：

### ✅ 推荐方案：

1. 使用 aioquic (Python)：支持 WebTransport 协议
2. 使用 Cloudflare Workers（已原生支持 WebTransport）
3. 使用 Caddy 服务器 + QUIC 插件（实验性）

## 💬 示例场景（适合 WebTransport 的应用）

| 场景                | 描述                     |
| ------------------- | ------------------------ |
| 实时游戏同步        | 小数据包、低延迟、高并发 |
| 实时字幕 / 语音     | 不可靠传输节省带宽       |
| 视频直播控制信令    | 控制通道 vs 视频通道分离 |
| 替代 WebSocket 聊天 | 更快建立连接、支持多路   |

## ❗ 与 WebRTC 的对比

| 特性         | WebRTC             | WebTransport         |
| ------------ | ------------------ | -------------------- |
| 底层         | UDP + STUN/ICE     | UDP + QUIC           |
| 复杂度       | 高（需信令 + ICE） | 低（纯 JS 接口）     |
| 适合音视频   | ✅                 | ❌（适合控制或数据） |
| 适合数据通信 | ✅                 | ✅                   |

## ✅ 六、实际部署建议

| 要点                  | 建议                                          |
| --------------------- | --------------------------------------------- |
| 服务端支持 QUIC/HTTP3 | 使用 NGINX、Caddy、Cloudflare Workers         |
| HTTPS + HTTP/3 必须   | `Alt-Svc: h3=":443"` 需设置                   |
| 本地开发              | 可使用 `localhost:4433` + 自签证书搭配 Chrome |
| 客户端兼容性判断      | 使用 `if ('WebTransport' in window) {}`       |

## 🧩 小结：何时用 WebTransport？

| 想要                             | 建议                                                  |
| -------------------------------- | ----------------------------------------------------- |
| 替代 WebSocket，支持多流、低延迟 | ✅ WebTransport 更优                                  |
| 实时音视频（P2P）                | ❌ 请用 WebRTC                                        |
| 简单双向数据通信                 | WebSocket / WebTransport 都可                         |
| 不可靠数据、可容忍丢包           | ✅ WebTransport 支持 Unidirectional Stream / Datagram |
| 服务端不支持 HTTP/3              | ❌ 需等待或切换部署架构                               |
