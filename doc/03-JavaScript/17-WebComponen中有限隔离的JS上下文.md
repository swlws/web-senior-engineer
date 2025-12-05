# WebComponent 中有限隔离的 JS 上下文

WebComponent 中的 JS 在一定程度上隔离，但不是“完全沙箱隔离”。

## ✅ Web Components 的 JS 隔离性说明

Web Components 包含 3 大特性：

- Custom Elements（自定义元素）
- Shadow DOM（影子 DOM）
- HTML Templates / Slots

其中关于“隔离”最关键的是 Shadow DOM，但 JS 层面的隔离并不是完全封闭。

### ✅ 1. 结构隔离（Strong）

Shadow DOM 会隔离 DOM 结构和样式：

- 外部不能通过 querySelector 直接选中内部 DOM
- 外部 CSS 无法污染内部样式（除非使用 ::part, ::theme）
- 组件内部自己的样式不会污染外部

这是一种强隔离。

### ❗ 2. JS 代码是否隔离？——部分隔离，不是沙箱

❌ 不是隔离的 JS 沙箱

WebComponent 的 JS 代码完全运行在页面全局 JS 环境中：

- 可以访问 window
- 可以访问 document
- 可以访问 cookie
- 可以读写公共变量
- 和其他脚本共享执行上下文

也就是说，你写的 WebComponent 内部 JS 依然与外部同处一个运行环境，并非 iframe 式隔离。

## ✅ 3. 作用域隔离（Scope）——是有的，但有限

组件内部的类方法、变量是属于这个类实例的：

```js
class MyElement extends HTMLElement {
  connectedCallback() {
    this.x = 1; // 私有实例变量
  }
}
```

但这只是 `类/实例作用域`隔离，并不是运行环境隔离。

## 🧩 4. Shadow Root 内部事件有冒泡隔离（可控）

事件在 Shadow DOM 内部：

- 默认会 跨越 shadow 边界继续冒泡（因为 composed: true）
- 如果设置 composed: false → 就不会冒到外部
  → 形成事件级隔离

```js
new CustomEvent("test", { bubbles: true, composed: false });
```

## 🧪 5. 可以实现更强隔离：封闭模式 Shadow DOM

```js
this.attachShadow({ mode: "closed" });
```

结果：

- 外部 JS 无法通过 `.shadowRoot` 获得内部 DOM
- 无法直接注入内部逻辑

但 仍然不能隔离 JS 执行环境。

## 🔥 6. 真正的 JS 沙箱隔离只有 iframe

如果你想：

- 沙箱执行
- 权限隔离
- 跨作用域消息通信
- 独立 window/document

→ 只有 iframe 能做到真正隔离的 JS 环境, WebComponent 做不到。

## 🎯 总结（非常关键）

| 隔离类型         | Web Component 是否隔离     |
| ---------------- | -------------------------- |
| DOM 结构隔离     | ✅ 强隔离                  |
| CSS 隔离         | ✅ 强隔离                  |
| 事件隔离         | ⚠️ 可选（composed）        |
| 属性命名空间隔离 | ⚠️ 部分                    |
| JS 运行环境隔离  | ❌ 完全没有                |
| 安全沙箱隔离     | ❌ 完全没有（iframe 才有） |

## 📌 最终回答一句话

WebComponent 提供 DOM + 样式隔离，但 JavaScript 完全不隔离，依然运行在页面的同一 JS 环境中。
