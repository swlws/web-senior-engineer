# CSS 沙箱的实现方式

在微前端中，CSS 沙箱的目标是让子应用的样式只作用于自身 DOM，避免污染主应用或其他子应用的样式。qiankun 主要有两种实现方式：Scoped CSS（运行时重写选择器） 和 Shadow DOM。

## 1. Scoped CSS（运行时重写选择器）

原理

- 在子应用挂载时，qiankun 会遍历子应用的 <style> 或 <link> 标签里的 CSS 内容。
- 对 CSS 选择器进行前缀重写，将原本全局的选择器限定到子应用容器内。
- 例如，子应用容器为 <div id="subapp-container">：

```css
/* 原始子应用 CSS */
.button {
  color: red;
}

/* 运行时重写后 */
#subapp-container .button {
  color: red;
}
```

这样，.button 样式只会影响子应用 DOM，而不会影响主应用或其他子应用的 .button。

优点

- 兼容性好，所有浏览器都支持
- 简单直接，不需要修改子应用源码

缺点

- 依赖字符串匹配，复杂选择器可能会出现边界问题
- 动态生成的 className 或 CSS-in-JS 需要额外处理

## 2. Shadow DOM

原理：

- Shadow DOM 是浏览器原生提供的 DOM 隔离机制
- 将子应用挂载到 Shadow Root 下，样式只作用在这个 DOM 树中
- 示例：

```js
<div id="subapp-container"></div>

<script>
const container = document.getElementById('subapp-container');
const shadowRoot = container.attachShadow({ mode: 'open' });

// 创建子应用 DOM
const button = document.createElement('button');
button.textContent = 'Click Me';
shadowRoot.appendChild(button);

// 子应用样式
const style = document.createElement('style');
style.textContent = `
  button { color: red; }
`;
shadowRoot.appendChild(style);
</script>
```

这个按钮的样式只会生效在 Shadow DOM 内，不会污染外部 DOM。

优点

- 真正隔离样式，天然不污染
- 可以隔离子应用 DOM 结构，防止全局选择器干扰

缺点

- 兼容性略差（尤其是旧浏览器）
- 与现有第三方库兼容性可能有问题（例如一些依赖全局 CSS 的库）
- SSR 支持复杂

## 3. qiankun 的做法

- 默认使用 Scoped CSS（通过运行时重写选择器），兼容性好
- 对于 Shadow DOM 有需求的项目，可以手动启用
- 核心逻辑：
  1. 获取子应用容器 container
  2. 对子应用所有 <style>/<link> 进行选择器前缀处理
  3. 将 CSS 注入主应用的 DOM 中，但加上前缀确保隔离
  4. 子应用卸载时，删除注入的 CSS

## 总结

| 实现方式       | 隔离粒度     | 优点                 | 缺点                                    |
| -------------- | ------------ | -------------------- | --------------------------------------- |
| **Scoped CSS** | 样式级       | 浏览器兼容好，简单   | 字符串重写可能边界问题，动态 CSS 需处理 |
| **Shadow DOM** | DOM + 样式级 | 真正隔离，天然不污染 | 兼容性差，SSR 和第三方库适配困难        |
