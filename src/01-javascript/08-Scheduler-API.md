# 浏览器的 scheduler API 详解

## 🧠 为什么需要 Scheduler？

传统任务调度方式（如 setTimeout, requestIdleCallback, Promise, requestAnimationFrame）：

- 缺乏优先级控制
- 任务排队策略不可控
- 不适合调度复杂任务（如大型 React 应用）

为了解决这些问题，WICG 提出了 scheduler API，尤其用于 React Concurrent Mode 等现代框架。

## 🔧 使用入口

```javascript

const controller = new TaskController({ priority: 'user-visible' });

scheduler.postTask(() => {
  // 高优先级任务
}, { signal: controller.signal, priority: 'user-visible' });

```

## ⚙️ scheduler.postTask() 方法

```ts
scheduler.postTask(callback, options?)
```

参数说明：

| 参数         | 类型         | 说明           |
| ---------- | ---------- | ------------ |
| `callback` | `Function` | 要执行的任务函数     |
| `options`  | `Object`   | 配置项（如优先级、信号） |

options 支持的字段：

- priority: 'user-blocking' | 'user-visible' | 'background'
  - 默认值：'user-visible'
- signal: AbortSignal
  - 可以通过 TaskController.signal 来中止任务。
- delay: number（毫秒）
  - 延迟调度任务。

## 📊 优先级等级（从高到低）

| 优先级             | 场景举例            |
| --------------- | --------------- |
| `user-blocking` | 输入响应、按钮点击、立即反馈等 |
| `user-visible`  | 页面加载过程、布局计算等    |
| `background`    | 数据分析、缓存处理、日志发送等 |

## 🧵 示例代码

基本调度

```javascript
scheduler.postTask(() => {
  console.log('高优先级任务');
}, { priority: 'user-blocking' });
```

可取消任务

```javascript
const controller = new TaskController();

scheduler.postTask(() => {
  console.log('可能会被取消');
}, { signal: controller.signal });

controller.abort(); // 任务不会执行
```

延迟调度

```javascript
scheduler.postTask(() => {
  console.log('延迟执行');
}, { delay: 1000 }); // 1秒后执行
```

## 🚦 与其他 API 的关系

| API                      | 特点             |
| ------------------------ | -------------- |
| `setTimeout`             | 固定延时，不支持优先级    |
| `Promise.then`           | 微任务，立即执行但不可中断  |
| `requestIdleCallback`    | 利用空闲时间执行，可被跳过  |
| `requestAnimationFrame`  | 与绘制同步，用于动画     |
| **`scheduler.postTask`** | ✅ 支持优先级、延迟、取消等 |

## 🔬 实际应用场景

- React 18 Concurrent Mode：使用 scheduler 实现基于优先级的更新。
- 渐进式渲染（Progressive Rendering）：后台构建 DOM，用户可随时打断。
- 任务切片（Task Chunking）：避免主线程长时间阻塞。

## 🔍 浏览器兼容性

| 浏览器        | 支持情况   |
| ---------- | ------ |
| Chrome 94+ | ✅ 支持   |
| Edge       | ✅ 支持   |
| Firefox    | ❌ 暂不支持 |
| Safari     | ❌ 暂不支持 |

可以通过 scheduler polyfill 或 scheduler-shim 提前体验。

## ✅ 总结

- scheduler 是未来 Web 应用调度任务的核心 API。
- 提供细粒度控制：优先级、取消、延迟调度。
- 配合框架（如 React）可实现更平滑、响应性更强的用户体验。
