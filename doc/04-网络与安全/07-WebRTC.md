# WebRTC

在 Web 端（浏览器环境）中，虽然 浏览器不允许直接使用原生 UDP 套接字，但可以通过基于 UDP 的高级协议来实现实时通信，最常见的是 WebRTC（底层基于 UDP）。

## 🌐 一、浏览器中无法直接使用 UDP？

是的，出于安全考虑，浏览器不允许直接操作 UDP 套接字。无法像 Node.js 中那样调用 dgram 模块。
但可以通过以下方式“间接”使用 UDP：

| 方式               | 是否基于 UDP | 说明                                                     |
| ------------------ | ------------ | -------------------------------------------------------- |
| **WebRTC**         | ✅ 是        | 用于音视频/实时数据传输，底层走 UDP（SRTP + DTLS + ICE） |
| **WebSocket**      | ❌ 否        | 基于 TCP，适合文本/数据通信                              |
| **Fetch / XHR**    | ❌ 否        | HTTP 请求，基于 TCP                                      |
| **QUIC（HTTP/3）** | ✅ 是        | Chrome/Edge 支持，底层为 UDP，应用层为 HTTP/3            |

## 📦 二、WebRTC 基于 UDP 的通信

WebRTC（Web Real-Time Communication）用于浏览器中实现 实时音视频 和 P2P 数据通道，底层使用了 STUN/ICE 协议穿透 NAT，使用 UDP 进行通信。

### 📌 WebRTC 架构图：

```text
浏览器 ←WebRTC API→ 内核层（ICE + SRTP + UDP） ←→ 远端浏览器
```

## 🧪 三、Web 端示例：使用 WebRTC 实现基于 UDP 的数据通信（DataChannel

以下为最简单的示例，演示两端如何建立 P2P 连接，并通过 UDP 通道传输数据：

### ✅ HTML 页面（两端都打开）

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>WebRTC UDP Chat</title>
  </head>
  <body>
    <h3>WebRTC 数据通道通信</h3>
    <textarea id="log" rows="10" cols="50" readonly></textarea><br />
    <input id="msg" placeholder="输入消息..." />
    <button onclick="sendMessage()">发送</button>

    <script>
      let localConn = new RTCPeerConnection();
      let dataChannel = localConn.createDataChannel("chat");

      const log = (msg) => {
        document.getElementById("log").value += msg + "\n";
      };

      dataChannel.onopen = () => log("✅ 数据通道已打开");
      dataChannel.onmessage = (e) => log("📨 对方：" + e.data);

      function sendMessage() {
        const val = document.getElementById("msg").value;
        dataChannel.send(val);
        log("🧑‍💻 我：" + val);
      }

      // 信令交换（此处简化，需复制粘贴）
      localConn.createOffer().then((offer) => {
        localConn.setLocalDescription(offer);
        log("👉 请将此 SDP 粘贴给远端：\n" + JSON.stringify(offer));
      });

      // 手动设置远端 SDP（模拟信令服务器）
      window.setRemoteSDP = async function (sdp) {
        const remoteDesc = new RTCSessionDescription(sdp);
        await localConn.setRemoteDescription(remoteDesc);
      };

      // 支持远端回应（远端使用相同代码）
      localConn.ondatachannel = (e) => {
        dataChannel = e.channel;
        dataChannel.onmessage = (ev) => log("📨 对方：" + ev.data);
      };
    </script>
  </body>
</html>
```

👉 使用方法：

1. 打开两个浏览器窗口（或两台电脑）
2. 复制一端的 SDP，调用另一端的 setRemoteSDP(粘贴内容)
3. 反过来再复制回去完成连接
4. 就可以通过 UDP 通信了（虽然你感知不到）

## 🧩 四、总结：Web 端间接使用 UDP 的方式

| 技术                       | 说明                       | 是否基于 UDP | 典型用途                 |
| -------------------------- | -------------------------- | ------------ | ------------------------ |
| **WebRTC**                 | 实时通信，数据通道、音视频 | ✅ 是        | 视频会议、P2P 聊天       |
| **HTTP/3 (QUIC)**          | 新一代 HTTP 协议           | ✅ 是        | 网页请求加速             |
| **WebTransport（新标准）** | 替代 WebSocket 的 UDP 通道 | ✅ 是        | 低延迟数据流（需 HTTPS） |
