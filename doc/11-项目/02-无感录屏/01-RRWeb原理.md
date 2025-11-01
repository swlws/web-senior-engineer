# RRWeb 原理

RRWeb 的实现原理可以拆分为 录制（record） 和 回放（replay） 两个核心环节。它的目标是把「用户在网页中的操作」转换为 事件流（event stream），存储下来后再在另外一个容器里复现。

## 一、整体流程

- 录制（Record）
  - 监听页面 DOM、样式、输入、鼠标、滚动等变化。
  - 将这些变化序列化成事件对象（JSON）。
  - 按时间顺序保存成事件流。
- 存储与传输
  - 将录制的事件流传输到服务器，或直接存到本地。
  - 通常只存差异（增量事件），避免数据过大。
- 回放（Replay）
  - 在干净的 iframe 或虚拟 DOM 环境中，按时间顺序重建页面。
  - 逐步应用事件，模拟原始用户的操作。

## 二、录制（Record）实现细节

RRWeb 通过 MutationObserver、事件监听器、Hook 等手段捕获网页状态和变化。

### 1. 初始快照

- 利用 document 遍历整个 DOM，序列化成 JSON（称为 full snapshot）。
- 包含节点结构、样式、属性、输入值。

```json
{
  "type": "FullSnapshot",
  "data": {
    "node": { "tag": "div", "attributes": { "class": "app" }, "childNodes": [...] }
  }
}
```

### 2. DOM 变更

- 使用 MutationObserver 监听 DOM 节点的增删改。
- 每次变更转化为 IncrementalSnapshot 事件。

```json
{
  "type": "IncrementalSnapshot",
  "data": {
    "adds": [...],
    "removes": [...]
  }
}
```

### 3. 用户交互

- 监听 click、input、scroll、mouse move、touch 等事件。
- 每个事件被序列化成 {type, timestamp, data} 。
- 例如：

```json
{
  "type": "MouseInteraction",
  "data": { "x": 100, "y": 200, "event": "click" }
}
```

### 4. 样式与属性变化

- 监听 attributeChanged。
- 捕获 CSSOM 变化（styleSheets 变更）。

### 5.输入框内容

- 监听 input、change。
- 保存用户输入的值（但可以配置忽略敏感字段）。

## 三、回放（Replay）实现细节

回放时，RRWeb 创建一个“沙盒环境”（通常是一个 iframe）：

1. 还原初始快照
   - 把 full snapshot 转换成 DOM 节点。
   - 使用虚拟节点 ID 映射表，保证后续变更能找到对应节点。
2. 增量更新
   - 按时间顺序应用 IncrementalSnapshot 事件：
     - DOM 节点插入、删除。
     - 属性更新。
     - 文本/样式更新。
     - 滚动/鼠标移动。
3. 时间控制
   - 内置一个虚拟时钟，保证事件严格按原始时间间隔回放。
   - 可以加速、减速、跳过空闲。
4. 用户交互模拟
   - 在回放 DOM 上派发合成事件，模拟点击、输入等操作。

## 四、关键技术点

- DOM 序列化
  通过遍历 document，把 DOM 转换为 JSON，同时给每个节点分配唯一 ID。
- 高效差量记录
  依赖 MutationObserver，只记录变化，而不是整个 DOM。
- 事件压缩
  对鼠标移动、滚动等高频事件做采样或节流。
- 安全性
  回放在独立的 iframe 内，不影响真实页面。
- 隐私保护
  提供字段掩码（mask）选项，避免录制密码、隐私数据。

## 五、类比

- 录制：像 Git 的 commit（初始状态 + diff）。
- 回放：像 Git 的 checkout（逐步应用 diff，恢复现场）。

## 应用场景

- 用户行为回放：用于排查 bug。
- 埋点替代：精确记录用户真实操作。
- 测试回放：复现测试步骤。
