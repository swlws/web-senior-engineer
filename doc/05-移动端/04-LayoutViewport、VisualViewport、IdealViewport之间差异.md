# LayoutViewport、VisualViewport、IdealViewport 之间差异

## 一、总览

| 名称                  | 本质         | 谁决定        | 是否变化 |
| ------------------- | ---------- | ---------- | ---- |
| **Layout Viewport** | CSS 布局坐标系  | 浏览器        | 基本固定 |
| **Visual Viewport** | 用户当前看到的区域  | 浏览器 + 用户缩放 | 会变化  |
| **Ideal Viewport**  | 理想的移动端布局宽度 | 开发者期望      | 概念值  |

## 二、Layout Viewport（布局视口）

### 是什么？

> 浏览器用来计算 CSS 布局的“虚拟画布”

- 所有 width / left / vw / % 都基于它
- DOM 布局、流式排版都发生在这里
- 不随缩放变化

### 典型特征

- 移动端默认 ≈ 980px
- 设置 `width=device-width` 后 ≈ `设备 CSS 宽度`（如 375）

```html
<meta name="viewport" content="width=device-width">
```

### 数学关系

```bash
1vw = layout viewport 宽度 / 100
```

## 三、Visual Viewport（视觉视口）

### 是什么？

> 用户“实际看到”的屏幕区域

- 双指缩放
- 键盘弹起
- 横竖屏切换

都会改变它。

### 特征

- 是 layout viewport 的一个子窗口
- 可以移动（滚动）
- 可以缩放

### 数学关系

```bash
visual viewport = layout viewport / scale
```

## 四、Ideal Viewport（理想视口）

### 是什么？

> “如果浏览器为移动端量身定做，一个 100% 宽页面应该多宽？”

这是一个设计概念，不是浏览器对象。

- 通常 ≈ 设备 CSS 宽度
- iPhone 6/7/8 ≈ 375px
- iPhone Pro Max ≈ 430px

`width=device-width 的目标就是“接近 ideal viewport”`

## 五、三者关系图（文字版）

```txt
┌──────────────────────────┐
│      Layout Viewport     │  ← CSS 布局世界
│                          │
│   ┌─────────────────┐   │
│   │ Visual Viewport  │   │  ← 用户看到的
│   │                 │   │
│   └─────────────────┘   │
└──────────────────────────┘
          ↑
      Ideal Viewport
   （开发者期望值）
```

## 六、没有 meta viewport 时发生了什么？

```html
<!-- 没有设置 viewport -->
```

浏览器行为

- layout viewport = 980px
- ideal viewport ≈ 375px
- visual viewport = ideal viewport
- 浏览器自动缩放页面

👉 造成：

- 页面变小
- 字体很细
- 移动端体验差

## 七、加上 meta viewport 后

```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

结果：

```bash
layout viewport = ideal viewport ≈ 375px
visual viewport = 375px
scale = 1
```

页面“刚好铺满屏幕”

## 八、和 rem / vw / initial-scale 的关系（串起来）

vw

```bash
1vw = layout viewport 的 1%
```

rem

```bash
1rem = html font-size
```

initial-scale

```bash
visual viewport = layout viewport / scale
```

## 九、常见陷阱

❌ 错误说法

> vw 基于 visual viewport

✅ 正确：

> vw 基于 layout viewport

❌ 错误说法

> 缩放会影响 CSS 布局宽度

✅ 正确：

> 缩放只影响 visual viewport，不影响 layout viewport

❌ 错误说法

> ideal viewport 是浏览器 API

✅ 正确：

> ideal viewport 是设计目标概念

## 十、总结

- Layout viewport 是浏览器用于 CSS 布局的坐标系；
- Visual viewport 是用户当前看到的区域，会随缩放变化；
- Ideal viewport 是开发者期望的移动端布局宽度，
- meta viewport 的本质就是让 layout viewport 尽量等于 ideal viewport。
