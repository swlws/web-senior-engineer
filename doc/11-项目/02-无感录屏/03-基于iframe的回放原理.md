# 基于 iframe 的回放原理

在 RRWeb 回放（replay） 阶段，之所以要用 iframe，是为了保证 安全性 和 隔离性：

- 防止还原出来的 DOM、样式、脚本污染当前宿主页面。
- 可以保证和原始录制时环境接近。

## 1. 创建 iframe 容器

```html
<iframe
  id="rrweb-player"
  style="width:100%;height:500px;border:1px solid #ccc;"
></iframe>
```

在 JavaScript 里获取引用：

```js
const iframe = document.getElementById("rrweb-player");
const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
```

## 2. 初始化 iframe

在开始回放之前，RRWeb 会先写入一个空的 HTML：

```js
iframeDoc.open();
iframeDoc.write("<!DOCTYPE html><html><head></head><body></body></html>");
iframeDoc.close();
```

这样 iframe 内部就有了一个干净的 DOM 树。

## 3. 节点映射（Mirror）

RRWeb 内部有一个 `Mirror（镜像表）`，用来维护 👉「事件流里的虚拟节点 id ↔ 实际的 DOM 节点」。

例如：

```js
const mirror = {
  map: new Map(),
  getNode(id) {
    return this.map.get(id) || null;
  },
  addNode(id, node) {
    this.map.set(id, node);
  },
  removeNode(id) {
    this.map.delete(id);
  },
};
```

在 `回放初始快照`时，RRWeb 会把 JSON 里的节点树递归创建为真实 DOM，并在 mirror 里记录对应关系。

## 4. 应用初始快照

事件流的第一个事件通常是 FullSnapshot，包含整个页面的序列化 DOM。

RRWeb 会把它转回 DOM：

```js
function rebuildNode(snapshotNode, iframeDoc, mirror) {
  let node;
  if (snapshotNode.type === "document") {
    node = iframeDoc;
  } else if (snapshotNode.type === "element") {
    node = iframeDoc.createElement(snapshotNode.tagName);
    for (const [attr, value] of Object.entries(snapshotNode.attributes)) {
      node.setAttribute(attr, value);
    }
    snapshotNode.childNodes.forEach((child) => {
      node.appendChild(rebuildNode(child, iframeDoc, mirror));
    });
  } else if (snapshotNode.type === "text") {
    node = iframeDoc.createTextNode(snapshotNode.textContent);
  }
  mirror.addNode(snapshotNode.id, node);
  return node;
}
```

最后将整个根节点挂到 `iframeDoc.body` 上：

```js
const rootNode = rebuildNode(initialSnapshot, iframeDoc, mirror);
iframeDoc.body.appendChild(rootNode);
```

## 5. 应用增量事件

当遇到 IncrementalSnapshot（DOM 变化、鼠标、输入等）时：

- 找到对应的节点（通过 mirror.getNode(id)）。
- 应用变化：
  - DOM 节点增删：appendChild/removeChild。
  - 属性变化：setAttribute/removeAttribute。
  - 文本变化：textContent 更新。
  - 样式表变化：stylesheet.insertRule/deleteRule。
  - 滚动位置：node.scrollTop = ...。
  - 鼠标移动：用一个高亮层绘制。

这些操作都只会影响 `iframe 内部`的 DOM。

## 6. 时间轴控制

RRWeb 内部有一个“虚拟时钟”，根据事件的 timestamp 控制事件应用的时间间隔：

```js
setTimeout(() => applyEvent(event), event.timestamp - firstTimestamp);
```

这样保证回放时的节奏和录制时一致。
用户也可以调节速度（加速/减速/跳过空闲）。

## 7. 总结

- iframe 容器 → 用来隔离回放页面。
- FullSnapshot → 还原初始 DOM 到 iframe。
- Mirror 表 → 保证增量事件能找到对应节点。
- IncrementalSnapshot → 在 iframe 内应用变化。
- 虚拟时钟 → 控制回放时间。

## 最小可运行 Demo

- [最小可运行 Demo](./demo/iframe-player.html)
