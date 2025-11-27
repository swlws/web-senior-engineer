# README

## 新的 JS API

- 对象
  - structuredClone 深拷贝对象
  - FinalizationRegistry 对象被 GC 时执行回调
  - WeakRef 弱引用对象
- 异步与定时器
  - queueMicrotask 微任务队列
  - AbortController / AbortSignal 取消异步操作
- 模块化与动态加载
  - import 动态导入 ES 模块
  - import.meta.url 模块的 URL
- 浏览器
- 浏览器 API
  - IntersectionObserver、ResizeObserver、MutationObserver
  - Clipboard API
  - StorageManager.estimate() 获取存储配额信息
    - navigator.storage.estimate()
- 文件系统
  - openFile
- cookie
  - cookieStore
