# Redis 进程间通信

ioredis 跨进程通信，实际上是指利用 Redis 的发布/订阅（Pub/Sub）机制在不同 Node.js 进程间传递消息。ioredis 完全支持这个模式，非常适合进程间通信（IPC），尤其是在 PM2 或 cluster 模式下。

## 1️⃣ 核心思想

- 每个进程都连接同一个 Redis 实例。
- 一个进程 发布消息（publish）。
- 另一个进程 订阅频道（subscribe）并接收消息。
- Redis 自动广播消息给所有订阅同一频道的客户端。

## 2️⃣ 基本实现示例

```js
// redisPub.js
import Redis from "ioredis";

const redis = new Redis();

// 发布消息
function publish(channel, message) {
  redis.publish(channel, JSON.stringify(message));
}

// 模拟发送
setInterval(() => {
  publish("my_channel", { ts: Date.now(), text: "Hello from process A" });
}, 2000);
```

```js
// redisSub.js
import Redis from "ioredis";

const redis = new Redis();

// 订阅频道
redis.subscribe("my_channel", (err, count) => {
  if (err) {
    console.error("Subscribe failed:", err);
  } else {
    console.log(`Subscribed to ${count} channel(s).`);
  }
});

// 接收消息
redis.on("message", (channel, message) => {
  console.log("Received message:", channel, JSON.parse(message));
});
```

## 3️⃣ 在 PM2 cluster/多进程下的应用

如果你用 PM2 cluster 模式：

- 每个 worker 都可以订阅相同的 Redis 频道。
- 一个 worker 发布的消息，所有订阅该频道的 worker 都能收到。
- 注意：使用 Pub/Sub 时，ioredis 的同一实例不要同时 subscribe 和执行其他命令，最好分开两个实例：

```js
const pub = new Redis(); // 发布
const sub = new Redis(); // 订阅
```

## 4️⃣ 高级用法：跨进程事件总线

可以封装一个通用事件总线，让各个进程像调用 EventEmitter 一样通信：

```js
// redisEventBus.js
import Redis from "ioredis";
import { EventEmitter } from "events";

export class RedisEventBus extends EventEmitter {
  constructor(channel) {
    super();
    this.channel = channel;
    this.pub = new Redis();
    this.sub = new Redis();

    this.sub.subscribe(channel, (err) => {
      if (err) console.error(err);
    });

    this.sub.on("message", (ch, msg) => {
      if (ch === this.channel) {
        const { event, data } = JSON.parse(msg);
        this.emit(event, data);
      }
    });
  }

  emitEvent(event, data) {
    this.pub.publish(this.channel, JSON.stringify({ event, data }));
  }
}
```

使用示例：

```js
const bus = new RedisEventBus("my_app_channel");

bus.on("task", (data) => {
  console.log("Received task:", data);
});

bus.emitEvent("task", { id: 123, name: "doSomething" });
```

这样不同进程就可以像本地事件一样通信。

## 5️⃣ 注意事项

- 性能问题：Pub/Sub 不适合高吞吐量大数据量消息。
- 消息丢失：Redis Pub/Sub 不保证消息持久化，如果订阅客户端不在线，消息会丢失。
  - 如果需要可靠传递，可以考虑 Redis Streams 或 BullMQ。
- 连接数：每个进程至少两个 ioredis 实例（pub/sub 分开）。
- JSON 序列化：跨进程消息最好使用 JSON。
