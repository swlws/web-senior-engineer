# Touch 事件

`touchstart`  `touchmove`  `touchend`从事件模型 → 触点数据结构 → 触控顺序 → 阻止滚动 → 常见坑一次讲透（偏移动端 / WebView 实战 & 面试）。

## 一、三个事件各自代表什么？

| 事件             | 何时触发     | 本质     |
| -------------- | -------- | ------ |
| **touchstart** | 手指触碰屏幕   | 手势开始   |
| **touchmove**  | 手指在屏幕上移动 | 手势进行中  |
| **touchend**   | 手指离开屏幕   | 手势结束   |
| touchcancel    | 被系统中断    | 手势异常结束 |

## 二、事件触发顺序（单指）

```txt
touchstart
touchmove (0 次或多次)
touchend
```

- 📌 没有移动也会有 touchend
- 📌 touchmove 可能被浏览器优化（不会每帧触发）

## 三、TouchEvent 对象结构

```ts
interface TouchEvent {
  touches: TouchList
  targetTouches: TouchList
  changedTouches: TouchList
}
```

三个 TouchList 的区别

| 属性                 | 包含哪些触点      | 典型用途   |
| ------------------ | ----------- | ------ |
| **touches**        | 当前屏幕上的所有触点  | 判断多指数量 |
| **targetTouches**  | 当前元素上的触点    | 组件级处理  |
| **changedTouches** | 本次事件发生变化的触点 | 追踪起止   |

## 四、多指触控示例

双指触摸

```txt
touchstart → touches.length = 1
touchstart → touches.length = 2
touchmove  → touches.length = 2
touchend   → changedTouches.length = 1
touchend   → changedTouches.length = 1
```

📌 每根手指都有唯一 identifier

## 五、阻止页面滚动

### ❌ 常见误区

```js
el.addEventListener('touchmove', e => {
  e.preventDefault()
})
```

👉 在现代浏览器可能无效

### ✅ 正确方式：passive: false

```js
el.addEventListener(
  'touchmove',
  e => {
    e.preventDefault()
  },
  { passive: false }
)
```

📌 Chrome / iOS Safari 都默认 `touchmove` 为 passive

### ⚠️ iOS 特例

- body 的 touchmove 不能完全阻止滚动
- 需要包裹滚动容器

## 六、touch 与 click 的关系（面试必问）

### 经典 300ms 延迟

- iOS 早期：等待是否双击缩放
- 现代浏览器已移除（viewport 正确）

### 事件顺序（一次点击）

```txt
touchstart
touchend
mousedown
mouseup
click
```

📌 阻止 touchstart/touchend 可能影响 click

## 七、常见实战场景

### 1️⃣ 拖拽实现

```js
let startX = 0

el.addEventListener('touchstart', e => {
  startX = e.touches[0].clientX
})

el.addEventListener(
  'touchmove',
  e => {
    const dx = e.touches[0].clientX - startX
    el.style.transform = `translateX(${dx}px)`
  },
  { passive: false }
)
```

### 2️⃣ 判断滑动方向

```js
const dx = endX - startX
const dy = endY - startY

if (Math.abs(dx) > Math.abs(dy)) {
  // 横向滑动
}
```

### 3️⃣ 双击判断（不推荐，但面试会问）

```js
let last = 0
el.addEventListener('touchend', e => {
  const now = Date.now()
  if (now - last < 300) {
    console.log('double tap')
  }
  last = now
})
```

## 八、touch vs pointer vs mouse（趋势）

| 模型      | 现状             |
| ------- | -------------- |
| touch   | 移动端主流          |
| mouse   | 桌面端            |
| pointer | **未来统一方案（推荐）** |

👉 新项目建议优先 `Pointer Events`

```js
el.addEventListener('pointerdown', ...)
```

## 九、常见坑总结

- 1️⃣ touchmove 不触发？
  - passive 默认开启
  - 被系统滚动劫持
- 2️⃣ iOS 滚动穿透
  - touch 事件没阻止
  - body 可滚动
- 3️⃣ 多指误判
  - 忘记使用 identifier

## 十、一句话

- `touchstart / touchmove / touchend` 是移动端原生触控事件，
- 描述手指从接触、移动到离开的完整过程；
- 事件对象通过 `touches / targetTouches / changedTouches`
- 提供多指信息，阻止默认滚动需要配合 `passive:false`；
- 在现代工程中常与 `pointer events` 统一处理。
