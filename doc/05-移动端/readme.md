# 移动端

## Ⅰ. 移动端适配类

### 1. 屏幕适配

- 设计稿 375 / 750 的换算规则
- REM 适配原理（flexible/lib-flexible）
- VW/VH 适配原理（px → vw 的数学换算）
- rpx（小程序）缩放规则（1rpx = 屏宽/750）
- DPR / 物理像素 / CSS 像素
- iPhone 刘海屏安全区域（safe-area-inset）
- 1px 细线问题及解决方案（transform / pseudo / border-image）

2. 横屏、竖屏检测

- window.orientation / screen.orientation
- resize 方式
- 小程序 onDeviceOrientationChange
- H5 内嵌 WebView 的横竖屏限制

3. 视口 Viewport

- initial-scale 工作机制
- layout viewport / visual viewport / ideal viewport 的区别
- 为什么 iOS 双击会缩放？怎么禁用？
- WebView 中 viewport-fit=cover 的作用

## Ⅱ. 触摸事件类

### 1. 移动端事件模型

- touchstart / touchmove / touchend
- pointer event（现代替代方案）
- click 300ms 延迟的原因（double tap zoom）
- 如何消除 300ms 延迟（FastClick / meta viewport）
- passive listener：为什么要 passive: true

### 2. 滚动穿透（透传）问题

- 原因：非文档流、fixed 元素阻断滚动
- 如何阻止（preventDefault + touch-action）
- iOS overscroll-bounce 反弹处理
- 安卓 WebView 的滚动事件 bug

## Ⅲ. 手势与交互类

- 上拉 / 下拉刷新实现（touch 系列 + 位移）
- 滑动删除（SwipeAction 手势识别）
- 手势库 Hammer.js / better-scroll 原理
- 滚动吸顶（sticky + scrollTop 辅助）
- 长按处理（定时器 + 触摸事件）

## Ⅳ. 键盘与输入框兼容性类

- iOS 输入法遮挡问题
- Android 键盘弹起导致 resize
- 输入框聚焦后页面滚动错乱
- 如何判断键盘弹起（window.innerHeight 变化）
- hybrid 环境键盘引起的高度异常
- input@blur 回弹失败

## Ⅴ. WebView / Hybrid 特殊考点

### 1. JSBridge

- H5 如何调用原生（schema / bridge）
- 原生注入 JS API 的方式（addJavascriptInterface）
- WKWebView 与 UIWebView 的差异
- H5 与 Native 的数据回传机制

### 2. 内嵌 WebView 常见坑

- 状态栏高度适配
- Android WebView 白屏 / 缩放异常
- 滚动不流畅（水波纹、卡顿）
- WKWebView 缓存问题（禁止缓存、清除缓存）
- WebView 点击事件失效（遮罩、z-index）

## Ⅵ. 性能优化（移动端专项）

### 1. 渲染性能

- GPU 加速 transform
- 为什么 translateZ(0) 会触发硬件加速
- 合成层（Compositing Layer）
- 避免 layout thrashing（强制同步布局）
- 动画优化（requestAnimationFrame）

### 2. 加载性能

- 图片懒加载
- WebP、AVIF、动态图片替换策略
- iOS 网络缓存策略差异
- 预加载、预渲染（prefetch、prerender）
- code-splitting（现代 SPA）

## Ⅶ. 移动端网络与缓存

- H5 离线缓存（Service Worker）
- App 内嵌 H5 的缓存策略
- Safari 的缓存策略（特别苛刻）
- 断网降级页面
- WebP/AVIF 的兼容性检测

## Ⅷ. 小程序端相关考点

- rpx 的实现与原理
- 小程序 WebView（内嵌 H5）工作机制
- setData 性能问题
- 小程序渲染层 vs 逻辑层
- CoverView 原理 + 性能问题
- 同层渲染（video 同层渲染机制）
- 小程序侧边返回按钮兼容问题

## Ⅸ. 设备能力与权限

- 地理位置（H5 geolocation）
- 相机、麦克风权限
- 屏幕亮度、震动、加速度、陀螺仪
- 传感器 API（Sensor APIs）
- 如何判断摄像头是否可用

## Ⅹ. 常见移动端 Bug 汇总

- iOS Safari fixed 元素抖动
- 安卓 WebView 不触发滚动事件
- 滚动卡顿（重绘过多）
- 软键盘遮挡
- iOS 选择文本闪烁
- Safari 视频播放必须用户交互
- iPhone 刘海屏遮挡（safe-area）
- 微信浏览器禁止自动播放
