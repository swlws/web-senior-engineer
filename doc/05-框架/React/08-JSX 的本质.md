# JSX 的本质（React.createElement）

JSX 的本质是：语法糖。它最终会被编译成 React.createElement 调用，因此你写的：

```jsx
<div className="hello">Hello</div>
```

会被 Babel 转换为：

```js
React.createElement("div", { className: "hello" }, "Hello");
```

## 🔧 JSX 转换过程简述

JSX 是 JavaScript 的扩展语法，但浏览器并不识别，需要先通过 Babel 转换为普通的 JS 代码。

### JSX 原始写法：

```jsx
<MyComponent name="Alice">Hi</MyComponent>
```

### 编译结果（React 17 及以前）：

```js
React.createElement(MyComponent, { name: "Alice" }, "Hi")``;
```

> 注意：React 17 以后引入了 新的 JSX 转换机制，可以不用显式引入 React。

## 🧠 React.createElement 签名

```ts
React.createElement(
  type, // string 或组件，如 'div' 或 MyComponent
  props, // 属性对象（含 key、ref）
  ...children // 子元素（可以是文本、JSX、数组）
);
```

### 示例：

```jsx
// JSX 写法
const element = <h1 className="title">Hello, JSX!</h1>;

// 实际调用：
const element = React.createElement(
  "h1",
  { className: "title" },
  "Hello, JSX!"
)``;
```

## 🌳 JSX 与虚拟 DOM

React.createElement() 创建的是一个 React Element（虚拟 DOM 节点）：

```js
{
  type: 'h1',
  props: {
    className: 'title',
    children: 'Hello, JSX!'
  },
  ...
}
```

> 它并不是实际的 DOM 节点，而是用于描述界面结构的数据结构。React 根据这个结构去 diff 和更新真实 DOM。

## 🧪 JSX 是可扩展的

由于 JSX 会变成 createElement(type, props, children)，type 不仅可以是标签名，还可以是函数组件、类组件或自定义构造器。

```jsx
function MyButton(props) {
  return <button>{props.label}</button>;
}

// 实际等价于
React.createElement(MyButton, { label: "Click" })``;
```

## ✅ 总结一句话

JSX 本质是 React.createElement(type, props, children) 的语法糖，最终生成虚拟 DOM。
