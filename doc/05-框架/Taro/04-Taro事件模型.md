# Taro 事件模型

> 为什么 Taro 需要事件系统？

Taro 的核心是：用 React/Vue 写代码，运行在小程序（WXML）中。

但小程序本身的事件系统和 DOM/React 完全不一样，因此 Taro 需要一套「桥接」系统：

```txt
小程序事件 ——> Taro 事件桥接 ——> 虚拟 DOM ——> 组件实例
```

## 1. Taro 事件模型的核心设计

### (1) 事件统一分发（Unified Event Dispatcher）

小程序原生事件触发时，Taro 并不会直接调用组件的事件回调，而是：

1. 小程序事件触发（tap / input / scroll）
2. Taro 注册的统一 eventHandler 接收到事件
3. Taro 解析事件对象
4. 通过虚拟 DOM 树定位到对应组件
5. 调用该组件的 onClick/onChange 等回调

- ✔ 这样能让事件逻辑和 React/JSX 写法保持一致
- ✔ 但也会导致事件路径查找、虚拟 DOM 定位的性能消耗

## 2. Taro 事件对象结构（TaroEvent）

Taro 会将事件对象标准化：

```ts
interface TaroEvent {
  type: string;
  detail: any;
  target: { id: string };
  currentTarget: { id: string };
  preventDefault: () => void;
  stopPropagation: () => void;
}
```

和 React 的 SyntheticEvent 类似，但是：

| 项                           | React        | Taro                              |
| ---------------------------- | ------------ | --------------------------------- |
| 事件对象是否池化             | 已移除       | 否                                |
| 是否异步处理                 | 是（批处理） | 不是                              |
| stopPropagation 是否冒泡控制 | 完整模拟     | 小程序层不支持，Taro 在 JS 层模拟 |

## 3. 与小程序原生事件的差异

| 能力                       | 小程序原生         | Taro                                  |
| -------------------------- | ------------------ | ------------------------------------- |
| 冒泡与捕获                 | 原生支持           | Taro 完全模拟                         |
| 自定义事件（triggerEvent） | 支持               | 通过 `onXXX` 形式接收，依赖 Taro 桥接 |
| 事件绑定方式               | bindtap / catchtap | onClick                               |
| 事件对象                   | 原始结构           | Taro 统一封装                         |

## 4. Taro 事件冒泡机制（重点）

⚠ 小程序不支持 DOM 那样的事件冒泡树
⚠ Taro 通过「虚拟 DOM 树」模拟冒泡

流程图：

```txt
事件触发 -> Taro eventHandler
           -> 找到组件节点
             -> 调用该组件的事件回调
               -> 若未 stopPropagation
                 -> 找父节点
                   -> 调用父节点回调 ...
```

这导致两个结果：

- ✔ 好处
  - 兼容 React 的 onClick/onChange 习惯
  - 可以使用事件冒泡减少重复绑定
- ✘ 坑点
  - 冒泡路径不是小程序真实路径
  - 有性能损耗（虚拟 DOM 查找）

## 5. 使用 Scene：Taro 事件模型的常见坑

### 🧨 坑 1：事件回调找不到组件实例

出现报错：

```bash
Cannot read property '__handlers' of undefined
```

原因, 虚拟 DOM 被更新，事件 id 失效，需要确保：

> ❗ 事件绑定不能使用匿名函数生成新的闭包 ID

例如错的：

```jsx
<View onClick={() => handleClick()} />
```

✔ 正确写法：

```jsx
const handleClick = useCallback(() => {...}, []);
<View onClick={handleClick} />
```

### 🧨 坑 2：stopPropagation 不生效

原因：小程序原生事件无法阻止冒泡，Taro 只能在 JS 层模拟。

写法没错，但仍然触发父事件：

```jsx
<View onClick={childClick} />
<View onClick={parentClick} />
```

✔ 正确用法：

```jsx
<View
  onClick={(e) => {
    e.stopPropagation();
    childClick();
  }}
/>
```

### 🧨 坑 3：scroll / input 大量触发导致卡顿

因为事件桥接有性能成本：

✔ 推荐：

- scroll 使用 throttling
- input 使用受控组件优化
- 避免在事件中 setState 大量触发

## 6. Taro 事件系统 vs React 事件系统

| 维度         | Taro                       | React        |
| ------------ | -------------------------- | ------------ |
| 底层机制     | 虚拟 DOM 映射 + 小程序事件 | DOM 事件委托 |
| 冒泡         | JS 模拟                    | 浏览器原生   |
| 事件池化     | 无                         | 旧版本池化   |
| 性能         | 虚拟 DOM 查找成本更高      | 通常更快     |
| 事件绑定位置 | 组件属性                   | 对应 DOM     |

## 7. 与原生小程序事件模型对比

| 项           | 原生小程序 | Taro          |
| ------------ | ---------- | ------------- |
| 事件写法     | bindtap    | onClick       |
| 冒泡/捕获    | 原生支持   | JS 模拟       |
| 事件查询路径 | BT 解析    | Taro 虚拟 DOM |
| 性能         | 更快       | 有开销        |

## 8. 最佳实践（Production Ready）

### ① 永远不要写匿名回调

❌：

```jsx
<View onClick={() => doSomething(id)} />
```

✔：

```jsx
const onClick = useCallback(() => doSomething(id), [id]);
<View onClick={onClick} />;
```

### ② 尽量减少深层组件的事件冒泡

因为冒泡是「虚拟树」查找，有成本。

✔ 使用 capture 事件：

```jsx
<View onClickCapture={...} />
```

### ③ 高频事件必须防抖 / 节流

scroll、touchmove 是桥接性能最差的事件。

### ④ 优先用 Taro 内置组件的 onXxx，不要绑定在 onTouchStart 等低级事件上

## 9. 一份漂亮的「事件模型总结图」

```txt
小程序原生事件
        |
        v
 +------------------+
 | Taro eventHandler|
 +------------------+
        |
  标准化事件对象
        |
        v
虚拟 DOM 节点匹配
        |
        v
调用组件绑定的事件回调
        |
        v
  若未 stopPropagation
        |
        v
父节点回调 ...
```
