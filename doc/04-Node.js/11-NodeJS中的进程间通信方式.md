# NodeJS中的进程间通信方式

Node.js 进程间通信（IPC, Inter-Process Communication）方式比较多，根据是否是主/子进程、是否可跨机器、是否需要第三方组件，可以分为 6 大类。

## ✅ Node.js 进程间通信方式全集

### 1. 内置 IPC（父子进程之间）

Node.js 的 child_process.fork() 会自动建立一个 IPC 管道，支持 JSON-level 的消息传输。

特点:

- 单机
- 父子关系
- 无需额外依赖
- 支持结构化对象

示例

```js
// parent.js
const { fork } = require('child_process');
const worker = fork('./worker.js');

worker.on('message', msg => {
  console.log('Parent received:', msg);
});

worker.send({ type: 'start', payload: 123 });
```

```js
// worker.js
process.on('message', msg => {
  console.log('Worker received:', msg);
  process.send({ result: 'ok' });
});
```

适合场景：CPU 密集型任务分发（多进程 worker）、PM2 cluster 内部通信。

### 2. Node cluster 进程通信

cluster 内部自动通过 IPC 通道连接 master 与 workers。

特点

- Node 内置
- 实际底层仍然使用 child_process 的 IPC
- 支持广播

示例

```js
// master-worker.js
const cluster = require('cluster');
const os = require('os');

if (cluster.isPrimary) {
  // ------------------------------
  // Primary Process (Master)
  // ------------------------------
  console.log(`Master started, pid=${process.pid}`);

  const numCPUs = 2; // 为简洁起见，固定 2 个 worker

  // 启动 worker
  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork();

    // 来自 worker 的消息
    worker.on('message', (msg) => {
      console.log(`Master received from worker ${worker.id}:`, msg);

      // worker 之间通信：worker1 -> master -> worker2
      if (msg.type === 'send-to-other') {
        const targetId = msg.target;
        const targetWorker = cluster.workers[targetId];
        if (targetWorker) {
          targetWorker.send({
            from: worker.id,
            data: msg.data,
          });
        }
      }
    });
  }

  // 给所有 worker 广播
  setTimeout(() => {
    console.log('\nMaster broadcasting...');
    for (const id in cluster.workers) {
      cluster.workers[id].send({ from: 'master', data: 'Hello workers!' });
    }
  }, 1000);

  // 给某个 worker 单播
  setTimeout(() => {
    console.log('\nMaster sends message to worker 1');
    cluster.workers[1].send({ from: 'master', data: 'Hello worker 1!' });
  }, 2000);

} else {
  // ------------------------------
  // Worker Process
  // ------------------------------
  console.log(`Worker started, id=${cluster.worker.id}, pid=${process.pid}`);

  // 接收来自 master/其它 worker 的消息
  process.on('message', (msg) => {
    console.log(`Worker ${cluster.worker.id} received:`, msg);

    // 在 Worker 内部可以做业务逻辑
  });

  // 主动给 master 发消息
  setTimeout(() => {
    process.send({
      type: 'worker-ready',
      id: cluster.worker.id,
      msg: 'Worker is ready!',
    });
  }, 500);

  // worker1 主动给 worker2 发消息（模拟服务内部通信）
  setTimeout(() => {
    if (cluster.worker.id === 1) {
      process.send({
        type: 'send-to-other', // 让 master 中转
        target: 2, // 发给 worker2
        data: 'Hello from worker 1!',
      });
    }
  }, 3000);
}

```

使用 PM2 cluster 时，本方式背后也是 IPC 管道。

### 3. UNIX Domain Socket (UDS) / Windows Named Pipe

这是性能最强的 IPC 方式（无网络协议开销）。

可用于：

- 多 Node 服务共享同一个端口（Nginx 热更新）
- PM2 的内部进程通信
- server reload 热重启

示例

```js
const net = require('net');

net.createServer(socket => {
  socket.on('data', data => console.log('recv:', data.toString()));
}).listen('/tmp/node.sock');

const client = net.createConnection('/tmp/node.sock');
client.write('hello');
```

- 优点：极快，无需 TCP。
- 缺点：只能本机。

### 4. TCP / UDP 通信

独立进程可通过网络通信（即使在同一台机器）。

TCP 示例

```js
// server.js
const net = require('net');

const PORT = 5000;
const HOST = '0.0.0.0';

let clients = new Set();

// 创建 TCP 服务器
const server = net.createServer((socket) => {
  console.log(`Client connected: ${socket.remoteAddress}:${socket.remotePort}`);
  clients.add(socket);

  socket.setEncoding('utf8');

  // 接收到客户端消息
  socket.on('data', (data) => {
    console.log(`Received from client: ${data.trim()}`);

    // 回包：发送给当前客户端
    socket.write(`Server echo: ${data}`);

    // 广播给其它客户端
    broadcast(`${socket.remotePort} says: ${data}`, socket);
  });

  // 客户端断开
  socket.on('close', () => {
    console.log(`Client disconnected: ${socket.remoteAddress}:${socket.remotePort}`);
    clients.delete(socket);
  });

  // 错误处理
  socket.on('error', (err) => {
    console.error(`Socket error:`, err.message);
    clients.delete(socket);
  });
});

// 广播给所有客户端（除了发起者）
function broadcast(msg, sender) {
  for (const client of clients) {
    if (client !== sender) {
      client.write(`Broadcast: ${msg}`);
    }
  }
}

// 启动服务
server.listen(PORT, HOST, () => {
  console.log(`TCP server running at ${HOST}:${PORT}`);
});

// 服务端错误
server.on('error', (err) => {
  console.error('Server error:', err.message);
});

```

```js
// client.js
const net = require('net');

const PORT = 5000;
const HOST = '127.0.0.1';

// 创建 TCP 客户端
const client = new net.Socket();

client.setEncoding('utf8');

// 连接到服务端
client.connect(PORT, HOST, () => {
  console.log(`Connected to server ${HOST}:${PORT}`);

  // 发送消息
  client.write('Hello server!\n');
});

// 接收服务端推送
client.on('data', (data) => {
  console.log(`Received from server: ${data.trim()}`);
});

// 连接关闭
client.on('close', () => {
  console.log('Connection closed');
});

// 错误处理
client.on('error', (err) => {
  console.error('Client error:', err.message);
});
```

UDP 示例

```js
// server.js
const dgram = require('dgram');
const server = dgram.createSocket('udp4');

const PORT = 41234;
const HOST = '0.0.0.0';

// 接收消息事件
server.on('message', (msg, rinfo) => {
  console.log(`Server received: "${msg}" from ${rinfo.address}:${rinfo.port}`);

  // 回包给客户端
  const reply = `Hello, client! Received your message: ${msg}`;
  server.send(reply, rinfo.port, rinfo.address);
});

// 监听错误
server.on('error', (err) => {
  console.error('Server error:', err);
  server.close();
});

// 启动监听
server.bind(PORT, HOST, () => {
  console.log(`UDP server listening on ${HOST}:${PORT}`);
});

```

```js
// client.js
const dgram = require('dgram');
const client = dgram.createSocket('udp4');

const SERVER_PORT = 41234;
const SERVER_HOST = '127.0.0.1';

// 接收服务端回包
client.on('message', (msg, rinfo) => {
  console.log(`Client received reply: "${msg}" from ${rinfo.address}:${rinfo.port}`);
});

// 发送消息给服务端
const message = Buffer.from('Hello UDP Server!');
client.send(message, SERVER_PORT, SERVER_HOST, (err) => {
  if (err) console.error('Send error:', err);
  else console.log('Message sent to server');
});

// 监听错误
client.on('error', (err) => {
  console.error('Client error:', err);
  client.close();
});
```

### 5. 消息队列（Redis / RabbitMQ / Kafka）

这种方式最常见于 Node 多进程、跨服务、跨机器通信。

示例（Redis 发布订阅）

```js
const Redis = require('ioredis');
const pub = new Redis();
const sub = new Redis();

sub.subscribe('channel');

sub.on('message', (ch, msg) => {
  console.log(msg);
});

pub.publish('channel', 'hello');
```

- 优点：可靠、跨主机、多语言支持
- 缺点：依赖 MQ 组件

### 6. 文件 + FS watch（非主流）

利用文件变化实现进程通信，比如写 JSON 到某个文件，另一个进程 watch。

示例

```js
fs.watch('./msg.json', () => {
  const msg = JSON.parse(fs.readFileSync('./msg.json'));
});
```

- 缺点：慢、不可靠
- 优点：调试简单

## 总结对比表

| 方式                   | 单机/跨机 | 速度    | 实现难度 | 特点              |
| -------------------- | ----- | ----- | ---- | --------------- |
| IPC（fork）            | 单机    | ★★★★☆ | 简单   | 父子进程，支持对象       |
| cluster IPC          | 单机    | ★★★★☆ | 简单   | Node cluster 专用 |
| UDS / Named Pipe     | 单机    | ★★★★★ | 较难   | 速度最快，无网络开销      |
| TCP/UDP              | 都支持   | ★★★☆☆ | 中    | 可跨主机            |
| MQ（Redis / RabbitMQ） | 都支持   | ★★★☆☆ | 中    | 常用、稳定           |
| 文件系统 watch           | 单机    | ★☆☆☆☆ | 简单   | 不可靠，不建议生产       |

## 推荐实战场景

| 场景                      | 推荐方式                   |
| ----------------------- | ---------------------- |
| CPU 密集任务分发              | `child_process.fork()` |
| PM2 / cluster 共享端口      | UNIX Domain Socket     |
| 多服务跨主机通信                | TCP / Redis            |
| SSE/Websocket 广播        | Redis Pub/Sub          |
| Node + Python + Go 项目通信 | Redis/TCP              |
