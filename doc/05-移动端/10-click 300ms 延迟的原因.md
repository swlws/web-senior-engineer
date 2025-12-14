# click 300ms 延迟的原因

结论:

> click 的 300ms 延迟是为了解决「双击缩放（double-tap zoom）」的判定问题，
> 浏览器需要等待一小段时间确认用户不是在进行双击手势。

## 一、300ms 延迟最初是为了解决什么？

早期 iPhone Safari（2007）

- 屏幕小
- 网站为 PC 设计
- 没有 viewport 适配
- 用户主要靠 双击放大页面

👉 浏览器必须判断：

```txt
这是一次单击？
还是双击的第一下？
```

于是策略是：

> 等 300ms，看会不会再点一次

- 如果 300ms 内有第二次 tap → 执行 缩放
- 如果没有 → 执行 click

## 二、为什么是 300ms？

这是一个经验值：

- 太短：容易误判双击
- 太长：点击明显卡顿

300ms 在当年是`可接受的人机交互延迟上限`

## 三、300ms 延迟的真实触发链路

一次 tap 在早期移动浏览器中的事件顺序：

```txt
touchstart
touchend
（等待 ~300ms）
mousedown
mouseup
click
```

## 四、为什么现在很多时候“感觉不到 300ms 了”？

1. `因为浏览器 `有条件地移除了延迟`
2. 只要 `浏览器确信不会发生双击缩放`，就可以立刻触发 click。

## 五、哪些条件会取消 300ms 延迟？（重点）

### ✅ 1️⃣ 设置 viewport（最关键）

```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

这意味着：

- 页面已按设备宽度布局
- 不需要双击缩放

📌 `iOS 8+ / Android Chrome` 都会移除延迟

### ✅ 2️⃣ 禁止双击缩放（CSS）

```css
button {
  touch-action: manipulation;
}
```

或

```css
button {
  touch-action: none;
}
```

### ✅ 3️⃣ 使用 fastclick（历史方案）

```js
FastClick.attach(document.body);
```

> 📌 本质：自己监听 touchend，模拟 click
> ⚠️ 现在 已不推荐

### ❌ 仍然会有 300ms 的情况

- 没设置 viewport
- 页面可被缩放
- 老旧 WebView / 老 iOS
- iframe / 特定嵌套环境

## 六、300ms 和你「iOS 双击缩放」的关系

| 问题                 | 本质                    |
| -------------------- | ----------------------- |
| iOS 为什么双击会缩放 | 为了可用性              |
| 为什么有 300ms       | 等待是否双击            |
| 如何禁用             | viewport + touch-action |
| pointer 为什么推荐   | 不依赖 click            |

👉 300ms 是双击缩放的副产品

## 七、现代工程的正确做法（2025）

❌ 不推荐

```js
el.addEventListener("click", handler);
```

✅ 推荐

```js
el.addEventListener("pointerup", handler);
```

或

```js
el.addEventListener("touchend", handler);
```

并配合：

```css
.el {
  touch-action: manipulation;
}
```

## 八、总结

- 300ms 延迟并不是 click 本身的性能问题，而是浏览器为了支持双击缩放引入的人机交互等待；
- 当页面通过 viewport 或 touch-action 明确禁止缩放后，浏览器即可立即派发 click；
- 在现代 Web 中，更推荐使用 pointer / touch 事件直接处理交互，避免依赖 click。
