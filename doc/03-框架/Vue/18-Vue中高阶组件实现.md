# Vue中高阶组件实现

## Vue2 实现

```js
export default function createHOC(WrappedComponent, options = {}) {
  return {
    name: `HOC_${WrappedComponent.name}`,

    props: WrappedComponent.props,

    render(h) {
      return h(WrappedComponent, {
        props: this.$props,
        attrs: this.$attrs,
        on: this.$listeners,
        scopedSlots: this.$scopedSlots
      })
    }
  }
}
```

## Vue3 实现

```js
// withWrapper.ts
import { h, defineComponent } from 'vue'

export default function withWrapper(WrappedComponent) {
  return defineComponent({
    name: `WithWrapper_${WrappedComponent.name || 'Component'}`,

    inheritAttrs: false, // 让 attrs 正确透传

    setup(props, { attrs, slots, emit }) {
      return () => {
        return h(WrappedComponent, {
          ...attrs,
          ...props,
          on: emit, // 事件透传（Vue3 已合并到 attrs 内，但这样更清晰）
        }, slots)
      }
    }
  })
}
```
