# 基于 PointerEvent 的多指检测

在 Pointer Events 体系里，多指检测的核心只有一句话：

> 同时存在多个不同的 pointerId（且 pointerType === 'touch'）就是多指。

## 一、Pointer 多指的本质模型

和 TouchEvent 的区别

- Touch：一次事件里带一个 touches[]
- Pointer：每一根手指 = 一条独立的事件流

- 👉 多指 ≠ 一个事件里多个点
- 👉 多指 = 多个 pointerId 同时处于 active 状态

## 二、最标准的多指检测方案（推荐）

### 思路

1. 用 Map / Set 保存当前按下的 pointer
2. pointerdown 添加
3. pointerup / pointercancel 删除
4. size ≥ 2 ⇒ 多指

### 示例代码（工程级）

```js
const activePointers = new Map()

el.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'touch') return

  activePointers.set(e.pointerId, {
    x: e.clientX,
    y: e.clientY
  })

  if (activePointers.size === 2) {
    console.log('两指触控开始')
  }
})

el.addEventListener('pointermove', e => {
  if (!activePointers.has(e.pointerId)) return

  const p = activePointers.get(e.pointerId)
  p.x = e.clientX
  p.y = e.clientY
})

el.addEventListener('pointerup', cleanup)
el.addEventListener('pointercancel', cleanup)

function cleanup(e) {
  activePointers.delete(e.pointerId)

  if (activePointers.size < 2) {
    console.log('退出多指状态')
  }
}
```

## 三、检测「第二根手指」的关键点（常被忽略）

`isPrimary 的作用`

- 第一根手指：isPrimary === true
- 之后的手指：isPrimary === false

```js
el.addEventListener('pointerdown', e => {
  if (e.pointerType === 'touch' && !e.isPrimary) {
    console.log('第二根或更多手指')
  }
})
```

> ⚠️ 注意：isPrimary 不能代替数量统计，只能辅助判断。

## 四、实现双指缩放（Pinch）的核心算法

### 1️⃣ 计算两指距离

```js
function distance(p1, p2) {
  const dx = p1.x - p2.x
  const dy = p1.y - p2.y
  return Math.hypot(dx, dy)
}
```

### 2️⃣ 完整示例

```js
let startDistance = 0
let startScale = 1
let scale = 1

el.addEventListener('pointerdown', e => {
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

  if (activePointers.size === 2) {
    const [p1, p2] = [...activePointers.values()]
    startDistance = distance(p1, p2)
    startScale = scale
  }
})

el.addEventListener('pointermove', e => {
  if (!activePointers.has(e.pointerId)) return

  activePointers.get(e.pointerId).x = e.clientX
  activePointers.get(e.pointerId).y = e.clientY

  if (activePointers.size === 2) {
    const [p1, p2] = [...activePointers.values()]
    const d = distance(p1, p2)
    scale = startScale * (d / startDistance)
    el.style.transform = `scale(${scale})`
  }
})
```

📌 这就是双指缩放的本质

## 五、Pointer Capture 与多指的关系

错误示例

```js
el.setPointerCapture(e.pointerId)
```

⚠️ 如果你对 多根手指都 capture：

- 可能导致事件混乱
- pinch 失效

建议

- 只 capture primary pointer
- 或者完全不使用 capture 做多指手势

## 六、必须配合的 CSS（否则会被系统手势抢）

```css
.el {
  touch-action: none;
}
```

📌 否则：

- iOS 会拦截 pinch
- 浏览器会触发页面缩放

## 七、Pointer 多指 vs Touch 多指

| 点      | Touch      | Pointer     |
| ------ | ---------- | ----------- |
| 多指表示   | touches 数组 | 多 pointerId |
| 同一事件多点 | 是          | 否           |
| 手势状态管理 | 浏览器帮一半     | 自己完全掌控      |
| 复杂手势   | 较繁琐        | 更清晰         |

## 八、常见坑总结（必看）

- 1️⃣ 忘了 pointercancel
  - 切后台
  - 来电
  - 系统手势抢占
- 2️⃣ pointerType 未判断
  - 鼠标滚轮 / hover 混进逻辑
- 3️⃣ touch-action 未关闭
  - pinch 不生效
  - 页面被放大

## 九、标准回答

- Pointer Events 中没有 touches 数组，多指是通过同时存在多个不同 pointerId 来判断的；
- 通常在 pointerdown 时记录 pointerId，在 pointerup / cancel 时移除，
- 当 active pointer 数量 ≥ 2 即为多指；
- 双指缩放通过计算两指距离变化实现，并需配合 touch-action 禁用浏览器默认手势。
