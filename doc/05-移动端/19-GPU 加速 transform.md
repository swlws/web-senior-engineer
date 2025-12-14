# GPU 加速 transform

按浏览器渲染管线 → transform 为什么“快” → GPU 加速的真相 → 何时有效 / 何时翻车 → 工程实践 系统讲清楚。

## 一、浏览器渲染管线（先给结论）

典型流程：

```txt
JS
 ↓
Style（计算样式）
 ↓
Layout（回流）
 ↓
Paint（绘制）
 ↓
Composite（合成 / GPU）
```

性能关键点

- Layout / Paint 很慢
- Composite 很快（GPU）

## 二、为什么 transform 性能好？

> transform 只发生在 Composite 阶段，不触发布局和重绘

对比说明

| 操作           | Layout | Paint | Composite |
| -------------- | ------ | ----- | --------- |
| 改 width / top | ✅     | ✅    | ✅        |
| 改 background  | ❌     | ✅    | ✅        |
| 改 transform   | ❌     | ❌    | ✅        |

👉 所以 transform 非常适合：

- 动画
- 位移
- 缩放
- 拖拽

## 三、GPU 加速到底做了什么？

- 常见误解 ❌
  - transform: translate3d 会让 JS 跑到 GPU
- 真相 ✅
  - 只有“合成阶段”在 GPU
  - JS / Layout 仍在 CPU
  - GPU 负责：
    - 位图合成
    - 图层位移 / 缩放 / 透明度

## 四、什么情况下会触发「独立合成层」？

浏览器会为以下情况创建 合成层（Layer）：

- transform ≠ none
- opacity < 1
- will-change: transform
- position: fixed（部分浏览器）
- video / canvas

📌 合成层 = GPU 可直接操作的纹理

## 五、translate3d(0,0,0) 的真实作用

作用: 👉 强制提升为合成层

```css
.box {
  transform: translateZ(0);
}
```

- 好处
  - 避免频繁 paint
  - 动画更稳定
- 坑（重要）
  - 合成层 ≠ 越多越好
  - 占用 GPU 内存
  - 可能触发 掉帧 / 白屏

## 六、何时 GPU 加速反而更慢？（高阶）

- 1️⃣ 小元素 / 静态元素
  - 提升图层的成本 > 收益
- 2️⃣ 大面积元素
  - 纹理过大
  - GPU 内存压力
- 3️⃣ 频繁创建 / 销毁
  - 比 repaint 更贵

## 七、工程级最佳实践（可直接用）

✅ 动画用 transform + opacity

```css
.fade {
  transition: transform 300ms ease, opacity 300ms;
}
```

---

✅ 提前声明 will-change（谨慎）

```css
.card {
  will-change: transform;
}
```

⚠️ 用完记得移除

---

❌ 避免这些做动画

```css
top / left
width / height
margin / padding
```

## 八、滚动 / 拖拽场景的性能策略

错误示例

```js
el.style.top = y + "px";
```

正确

```js
el.style.transform = `translateY(${y}px)`;
```

## 九、在 WebView / 移动端的特殊收益

- GPU 合成更明显
- 滚动更流畅
- 减少掉帧

- overscroll
- fixed 抖动
- 输入框错位

很多都和 paint / composite 有关

## 十、如何验证是否 GPU 加速？（实战）

Chrome DevTools

- Rendering → Layers
- Performance → 查看 Composite 阶段
- FPS Meter

## 十一、总结

- transform 之所以性能好，是因为它只发生在浏览器渲染流水线的合成阶段，不会触发布局和重绘；
- 浏览器通常会为 transform 或 opacity 的元素创建独立合成层，由 GPU 负责位图合成和位移，
- 从而显著降低动画和拖拽场景下的渲染开销。
