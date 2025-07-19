# 浏览器从输入 URL 到页面展示的过程

## 1. 用户输入 URL

- 浏览器地址栏输入 URL，如 `https://www.example.com`
- 可能触发浏览器自动补全、历史记录匹配

---

## 2. URL 解析

- 拆解协议、主机、端口、路径、查询参数、哈希等
- 示例：<https://www.example.com:443/path/index.html?q=123#section>

---

## 3. 检查浏览器缓存（强缓存）

- 优先查找是否存在**强缓存**（如 `cache-control`, `expires`）
- 命中则直接从本地返回，跳过网络请求

---

## 4. DNS 解析

- 将域名 `www.example.com` 转换为 IP 地址
- 解析顺序：
- 浏览器 DNS 缓存
- 系统缓存
- 路由器缓存
- ISP DNS 服务器
- 根域名服务器 → 顶级域 → 权威 DNS

---

## 5. 建立 TCP 连接（三次握手）

- 若是 HTTPS，会继续执行 **TLS 握手**
- 握手完成后，建立加密通信通道

---

## 6. 发起 HTTP 请求

- 构造请求行、请求头、请求体（如 POST）
- 示例请求：

```http
GET /path/index.html HTTP/1.1
Host: www.example.com
```

---

## 7. 服务器处理请求

- Web 服务器接收并处理请求
- 可通过 Nginx、Node.js、Java、PHP 等后端服务
- 返回对应的资源（如 HTML 文档）

---

## 8. HTTP 响应返回

- 状态码（如 200、404）
- 响应头（如 content-type, set-cookie）
- 响应体（HTML、JSON、文件等）

---

## 9. 浏览器解析 HTML（渲染流程）

### HTML 解析（构建 DOM）

- 自上而下构建 DOM Tree

### 资源加载

- 遇到 `<link>` `<script>` `<img>` 开始下载外部资源
- 阻塞行为：
- `<script>` 默认阻塞解析，建议加 `defer` 或 `async`
- CSS 也可能阻塞渲染

### CSS 解析（构建 CSSOM）

- 解析所有样式表，构建 CSSOM 样式对象模型

### JS 执行

- 构建好 DOM 后触发 `DOMContentLoaded`
- 所有资源加载完触发 `load`

---

## 10. 构建渲染树（Render Tree）

- DOM + CSSOM → 渲染树（Render Tree）
- 忽略如 `display: none` 的节点

---

## 11. 布局（Layout）

- 确定每个节点的几何位置与大小

---

## 12. 绘制（Painting）

- 将元素绘制为像素点（图层、颜色、阴影等）

---

## 13. 合成（Compositing）

- 多图层合成，形成最终页面
- 可能由 GPU 加速完成

---

## ⚙️ 优化建议（简述）

- 使用 CDN 靠近用户
- 避免 DNS 重定向
- 压缩资源、缓存策略优化
- 减少 render-blocking 资源
- 利用懒加载、预加载、服务端渲染（SSR）
