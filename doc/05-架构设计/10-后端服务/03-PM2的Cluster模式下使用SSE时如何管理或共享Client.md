# PM2 Cluster 模式下使用 SSE 时如何管理或共享 Client

在 PM2 的 Cluster 模式下，使用 SSE（Server-Sent Events）时，如何管理或共享客户端连接。
这是一个典型的 多进程共享状态问题，因为每个 Worker 是独立进程，内存无法直接共享。

## 1️⃣ 问题分析

假设你有一个 SSE 服务：

```js
app.get("/sse", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const id = Date.now();
  clients[id] = res; // 假设这是全局对象 clients
});
```

- 在单进程下，clients 可以直接存储所有连接。
- 在 PM2 Cluster 下：
  - 每个 Worker 都有自己独立内存。
  - 一个 Worker 中的 clients 只包含它自己的连接。
  - 事件发生时，如果发生在另一个 Worker，无法通知其他 Worker 的客户端。

所以直接用内存存储 SSE 客户端 无法跨进程广播。

## 2️⃣ 解决方案

#### 方案 A：使用外部消息总线（推荐）

通过 Redis Pub/Sub 或 **消息队列（Kafka、NATS 等）**来跨进程广播 SSE 消息。

核心思路

- 每个 Worker 维护自己的客户端列表。
- 所有事件通过 Redis 发布。
- 每个 Worker 订阅事件，并发送给自己的客户端。

示例（使用 Redis Pub/Sub）

```js
const redis = require("ioredis");
const pub = new redis();
const sub = new redis();

const clients = new Map();

app.get("/sse", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const id = Date.now();
  clients.set(id, res);

  req.on("close", () => clients.delete(id));
});

// 订阅事件
sub.subscribe("sse_channel", (err, count) => {});

sub.on("message", (channel, message) => {
  for (const res of clients.values()) {
    res.write(`data: ${message}\n\n`);
  }
});

// 发布事件（在任意 Worker）
pub.publish("sse_channel", JSON.stringify({ msg: "hello" }));
```

✅ 优点：跨进程广播，Cluster 模式下也能支持 SSE。

### 方案 B：集中 SSE 服务（单进程）

- 单独开一个 SSE Worker，只用 Fork 模式监听 SSE。
- 其他 Worker 处理普通 HTTP 请求。
- SSE Worker 单进程，所有客户端都在同一个进程内，避免跨进程问题。

⚠️ 缺点：SSE 不能多核，单点压力大。

### 方案 C：使用 sticky-session + Nginx

- 每个 Worker 都有 SSE 客户端，但通过 Nginx 的 IP Hash / Sticky Session 保证同一个客户端一直连接到同一个 Worker。
- 不跨进程共享 client，而是保证客户端不会被路由到不同 Worker。

⚠️ 适合客户端固定、消息量小场景。

## 3️⃣ 总结

| 方法               | 优缺点                                               | 适用场景                         |
| ------------------ | ---------------------------------------------------- | -------------------------------- |
| Redis Pub/Sub / MQ | ✅ 跨进程广播，Cluster 多核支持 <br> ⚠️ 需要外部依赖 | 高并发、分布式 SSE               |
| 单进程 SSE         | ✅ 简单，内存直接存储客户端 <br> ⚠️ 单点压力         | 消息量小、开发环境               |
| Sticky Session     | ✅ 保证客户端连接到固定 Worker <br> ⚠️ 不跨进程广播  | 客户端数量固定、单 Worker 承载够 |

## 🔥 推荐实践

- 生产环境：Cluster 模式 + Redis Pub/Sub
- 开发环境：可以单进程 SSE，简单快速
- Nginx 前端：可选 sticky session 配合 Cluster 进一步保证客户端稳定
