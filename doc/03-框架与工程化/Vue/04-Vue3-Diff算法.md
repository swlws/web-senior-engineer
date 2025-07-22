# Vue3 Diff 算法

Vue 3 的 Diff 算法相比 Vue 2 进行了 全面优化和重写，其核心依然是基于同层对比的 Virtual DOM diff，但在关键步骤中引入了更高效的策略，例如：

- 使用 最长递增子序列（LIS） 优化最小移动路径
- 更精准的 Fragment、Teleport 等类型处理
- 更彻底地利用 patchFlag 静态标记提升性能

## 🆚 Vue 3 与 Vue 2 Diff 差异概览

| 特性          | Vue 2          | Vue 3                       |
| ------------- | -------------- | --------------------------- |
| 对比策略      | 双端比较 + key | 双端比较 + key + LIS        |
| Patch 标记    | 无             | 有 patchFlag 静态提升       |
| Fragment 支持 | 无             | 支持 Fragment               |
| Teleport 支持 | 无             | 支持 Teleport               |
| 静态提升      | 无             | 静态节点不参与 diff         |
| 类型结构      | `VNode`        | `BlockTree`（带 patchFlag） |

## 🔁 Vue 3 Diff 核心逻辑简化流程

以 patchKeyedChildren(oldChildren, newChildren) 为主：

### 🔹 1. 同层双端比较（与 Vue2 类似）

- 从头部和尾部开始尝试匹配（优化开头/结尾插入等常见情况）

```ts
while (i <= e1 && i <= e2) {
  if (isSameVNode(oldChildren[i], newChildren[i])) {
    patch(oldChildren[i], newChildren[i]);
    i++;
  } else {
    break;
  }
}
```

### 🔹 2. 处理剩余新增或删除节点

```ts
if (i > e1) {
  // old 节点用完，剩余 new 节点 → 插入
} else if (i > e2) {
  // new 节点用完，剩余 old 节点 → 删除
}
```

### 🔹 3. 中间区域对比：构建映射表 + LIS 识别最少移动路径

```ts
// 1. 构建 newChildren 中间段的 key -> index Map
const keyToNewIndexMap = new Map();

// 2. 遍历 oldChildren，查找是否在 new 中出现
// 3. 出现 → patch；未出现 → remove
// 4. 生成一个新数组 newIndexToOldIndexMap 记录位置匹配

// 5. 使用 LIS 算法找出不需要移动的最长序列
// 6. 其余节点：需要移动
```

📌 LIS（Longest Increasing Subsequence）优化移动顺序

- 如果某些节点顺序未变，不应移动 DOM
- 利用 LIS 得出最长不需要动的位置，其他的再移动

## 📌 举例说明：使用 LIS 优化移动节点

```js
// old:    [a, b, c, d]
// new:    [d, b, a, c]

→ 比对后发现 b、c 在相对位置未变 → 是 LIS
→ a、d 需要移动
→ Vue 3 会精准移动 a、d，复用 b、c
```

## 🚀 静态提升与 Patch Flag

Vue 3 编译器阶段会对模板做静态分析并生成 patchFlag，如：

```ts
vnode.patchFlag = TEXT | CLASS | STYLE;
```

在运行时 diff 时会跳过未标记的部分，极大减少对比开销。

## 🧱 Fragment、Teleport、Suspense 的支持

Vue 3 允许一个组件返回多个根节点（Fragment），因此 diff 也支持 连续片段节点对比。

- Fragment：diff 时连续多个节点整体 patch
- Teleport：处理渲染位置不在父节点下的 VNode
- Suspense：对异步组件加载进行挂起控制

## ✅ 总结一句话

> Vue 3 的 Diff 算法不仅继承了 Vue 2 的优秀策略，还通过编译期标记（patchFlag）与运行时最小移动路径（LIS）优化，实现了更快、更智能的更新机制，适配更多现代前端特性（如 Fragment、Teleport）。
