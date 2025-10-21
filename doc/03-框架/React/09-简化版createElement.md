# 简化版 createElement

手写一个简化版的 createElement 函数，用来模拟 JSX 最终生成的“虚拟 DOM”结构。

## ✅ 目标

我们希望将如下 JSX：

```jsx
const vnode = createElement(
  "div",
  { id: "app" },
  "hello",
  createElement("span", null, "world")
);
```

转成一个类似这样的虚拟 DOM 结构：

```js
{
  type: 'div',
  props: {
    id: 'app',
    children: [
      'hello',
      {
        type: 'span',
        props: {
          children: ['world']
        }
      }
    ]
  }
}
```

## 🧪 实现一个简化版 createElement

```js
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.flat(),
    },
  };
}
```

> children.flat() 是为了支持嵌套数组（例如 map 渲染的结果）

## 🧩 示例使用

```js
const vdom = createElement(
  "div",
  { id: "container" },
  "Hello, ",
  createElement("span", null, "world!")
);

console.log(JSON.stringify(vdom, null, 2));
```

输出：

```json
{
  "type": "div",
  "props": {
    "id": "container",
    "children": [
      "Hello, ",
      {
        "type": "span",
        "props": {
          "children": ["world!"]
        }
      }
    ]
  }
}
```

## 🔁 补充：如何将虚拟 DOM 渲染为真实 DOM？

你可以手写一个简化版 render 函数：

```js
function render(vnode) {
  if (typeof vnode === "string") {
    return document.createTextNode(vnode);
  }

  const el = document.createElement(vnode.type);

  // 设置属性
  if (vnode.props) {
    for (const [key, value] of Object.entries(vnode.props)) {
      if (key !== "children") {
        el.setAttribute(key, value);
      }
    }

    // 递归渲染 children
    vnode.props.children?.forEach((child) => {
      el.appendChild(render(child));
    });
  }

  return el;
}
```

使用：

```js
const vdom = createElement(
  "div",
  { id: "root" },
  "Hi, ",
  createElement("span", null, "React-like!")
);

document.body.appendChild(render(vdom));
```

## ✍️ 总结

| 功能          | 实现说明                                         |
| ------------- | ------------------------------------------------ |
| JSX 转换      | `createElement(type, props, ...children)`        |
| 虚拟 DOM 结构 | `{ type, props: { ...props, children: [...] } }` |
| 渲染真实 DOM  | 递归生成真实 DOM 节点并挂载                      |
