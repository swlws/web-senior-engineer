# requestIdleCallback 与 requestAnimationFrame

这两个 API 都是浏览器提供的异步任务调度工具，但用途、执行时机和场景完全不同。

## 🆚 核心对比表

| 特性         | `requestIdleCallback`                  | `requestAnimationFrame` |
| ---------- | -------------------------------------- | ----------------------- |
| 主要用途       | 利用浏览器空闲时间执行“非紧急”任务                     | 在下一帧渲染前执行“动画相关”任务       |
| 执行时机       | 浏览器主线程空闲时                              | 下一帧绘制之前（通常在 16.66ms 内）  |
| 回调参数       | 提供空闲时间剩余信息（`deadline.timeRemaining()`） | 提供时间戳（高精度时间）            |
| 是否保证执行     | ❌ 可能被跳过或延迟                             | ✅ 几乎每帧都会调用              |
| 是否影响帧率     | ❌ 自动避免影响帧率                             | ✅ 可能影响帧率（若耗时过长）         |
| 是否适合执行重绘操作 | ❌ 不适合（可能在渲染之后）                         | ✅ 非常适合（与渲染同步）           |
| 浏览器支持      | 较差（需降级处理）                              | 广泛支持                    |
| 可中断性       | ✅ 可判断剩余时间并中断                           | ❌ 不具备中断能力               |

## 🧪 使用示例

requestIdleCallback 示例

```javascript
requestIdleCallback((deadline) => {
  // ✅ deadline.timeRemaining() 表示当前帧还剩多少毫秒可以用。
  while (deadline.timeRemaining() > 0 && tasks.length > 0) {
    doWork(tasks.shift());
  }
});
```

requestAnimationFrame 示例

```javascript
function animate() {
  updateElementPosition();
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
```

## 🧭 应用场景建议

| 场景            | 建议使用                                         |
| ------------- | -------------------------------------------- |
| 页面动画、位移变换等    | `requestAnimationFrame`                      |
| 不影响用户体验的非关键逻辑 | `requestIdleCallback`                        |
| 虚拟列表惰性加载      | `requestIdleCallback` + `timeRemaining` 分片执行 |
| 动画帧同步的游戏逻辑    | `requestAnimationFrame`                      |
