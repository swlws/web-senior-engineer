# 资深工程师

## 一、JavaScript 基础与进阶

### 1. 基础知识

- `var`、`let`、`const` 有哪些区别？
- 如何实现防抖和节流？应用场景是什么？
- `==` 和 `===` 的区别，如何安全地做类型判断？
- `this` 的绑定规则有哪些？箭头函数对 `this` 有什么影响？

### 2. 进阶理解

- 原型链与继承机制是怎样的？如何手写继承？
- 如何实现深拷贝？有哪些边界情况？
- 事件循环与宏任务/微任务的执行顺序？
- 如何实现一个简单的 `Promise`？
- ES6+ 新特性有哪些？请列举常用的语法并举例说明。

---

## 二、浏览器与性能优化

### 1. 浏览器原理

- 浏览器从输入 URL 到页面加载完成经历了哪些过程？
- 浏览器中的缓存策略有哪些？`cache-control` 的字段含义？
- 解释一下浏览器的同源策略及跨域解决方案。

### 2. 性能优化

- 页面首次加载性能优化有哪些手段？
- 资源懒加载与预加载的实现方式？
- DOM 性能优化建议？
- 如何做前端性能监控？监控哪些指标？
- 前端性能优化指标（TTFB、FCP、LCP、FID）

---

## 三、框架与工程化

### 1. Vue（或 React）

- 响应式原理（Vue 2 Object.defineProperty / Vue 3 Proxy）
- 虚拟 DOM、diff 算法
- 生命周期、Composition API
- 状态管理方案（Vuex、Pinia / Redux、Zustand）
- 自定义指令、组件通信（props/emit、$attrs、provide/inject）

### 2. React（如适用）

- Hooks 原理、useEffect 工作机制
- Fiber 架构、Reconciliation 算法
- Context、Portal、ErrorBoundary
- 性能优化（memo、useMemo、lazy/suspense）

## 四. 工程化

### 1. Webpack

- 构建流程、热更新原理（HMR）
- 插件机制与 loader 编写
- 模块联邦（Module Federation）
- Tree Shaking、代码分割、懒加载
- Tree-shaking 的原理？什么情况下会失效？
- 性能优化：缓存策略、构建速度优化
- 如何构建一个微前端架构？你使用过哪些方案？

### 2. Vite

### 3. 工程实践

- Git 工作流（Git Flow、PR Code Review）
- CI/CD 流程（如 GitHub Actions、Jenkins）
- 单元测试（Jest/Vitest）、端到端测试（Playwright/Cypress）
- 性能监控（Lighthouse、自研上报方案）

---

## 五、网络与安全

- HTTP1.1、HTTP2、HTTP3 的主要区别？
- TLS 握手过程？HTTPS 的安全原理？
- 前端常见的安全问题有哪些？如何防御？
  - XSS、CSRF、Clickjacking 的防护策略
- 如何处理大文件上传？如何实现断点续传？

---

## 六、算法与编程能力

- 实现一个字符串高亮函数 `splitByHighlight(str, keyword)`？
- 找出数组中和为目标值的两个数？
- 实现一个 LRU 缓存？
- 节点树结构如何深度/广度优先遍历？
- 实现一个带并发控制的请求调度器？

---

## 七、项目设计与系统能力

- 请介绍一个你主导的前端项目？你在其中承担了哪些职责？
- 如何设计一套可复用的组件库？涉及哪些关键点？
- 如何保证大型项目代码质量与可维护性？
- 如何拆分前端模块？你们的 CI/CD 是如何做的？
- 描述一次线上事故的排查过程及经验总结。

---

## 八、软实力与业务理解

- 你如何理解前端在整个技术体系中的定位？
- 如何推动跨团队协作？有没有推动过技术决策？
- 面对产品/设计不合理需求时你如何沟通？
- 你最近一次学习的新技术是什么？如何应用到项目中？
