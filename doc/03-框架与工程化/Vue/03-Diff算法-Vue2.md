# Vue2 Diff 算法

Vue 2 的 Diff 算法基于 **双端比较 + 同层比较** 的策略，采用的是优化过的 "**最小化移动**" 的 Patch 策略，核心目标是：**在不引入全量遍历比对的前提下，高效找出 DOM 的最小变更路径**。

## 🧠 Vue2 Diff 算法整体特点

| 特点               | 说明                                      |
| ------------------ | ----------------------------------------- |
| 同层比较           | 只比较同一层级的节点，不跨层              |
| Key 优先匹配       | 利用 key 精确匹配节点                     |
| 双端指针           | 从两端向中间移动比较                      |
| 组件与元素分支处理 | 分别对待组件、元素、文本等不同 vnode 类型 |
| 最少操作原则       | 尽量复用 DOM，最小化新增/删除操作         |

## 🔍 Diff 核心流程简述

以 updateChildren(oldChildren, newChildren) 为核心函数：

```text
初始化4个指针：
oldStartIdx, oldEndIdx, newStartIdx, newEndIdx

每轮比较规则：
1. oldStartVNode vs newStartVNode
2. oldEndVNode vs newEndVNode
3. oldStartVNode vs newEndVNode
4. oldEndVNode vs newStartVNode
5. 以上都不匹配，尝试通过 key 查找移动节点

每轮匹配成功 → patch → 指针前进
匹配失败 → 移动节点 / 创建新节点
```

## 📌 Diff 匹配流程图（简化）

```text
oldChildren:  [a, b, c, d]
newChildren:  [a, c, b, e]

流程：
1. a == a → patch → 指针 ++
2. b != c → keyMap 查找 → 找到 b → 移动 b
3. c == c → patch
4. d 移除，e 添加
```

## 🧩 核心函数详解

updateChildren(oldCh, newCh)

```ts
function updateChildren(parentElm, oldCh, newCh) {
  let oldStartIdx = 0;
  let newStartIdx = 0;
  let oldEndIdx = oldCh.length - 1;
  let newEndIdx = newCh.length - 1;

  let oldStartVNode = oldCh[oldStartIdx];
  let newStartVNode = newCh[newStartIdx];
  let oldEndVNode = oldCh[oldEndIdx];
  let newEndVNode = newCh[newEndIdx];

  while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
    // 1. 前-前
    if (sameVNode(oldStartVNode, newStartVNode)) {
      patchVNode(oldStartVNode, newStartVNode);
      oldStartVNode = oldCh[++oldStartIdx];
      newStartVNode = newCh[++newStartIdx];
    }
    // 2. 后-后
    else if (sameVNode(oldEndVNode, newEndVNode)) {
      patchVNode(oldEndVNode, newEndVNode);
      oldEndVNode = oldCh[--oldEndIdx];
      newEndVNode = newCh[--newEndIdx];
    }
    // 3. 前-后（尾部移动到头部）
    else if (sameVNode(oldStartVNode, newEndVNode)) {
      patchVNode(oldStartVNode, newEndVNode);
      moveDom(oldStartVNode.elm, after(oldEndVNode.elm));
      oldStartVNode = oldCh[++oldStartIdx];
      newEndVNode = newCh[--newEndIdx];
    }
    // 4. 后-前（头部移动到尾部）
    else if (sameVNode(oldEndVNode, newStartVNode)) {
      patchVNode(oldEndVNode, newStartVNode);
      moveDom(oldEndVNode.elm, before(oldStartVNode.elm));
      oldEndVNode = oldCh[--oldEndIdx];
      newStartVNode = newCh[++newStartIdx];
    }
    // 5. 无匹配 → 从 keyMap 找
    else {
      const idxInOld = keyMap[newStartVNode.key];
      if (!idxInOld) {
        createElm(newStartVNode);
      } else {
        const vnodeToMove = oldCh[idxInOld];
        patchVNode(vnodeToMove, newStartVNode);
        moveDom(vnodeToMove.elm, before(oldStartVNode.elm));
        oldCh[idxInOld] = undefined;
      }
      newStartVNode = newCh[++newStartIdx];
    }
  }

  // 多余节点处理
  if (oldStartIdx > oldEndIdx) {
    // new 中还有 → 创建
    addVNodes();
  } else if (newStartIdx > newEndIdx) {
    // old 中还有 → 移除
    removeVNodes();
  }
}
```

## 🎯 Vue2 Diff 的优化点

| 优化点                 | 说明                            |
| ---------------------- | ------------------------------- |
| 同层比较               | 减少不必要的层级遍历            |
| 双端比较 + 移动识别    | 提高性能，适配常见前插/尾插场景 |
| Key 匹配               | 避免全量查找，精准定位          |
| `undefined` 标记已处理 | 避免重复处理 old 节点           |

## 📌 同层比较的局限

Vue 2 的 diff **不支持跨层复用**，如下代码中：

```html
<!-- 更新前 -->
<div><span>A</span></div>

<!-- 更新后 -->
<span>A</span>
```

即使 <span> 是一样的，Vue 也会删除 <div> 全部再重新创建 <span>。

## ✅ 总结一句话

Vue2 的 Diff 算法基于双端比较策略，结合 key 精确匹配，旨在最小化 DOM 操作，是一种「实用主义 + 性能优先」的优化方式。
