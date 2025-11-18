# 为什么 WebComponent 不做 JS 沙箱的设计

从 浏览器架构、规范设计哲学、性能、开发体验、生态兼容性 5 个角度，解释为什么 WebComponent 不会也不能做 JS 沙箱隔离。

## ✅ 为什么 WebComponent 没做 JS 沙箱隔离？

### 1）设计目标不同：WebComponent 是“封装 UI”，不是“隔离执行环境”

Web Components 的核心愿景：

> 以浏览器原生方式实现 UI 组件封装，可与任何框架互操作。

所以它专注：

- 模板封装
- 样式隔离
- DOM Boundary 隔离

而不是：

- JS 权限隔离
- 全局变量隔离
- 安全沙箱隔离
- 多上下文执行环境

这些本来就是 iframe、Worker、Realms 的职责。

- ✔ WebComponent 是 UI 封装模型
- ✘ 不是安全模型，也不是执行环境模型

## 2）JS 沙箱 = 另一个独立的运行时

如果 WebComponent 隔离 JS，那么每个组件就需要：

- 独立的 globalThis
- 独立的 event loop
- 独立的 script context
- 脚本加载策略改变
- 内存管理策略改变

这本质上接近：

- iframe
- Realms（提案）
- JS VM context

这意味着：

> 一个页面里可能有几十个 WebComponent → 就会有几十个小 iframe/小 VM。

浏览器根本承受不起这种开销。

⚠️ 会导致：

- 极高内存占用
- 执行上下文切换开销
- 难以优化的 GC 行为
- 脚本执行性能下降

## 3）JS 沙箱会破坏 Web 的核心互操作性

Web 的哲学是：

> Everything is shareable / interoperable.

所有 Web API（window、document、fetch、customEvent…）都是在同一执行环境里共享的。

如果 WebComponent 沙箱化：

- 全局事件失效
- 外部无法访问组件方法（通常需要）
- 脚本依赖注入困难
- DOM API 无法跨沙箱共享节点
- 框架间协作被破坏（Vue、React 无法操作组件类实例）

这会让 WebComponent 脱离 Web 生态。

例如：

```js
document.querySelector("my-button").click();
```

如果 JS 沙箱化，这种简单用法就完全失效。

## 4）WebComponent 必须让 UI 与宿主环境互动

组件内部经常需要：

- 读取全局状态（如主题、语言）
- 监听全局事件（resize、visibilitychange）
- 调用全局 API（fetch、storage、postMessage）
- 访问 DOM 外部节点（slot 外部内容）

如果 JS 环境隔离，这些都无法成立。

Web Components 会变得“不好用”。

## 5）安全需求已经由 iframe / CSP / Worker 等机制完成

如果你要一个真正的 JS 隔离环境：

| 技术             | 隔离能力                     |
| ---------------- | ---------------------------- |
| iframe + sandbox | ✔ 最高级别隔离               |
| Worker           | ✔ 独立 event loop，不共享 JS |
| Realms（提案）   | ✔ 创建独立 JS VM             |
| WebComponent     | ❌ 不是隔离执行环境          |

浏览器标准已经清晰定义：

- 安全隔离由 iframe / Worker 提供；
- UI 封装由 WebComponent 提供。

避免功能重叠。

## 6）完全 JS 沙箱会让组件无法共享依赖

如果每个 WebComponent 有自己的 JS 环境：

- A 组件加载一次 React
- B 组件再加载一次 React
- C 组件再加载一次 React

页面可能加载十几份 React/Vue/Lit。

前端性能会炸。

现代 WebComponent 能做到：

- 多个组件共享同一个框架运行时
- 外部可以把 utilities 注入组件实例

如果沙箱化 → 这些优势完全没了。

## 7）Shadow DOM 的哲学只是“表层封装”

Shadow DOM 的设计根源来自：

> 浏览器控件（input、select）的内部 DOM、样式被封装但 JS 行为仍在同一环境中。

浏览器控件从来不是独立沙箱：

- `<input>` 内部脚本依然运行在页面 JS 环境
- 只是内部 DOM 对开发者不可见

WebComponent 继承了这套哲学。

## 🎯 最终总结（一句话）

- WebComponent 是 UI 封装工具，不是安全沙箱。
- 它隔离 DOM 和样式，但 JS 必须与页面共享环境才能正常工作、互操作、性能可控。

如果你需要真正隔离 JS：

- 用 iframe（强隔离）
- 用 Worker（独立线程隔离）
- 等未来 Realms（轻量 VM 隔离）
