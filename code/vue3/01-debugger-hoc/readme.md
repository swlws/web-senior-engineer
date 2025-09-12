# Vue3 组件debugger render 函数

## 1. 原始组件 MyButton.vue

```js
export default {
  props: {
    label: String,
  },
  setup(props) {
    return () => <button>{props.label}</button>;
  },
};
```

## 2. 包裹 HOC

```js
import { withHoc } from './hoc';
import MyButton from './MyButton.vue';

const DebugButton = withHoc(MyButton, {
  debug: true,
  defaultSlot: '默认按钮内容',
});

export default {
  components: { DebugButton },
  setup() {
    const state = reactive({ label: 'Click Me' });

    return () => (
      <DebugInput
        modelValue={state.value}
        onUpdate:modelValue={(val) => (state.value = val)}
      />
    );
  },
};
```

## ✅ 功能亮点

- props/slots diff 自动打印，调试方便
- 事件自动透传
- 支持默认 slot
- 兼容函数式组件和普通组件
- 完全 JSX/h() 支持
