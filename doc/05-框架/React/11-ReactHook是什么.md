# React Hook 是什么

从“为什么有 Hooks”、“它解决了什么问题”、“它是怎么工作的”、“使用上的关键原则” 这几个维度去看

## 1. 背景：为什么会有 Hooks

在 React 16.8 之前：

- 函数组件 → 只能接收 props、渲染 UI，无状态
- 类组件 → 可以有 state、生命周期、ref，但带来了：
  - this 绑定繁琐（this.handleClick = this.handleClick.bind(this)）
  - 生命周期分散逻辑（例如 componentDidMount + componentDidUpdate 里写相似的副作用处理）
  - 逻辑复用困难（高阶组件 HOC / render props 嵌套地狱）

Hooks 的出现：

- 让函数组件也能有状态、副作用、引用等能力
- 把 UI 与逻辑按功能组织，而不是按生命周期函数切割
- 避免类组件 this 的复杂性
- 更方便逻辑复用（自定义 Hook）

## 2. Hooks 是什么

> Hooks = 一组特殊函数，可以在函数组件中“钩住” React 的内部机制（state、生命周期、context 等）

常用：

- 状态：useState / useReducer
- 副作用：useEffect / useLayoutEffect
- 引用：useRef / useImperativeHandle
- 性能优化：useMemo / useCallback
- 上下文：useContext
- 自定义：组合多个 Hook 封装业务逻辑

## 3. 核心原理（简化版）

React 内部会为每个组件实例维护一个 Hook 调用链表（或者数组）：

- 每次渲染时，React 根据调用顺序一个个匹配之前存储的 Hook 状态
- Hook 本质是闭包 + 状态存储 + 调度
- 不能在条件分支或循环中调用 Hook，因为这样会改变调用顺序，破坏匹配关系

例子（极简模拟 useState）：

```js
let hooks = []; // 保存状态
let i = 0; // 当前 hook 下标

function useState(init) {
  const idx = i;
  hooks[idx] = hooks[idx] ?? init;
  function setState(val) {
    hooks[idx] = val;
    render(); // 重新渲染
  }
  i++;
  return [hooks[idx], setState];
}

function render() {
  i = 0;
  App();
}

function App() {
  const [count, setCount] = useState(0);
  console.log(count);
  // ...
}
```

这里的 hooks[] 就是 React 内部 Fiber 节点上的 hook 状态容器。

## 4. 使用规则（官方两条大法则）

1. 只在最顶层调用 Hook
   - 不要放在 if/for/嵌套函数里，确保每次渲染调用顺序一致
2. 只在 React 函数组件或自定义 Hook 中调用 Hook
   - 不要在普通函数、类组件里用

React 甚至提供了 eslint-plugin-react-hooks 插件来强制执行。

## 5. 怎么理解 Hooks 带来的思维变化

- 从“按生命周期思考” → 变成“按逻辑单元思考”
  例如数据订阅和清理逻辑集中在同一个 useEffect 里，而不是分散到 componentDidMount / componentWillUnmount
- 更容易抽取业务逻辑成自定义 Hook（useFetch、useAuth、useTheme 等）
- 用闭包天然隔离状态，而不是把状态都挂在 this 上

## 6. 小结

一句话理解：

Hooks 就是让函数组件具备“记忆”和“副作用处理”能力的接口，通过调用顺序来匹配状态位置，从而不需要类组件也能写出有状态、可复用、结构清晰的 React 组件。
