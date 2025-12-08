# Taro 性能优化

❗ 小程序端渲染瓶颈大多数来自：

- 组件层级过深
- setState 传输数据量大
- 传递函数或大复杂对象
- 列表渲染（最常见）
- 频繁触发小程序事件（scroll、touch 等）

## 1. 减少无效渲染（render 优化）

### ✔ 使用 React.memo / memo

避免父组件更新导致子组件重复渲染。

```tsx
const Item = React.memo(({ data }) => {
  return <View>{data.title}</View>;
});
```

### ✔ 使用 useMemo / useCallback

尤其是长列表、复杂组件。

```tsx
const listNode = useMemo(() => {
  return list.map((i) => <Item key={i.id} data={i} />);
}, [list]);
```

## 2. 避免大对象 setState（小程序端尤其重要）

小程序端每次 setState → diff → setData，传输量过大会卡。

### ✔ 分片更新

```tsx
const onChangeName = () => setState((prev) => ({ ...prev, name: "xxx" }));
```

### ✔ 合并 setState

```tsx
setState({ a: 1 });
setState({ b: 2 });
// ❌ 多次 setData，影响性能

setState({ a: 1, b: 2 });
// ✔ 更佳
```

## 3. 长列表优化（Taro 决定性能的关键点）

### ✔ 使用 Taro 官方 虚拟列表（VirtualList）

```tsx
import { VirtualList } from "@tarojs/components-advanced";

<VirtualList
  height={600}
  itemSize={80}
  itemCount={list.length}
  renderItem={({ index }) => <Item data={list[index]} />}
/>;
```

注意点：

- 必须固定 item 高度
- 不支持 flex 子内容变化
- 小程序端效果好，H5 效果一般但可用

## 4. 避免匿名函数下发到小程序 setData

小程序无法序列化函数，会导致：

- diff 失败
- 频繁更新
- 性能抖动

❌ 不推荐

```tsx
<View onClick={() => doClick(id)}></View>
```

✔ 推荐：提前声明

```tsx
const onClick = useCallback((id) => {...}, [])
<View onClick={() => onClick(id)}></View>
```

虽然仍有匿名函数，但作用域变浅，不会把整个组件方法打进 data。

## 5. 减少 props 传递（小程序端会被序列化）

避免传递大对象、大数组。

✔ 推荐

```tsx
<Item id={id} title={title} />
```

❌ 不推荐

```tsx
<Item bigObject={complexObject} />
```

## 6. 避免频繁 setState（小程序 diff 开销大）

✔ 节流 / 防抖

```tsx
const onScroll = useThrottle((e) => {...}, 100)
```

## 7. 使用 Taro 原生 API 替代 JS 重计算（特别是布局）

例如读取屏幕、位置信息，使用 `taro.getSystemInfo`、`createSelectorQuery`。

可以避免：

- 宽高反复计算
- 依赖 DOM 的逻辑产生抖动

## 8. 减少图片渲染成本

- ✔ 使用小尺寸、webp（H5）
- ✔ 合理设置 lazyLoad
  ```tsx
  <Image src={url} lazyLoad />
  ```
- ✔ 使用裁剪尺寸（小程序云）
  避免一次下载过大的图片。

## 9. 按需加载（动态 import）

```tsx
const Heavy = React.lazy(() => import("./heavy"));
```

减少首屏包体积。

## 10. H5 端性能优化

- ✔ 使用 `Webpack splitChunks`
- ✔ `tree-shaking + sideEffects` 配置
- ✔ 长列表使用 `react-window`
- ✔ 使用 requestIdleCallback 做非紧急逻辑

## 11. 小程序增量渲染优化

- ✔ 使用 `style="visibility: hidden"` 代替 v-if 式频繁卸载
- ✔ 减少组件嵌套层级
- ✔ 合理使用 `cover-view` 避免滚动卡顿

## 12. 避免 PageMeta 过多实时更新

PageMeta 写法错误会导致频繁重渲染。

✔ 推荐：

```tsx
<PageMeta backgroundColor="#fff" />
```

❌ 不推荐：

```tsx
<PageMeta backgroundColor={dynamicColor} />
```

## 13. 分包（小程序）

```tsx
// app.config.js
subpackages: [
  {
    root: "pkgA",
    pages: ["index/index", "detail/detail"],
  },
];
```

效果：

- 减少主包体积
- 首屏加载速度快

## 14. 使用异步渲染能力（H5）

设置 concurrent features：

```tsx
export default defineConfig({
  react: {
    mode: "concurrent",
  },
});
```
