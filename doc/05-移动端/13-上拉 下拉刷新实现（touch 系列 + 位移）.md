# 上拉 下拉刷新实现（touch 系列 + 位移）

## 一、下拉 / 上拉刷新的本质

一句话：

> 在“滚动到边界”的前提下，用 touch 位移模拟一个“弹性位移 + 状态切换”的过程。

核心要素只有 4 个：

- 必须在边界
- 用 touchmove 计算位移
- 限制最大位移（阻尼）
- touchend 判断是否触发刷新

## 二、什么时候才允许“拉”？（最重要判断）

下拉刷新条件

```txt
scrollTop === 0
且
手指向下滑（dy > 0）
```

上拉加载条件

```txt
scrollTop + clientHeight >= scrollHeight
且
手指向上滑（dy < 0）
```

📌 不在边界，一律交给原生滚动

## 三、touch 位移的计算方式

```js
startY = touchstart.clientY;
currentY = touchmove.clientY;
dy = currentY - startY;
```

- 下拉：`dy > 0`
- 上拉：`dy < 0`

## 四、为什么要“阻尼”？（体验关键）

如果位移 1:1 显示：

- 拉得太快
- 体验生硬

常见阻尼函数

```js
offset = dy * 0.5;
```

或更真实一点：

```js
offset = dy / (1 + Math.abs(dy) / 100);
```

## 五、完整下拉刷新流程（状态机）

```txt
idle
 ↓ touchstart
pulling（位移 < threshold）
 ↓ 超过阈值
ready
 ↓ touchend
loading
 ↓ 完成
reset
```

## 六、工程级下拉刷新 Demo（touch + translate）

```html
<div class="wrapper">
  <div class="pull-header">下拉刷新</div>
  <div class="content">内容区域</div>
</div>
```

```css
.wrapper {
  overflow-y: auto;
  height: 100vh;
}

.pull-header {
  height: 60px;
  line-height: 60px;
  text-align: center;
  transform: translateY(-60px);
  transition: transform 0.3s;
}

.wrapper.pull .pull-header {
  transform: translateY(0);
}

.wrapper.loading .pull-header {
  transform: translateY(0);
}
```

```js
const wrapper = document.querySelector(".wrapper");
const header = document.querySelector(".pull-header");

let startY = 0;
let offset = 0;
let pulling = false;
const threshold = 60;

wrapper.addEventListener("touchstart", (e) => {
  if (wrapper.scrollTop !== 0) return;
  startY = e.touches[0].clientY;
  pulling = true;
});

wrapper.addEventListener(
  "touchmove",
  (e) => {
    if (!pulling) return;

    const dy = e.touches[0].clientY - startY;
    if (dy <= 0) return;

    e.preventDefault(); // ⚠️ 必须 passive:false

    offset = dy * 0.5;
    wrapper.style.transform = `translateY(${offset}px)`;

    if (offset > threshold) {
      wrapper.classList.add("ready");
    } else {
      wrapper.classList.remove("ready");
    }
  },
  { passive: false }
);

wrapper.addEventListener("touchend", () => {
  pulling = false;
  wrapper.style.transform = "";

  if (offset > threshold) {
    wrapper.classList.add("loading");
    doRefresh();
  } else {
    reset();
  }
});

function doRefresh() {
  setTimeout(() => {
    wrapper.classList.remove("loading");
    reset();
  }, 1500);
}

function reset() {
  offset = 0;
  wrapper.classList.remove("ready");
}
```

## 七、上拉加载的区别（很重要）

| 下拉刷新        | 上拉加载                                 |
| --------------- | ---------------------------------------- |
| 顶部            | 底部                                     |
| dy > 0          | dy < 0                                   |
| scrollTop === 0 | scrollTop + clientHeight >= scrollHeight |
| header          | footer                                   |

## 八、为什么不用 scroll 事件实现？

❌ scroll 事件：

- 无法阻止默认行为
- 不能精确控制手势
- 无“拉”的感觉

✅ touch：

- 精确控制
- 可加阻尼
- 可定制动画

## 九、iOS / WebView 特别注意事项（⚠️）

### 1️⃣ 必须阻止默认滚动

```js
{
  passive: false;
}
```

### 2️⃣ 防止滚动穿透

- overscroll-behavior
- body fixed

### 3️⃣ iOS 回弹干扰

- 永远以 scrollTop === 0 为准
- 不要用视觉位置判断

## 十、现代替代方案（了解）

| 方案                      | 说明                              |
| ------------------------- | --------------------------------- |
| CSS `overscroll-behavior` | 防穿透                            |
| Pointer Events            | 更统一                            |
| 原生 `<pull-to-refresh>`  | Web 不支持                        |
| 框架封装                  | better-scroll / react-use-gesture |

## 十一、标准总结

- 下拉刷新通常基于 touchstart / touchmove / touchend，
- 在容器滚动到边界时拦截 touchmove，通过手指位移计算一个带阻尼的 translate 位移，
- 当位移超过阈值，在 touchend 时进入 loading 状态并触发刷新；
- 上拉加载逻辑与之对称，关键在于边界判断、阻尼控制和状态管理。
