# React

React 面试考点通常可以从以下几个维度来系统化梳理：基础原理、核心 API、性能优化、工程实践、生态系统、源码机制 等。以下是按模块归类的 React 面试核心知识点清单（附简要说明）：

## 🧠 一、React 基础知识

### 1. React 的核心理念

- React 的声明式编程
- 单向数据流
- Virtual DOM 与 Diff 算法原理
- JSX 的本质（React.createElement）

### 2. React 生命周期（按版本区分）

- React 16 之前的生命周期：componentWillMount、componentWillReceiveProps、componentWillUpdate
- React 16.3+ 新生命周期：
  - 挂载阶段：constructor → getDerivedStateFromProps → render → componentDidMount
  - 更新阶段：getDerivedStateFromProps → shouldComponentUpdate → render → getSnapshotBeforeUpdate → componentDidUpdate
  - 卸载阶段：componentWillUnmount -错误处理：componentDidCatch、getDerivedStateFromError

## 🧩 二、Hooks

### 1. 常用 Hooks 及其原理

- useState、useEffect、useRef、useMemo、useCallback、useContext
- useLayoutEffect 与 useEffect 区别
- useReducer 与 Redux 的对比
- useImperativeHandle 使用场景

### 2. Hooks 使用注意点

- 闭包陷阱
- Hook 依赖项遗漏带来的 bug
- 不可在条件语句中调用 Hook（Hook 的调用顺序必须一致）

## ⚛️ 三、组件系统

### 1. 函数组件 vs 类组件

- 生命周期管理方式不同
- 状态和副作用处理方式不同

### 2. 组件通信

- props 传递
- context 上下文
- 父子通信 / 兄弟通信（中间组件、全局状态）

### 3. 组件设计原则

- 可复用性
- 高内聚、低耦合
- 受控组件与非受控组件

### 4. 高阶组件 HOC / Render Props / 自定义 Hook 比较

## ⚙️ 四、性能优化

### 1. 渲染优化

- React.memo
- useMemo / useCallback
- shouldComponentUpdate / PureComponent
- 避免不必要的 re-render（key 使用不当、props 引用变化）

### 2. 虚拟列表

- react-window、react-virtualized 的使用

### 3. 懒加载

- React.lazy + Suspense
- 代码分割与 webpack 的 dynamic import

## 🏗️ 五、工程实践

### 1. 状态管理

- 本地状态：useState/useReducer
- 跨组件状态：Context API
- 全局状态：Redux / MobX / Recoil / Zustand
- Redux 中间件：redux-thunk、redux-saga 区别

### 2. 表单处理

- 受控 vs 非受控
- 常用库：Formik、react-hook-form

### 3. 路由管理

- react-router v6 新特性
- 动态路由、嵌套路由、路由懒加载

### 4. SSR / CSR / SSG

- React 在 Next.js 中的应用
- 同构渲染原理

## 🧪 六、测试

### 1. React 测试框架

- Jest + React Testing Library
- 测试类型：单元测试、集成测试、E2E

### 2. mock、模拟事件、异步测试

## 🔬 七、源码与底层机制（中高级）

### 1. React Fiber 架构

- 为什么要有 Fiber？
- 调度流程：beginWork → completeWork → commitPhase

### 2. 调和（Reconciliation）机制

- Diff 算法（key 原理）
- 如何提高渲染性能

### 3. setState 的合并与异步更新机制

### 4. Concurrent Mode（并发模式）

- 含义、适用场景、startTransition、useDeferredValue

## 🌐 八、React 生态相关

### 1. UI 组件库

- Ant Design / Material UI / Tailwind 与 React 结合

### 2. 数据请求库

- axios、fetch、SWR、React Query 对比

### 3. 微前端方案

- 与 React 集成：single-spa、qiankun

## 📋 九、常见面试题举例

- React 的 Virtual DOM 是如何工作的？
- setState 是同步还是异步的？
- 你是如何优化 React 项目的性能的？
- useEffect 中的清理函数是做什么的？
- React 中的 key 有什么作用？
- 为什么 useEffect 中不能省略依赖？
- 如何封装一个通用的列表组件？
- 自定义 Hook 怎么避免闭包陷阱？
