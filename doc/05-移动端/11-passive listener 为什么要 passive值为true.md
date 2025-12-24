# passive listener：为什么要 passive: true

这是一个浏览器性能与事件模型的关键点，主要体现在 touch 事件上。

> `passive: true` 的目的，是让浏览器在触摸 / 滚动时可以“先滚动、不等 JS”，
> 避免因为 preventDefault() 的不确定性而阻塞页面渲染。

## 二、问题从哪来？（历史背景）

在没有 passive listener 之前

```js
el.addEventListener("touchmove", handler);
```

浏览器必须假设：

> ❓ 这个 handler 里会不会调用 event.preventDefault()？

于是它的策略是：

```bash
👉 先等 JS 执行完
👉 再决定要不要滚动
```

📌 后果：

- 滚动被 JS 阻塞
- 滑动卡顿
- 掉帧
- 页面“黏手”

## 三、passive 的核心承诺

```js
el.addEventListener("touchmove", handler, { passive: true });
```

等价于对浏览器说：

> “我保证不会调用 preventDefault()，你可以放心滚动。”

于是浏览器可以：

- 立刻开始滚动
- 与 JS 并行
- 不等 JS 执行结果

👉 滚动性能直接提升

## 四、为什么默认变成 passive？

Chrome / Safari 的策略

| 事件       | 默认    |
| ---------- | ------- |
| touchstart | passive |
| touchmove  | passive |
| wheel      | passive |

📌 因为：

- 90% 的场景只是监听
- 只有少数场景真的要阻止滚动

## 五、如果 passive: true 还调用 preventDefault 会怎样？

```js
el.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
  },
  { passive: true }
);
```

结果

- preventDefault() 被忽略
- 控制台警告：
  ```txt
  [Intervention] Unable to preventDefault inside passive event listener due to target being treated as passive. See https://www.chromestatus.com/feature/5093566007214080
  ```

> 📌 这是 设计行为，不是 bug

## 六、什么时候必须用 passive: false？

### 典型场景

| 场景         | 是否 passive |
| ------------ | ------------ |
| 页面滚动监听 | ✅ true      |
| 上报滑动数据 | ✅ true      |
| 下拉刷新     | ❌ false     |
| 拖拽 / 画布  | ❌ false     |
| 手势识别     | ❌ false     |

### 正确写法（阻止滚动）

```js
el.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
  },
  { passive: false }
);
```

## 七、为什么 Pointer Events 不需要 passive？

### touch 的问题

- 是否滚动 → JS 决定
- 浏览器不敢先滚

### pointer 的方案

- 滚动策略前置到 CSS

```css
.el {
  touch-action: none;
}
```

浏览器在事件派发前就知道：

- 是否允许滚动
- 是否允许缩放

👉 无需等待 JS

## 八、passive vs touch-action 对照

| 方案                   | 控制层级 | 性能 |
| ---------------------- | -------- | ---- |
| touch + preventDefault | JS       | ❌   |
| passive listener       | JS       | ✅   |
| pointer + touch-action | CSS      | ✅✅ |
