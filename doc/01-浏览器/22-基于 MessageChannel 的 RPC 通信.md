# 基于 MessageChannel 的 RPC 通信

| 功能             | postMessage                  | MessageChannel           |
| ---------------- | ---------------------------- | ------------------------ |
| 是否需要全局监听 | 需要 window.addEventListener | 不需要，全专用           |
| 通道数量         | 单通道，全局共用             | 可无限创建               |
| 是否双向         | 是                           | 是                       |
| 性能             | 中                           | 高（不进主线程事件队列） |
| 管理复杂度       | 容易混乱                     | 每对 port 独立           |

## Code

```js
class RPC {
  constructor({ producer }) {
    this.channel = new MessageChannel();
    this.port1 = this.channel.port1;
    this.port2 = this.channel.port2;

    this.producer = producer;

    this.init();
  }

  init() {
    this.port2.onmessage = (e) => {
      const { method, args } = e.data;
      const result = this.producer[method](...args);
      this.port2.postMessage(result);
    };
  }

  call(method, args) {
    return new Promise((resolve) => {
      this.channel.port1.onmessage = resolve;
      this.channel.port1.postMessage({ method, args });
    });
  }
}

const rpc = new RPC({
  producer: {
    sum(a, b) {
      return a + b;
    },
  },
});

rpc.call("sum", [1, 2]).then((res) => console.log(res.data));
```
