# Taro 自定义高度方案

Taro 动态计算高度（含自定义导航栏）+ auto 填充 ScrollView 剩余高度 的最佳实践方案。

适用于以下场景：

- 自定义导航栏（高度未知：因机型不同而不同）
- 小程序顶部状态栏 + 导航栏组合高度不确定
- 页面顶部内容高度动态变化
- 期望 ScrollView 动态填满剩余空间

## 方案 1：最推荐 — 使用 useRef + getBoundingClientRect 动态测量顶部高度

这种方案适用于：

- ✔ 任意动态内容
- ✔ 自定义导航栏
- ✔ 多端通用（小程序/H5）

### 示例代码

```tsx
// index.tsx
import { View, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useRef, useState } from 'react'
import './index.scss'

export default function Page() {
  const headerRef = useRef<any>(null)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const query = Taro.createSelectorQuery().in(this)

    query
      .select('#header')
      .boundingClientRect((res) => {
        const windowHeight = Taro.getSystemInfoSync().windowHeight
        const scrollHeight = windowHeight - res.height
        setHeight(scrollHeight)
      })
      .exec()
  }, [])

  return (
    <View className="page">
      <View id="header" ref={headerRef} className="header">
        这里是自定义导航栏 / 顶部内容
      </View>

      <ScrollView
        style={{ height: `${height}px` }}
        scrollY
      >
        {Array.from({ length: 40 }).map((_, i) => (
          <View key={i} className="item">Row {i}</View>
        ))}
      </ScrollView>
    </View>
  )
}
```

```scss
// index.scss
.page {
  height: 100vh;
}

.header {
  background: #eee;
  padding: 20px;
}

.item {
  padding: 20px;
  border-bottom: 1px solid #ddd;
}
```

## 方案 2：获取小程序状态栏高度 + 自定义导航栏高度

当你的顶部部分是：

- 状态栏（不同机型高度不同）
- 自定义导航栏（固定如 44px）

可以用 getSystemInfo 组合计算。

完整示例：自定义导航栏 + ScrollView 剩余高度

```tsx
// index.tsx
import { View, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useMemo } from 'react'
import './index.scss'

export default function Page() {
  const systemInfo = Taro.getSystemInfoSync()

  const statusBarHeight = systemInfo.statusBarHeight || 20 // 状态栏高度
  const navBarHeight = 44  // 自定义导航栏高度（自己定）
  const headerHeight = statusBarHeight + navBarHeight

  const scrollHeight = systemInfo.windowHeight - headerHeight

  return (
    <View className="page">
      <View
        className="custom-nav"
        style={{ paddingTop: `${statusBarHeight}px`, height: `${headerHeight}px` }}
      >
        自定义导航栏
      </View>

      <ScrollView
        className="scroll"
        style={{ height: `${scrollHeight}px` }}
        scrollY
      >
        {Array.from({ length: 40 }).map((_, i) => (
          <View key={i} className="item">Row {i}</View>
        ))}
      </ScrollView>
    </View>
  )
}
```

```scss
// index.scss
.page {
  height: 100vh;
}

.custom-nav {
  background: #fff;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.scroll {
  background: #fafafa;
}

.item {
  padding: 20px;
  border-bottom: 1px solid #eee;
}
```

## 方案 3（增强版）：实现一个通用 hook：useScrollViewHeight()

如果你多个页面都需要这个逻辑，可以封装一个 hook：

```ts
// hooks/useScrollViewHeight.ts
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'

export function useScrollViewHeight(selector: string) {
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const sys = Taro.getSystemInfoSync()
    const query = Taro.createSelectorQuery()

    query
      .select(selector)
      .boundingClientRect((res) => {
        if (res) {
          setHeight(sys.windowHeight - res.height)
        }
      })
      .exec()
  }, [selector])

  return height
}
```

组件使用

```tsx
const height = useScrollViewHeight('#header')

<ScrollView style={{ height }} scrollY></ScrollView>
```

## 🎯 总结

| 场景                    | 推荐方案                         |
| --------------------- | ---------------------------- |
| 顶部高度会动态变化             | ⭐ 方案 1（boundingClientRect）   |
| 自定义导航栏 + 状态栏，顶部高度固定组合 | ⭐ 方案 2（getSystemInfo + 固定高度） |
| 多页面复用                 | ⭐ 方案 3（hook）                 |
