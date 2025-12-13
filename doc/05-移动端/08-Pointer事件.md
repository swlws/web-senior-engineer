# 指针事件（Pointer Events）

Pointer Events（指针事件）的系统级讲解，从设计初衷 → 事件模型 → 与 touch/mouse 的差异 → 工程实践与坑

## 一、一句话结论（先给结论）

`Pointer Events` 是一个统一输入模型，用一套事件同时覆盖 `mouse / touch / pen`，是现代 Web 推荐的交互事件体系。

## 二、为什么会有 Pointer Events？

### 老问题（你一定踩过）

- mouse：只能单指
- touch：只能移动端
- 同一逻辑要写三套监听
- click / 300ms / passive / preventDefault 混乱

### Pointer 的目标

- 一个事件模型
- 统一鼠标 / 触控 / 触控笔

## 三、Pointer 事件家族

| Pointer 事件           | 对应 Touch    | 对应 Mouse           |
| -------------------- | ----------- | ------------------ |
| pointerdown          | touchstart  | mousedown          |
| pointermove          | touchmove   | mousemove          |
| pointerup            | touchend    | mouseup            |
| pointercancel        | touchcancel | —                  |
| pointerenter / leave | —           | mouseenter / leave |
| pointerover / out    | —           | mouseover / out    |

📌 顺序（单指）：

```txt
pointerdown
pointermove (0~n)
pointerup
```

## 四、PointerEvent 对象（重点）

```ts
interface PointerEvent extends MouseEvent {
  pointerId: number
  pointerType: 'mouse' | 'touch' | 'pen'
  isPrimary: boolean
  pressure: number
  width: number
  height: number
}
```

关键字段解释

| 字段                 | 作用       |
| ------------------ | -------- |
| **pointerId**      | 唯一标识一个指针 |
| **pointerType**    | 输入类型     |
| **isPrimary**      | 是否主指针    |
| **pressure**       | 压力（0~1）  |
| **width / height** | 接触面积     |

👉 多指 = 多个 pointerId

## 五、Pointer Capture（杀手级特性）

> 指针捕获：即使手指 / 鼠标移出元素，事件仍然发给该元素

为什么重要？

- 拖拽
- 滑动
- 画板
- 游戏控制

用法

```js
el.addEventListener('pointerdown', e => {
  el.setPointerCapture(e.pointerId)
})

el.addEventListener('pointermove', e => {
  // 始终接收
})

el.addEventListener('pointerup', e => {
  el.releasePointerCapture(e.pointerId)
})
```

📌 touch 里没有等价能力（要自己算）

## 六、阻止滚动：Pointer vs Touch（重点差异）

### ❌ touch

```bash
touchmove + passive:false + preventDefault
```

### ✅ pointer（更干净）

```css
.box {
  touch-action: none;
}
```

```js
el.addEventListener('pointermove', e => {
  // 不会触发滚动
})
```

📌 Pointer 的滚动控制在 CSS 层完成

## touch-action 的真实含义（必会）

| 值            | 行为        |
| ------------ | --------- |
| auto         | 默认        |
| none         | 禁止所有浏览器手势 |
| manipulation | 禁止双击缩放    |
| pan-x        | 只允许横向滚动   |
| pan-y        | 只允许纵向滚动   |

📌 这是 Pointer Events 的核心配套机制

## 八、一个完整拖拽示例（工程级）

```js
const el = document.querySelector('.drag')

let startX = 0

el.addEventListener('pointerdown', e => {
  startX = e.clientX
  el.setPointerCapture(e.pointerId)
})

el.addEventListener('pointermove', e => {
  if (!el.hasPointerCapture(e.pointerId)) return
  const dx = e.clientX - startX
  el.style.transform = `translateX(${dx}px)`
})

el.addEventListener('pointerup', e => {
  el.releasePointerCapture(e.pointerId)
})
```

```css
.drag {
  touch-action: none;
}
```

## 九、Pointer vs Touch vs Mouse 对比总结

| 维度   | Pointer | Touch | Mouse |
| ---- | ------- | ----- | ----- |
| 多指   | ✅       | ✅     | ❌     |
| 桌面支持 | ✅       | ❌     | ✅     |
| 阻止滚动 | CSS     | JS    | JS    |
| 压力感知 | ✅       | 部分    | ❌     |
| 统一模型 | ✅       | ❌     | ❌     |

👉 新项目优先 Pointer

## 十、推荐的工程写法（渐进增强）

```js
const supportsPointer = 'PointerEvent' in window

if (supportsPointer) {
  el.addEventListener('pointerdown', handler)
} else {
  el.addEventListener('touchstart', handler)
}
```

## 十一、总结

- Pointer Events 是统一 mouse / touch / pen 的现代输入事件模型，
- 通过 pointerId 管理多指，通过 pointer capture 保证拖拽稳定性，
- 并配合 touch-action 在 CSS 层控制滚动和缩放，
- 相比传统 touch 事件更加一致、可维护，是现代 Web 推荐方案。
