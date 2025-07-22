# XSS 攻击

XSS（Cross-Site Scripting，跨站脚本攻击）是 Web 安全中非常常见且严重的一类攻击手段。它通过向网页注入恶意脚本，从而在用户浏览页面时执行攻击者的代码。

## 一、XSS 攻击的分类

### 1. 存储型 XSS（Stored XSS）

- 攻击代码存储在服务器端数据库中，当用户请求页面时被渲染执行。
- 典型场景：
  - 评论、留言板、个人简介等输入内容被存入数据库，页面渲染时未做处理。

### 2. 反射型 XSS（Reflected XSS）

- 恶意脚本通过 URL 参数等立即反射在页面上，没有存储到服务器。
- 典型场景：
  - URL 参数输出到页面内容或 DOM 中，未做过滤。
    ```js
    <!-- 假设页面逻辑将参数 q 输出到页面 -->
    <script>
    const params = new URLSearchParams(location.search)
    const q = params.get('q')
    document.body.innerHTML = '关键词：' + q
    </script>
    ```
    如果用户访问：
    ```js
    http://example.com/?q=<script>alert('XSS')</script>
    ```
    页面会执行脚本弹窗。

### 3. DOM 型 XSS（DOM-Based XSS）

- 攻击脚本不经过服务器，而是直接由客户端 JavaScript 在 DOM 操作中执行。
- 典型场景：
  ```js
  const query = location.search.slice(1);
  document.body.innerHTML = query; // ❌ 会执行 query 中的脚本
  ```

## 二、XSS 的危害

- 窃取 Cookie / Token
- 模拟用户行为（CSRF 联合攻击）
- 伪造页面（钓鱼）
- 控制摄像头、定位权限
- 植入恶意广告、木马脚本

## 三、XSS 防御策略

### ✅ 1. 对用户输入进行转义处理（最重要）

- HTML 转义：将 <, >, &, " 等符号转义：
  ```html
  &lt;, &gt;, &amp;, &quot;
  ```
- 使用前端库进行处理（如 DOMPurify）：
  ```js
  import DOMPurify from "dompurify";
  const safeHTML = DOMPurify.sanitize(dirtyHTML);
  ```

### ✅ 2. 不要使用 innerHTML / document.write

- 使用 safer 替代方式：
  ```js
  const div = document.createElement("div");
  div.textContent = userInput; // 自动转义
  ```

### ✅ 3. 内容安全策略（CSP）

- 通过 HTTP Header 限制脚本来源：
  ```http
  Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted.cdn.com
  ```
- 禁止行内脚本：
  ```http
  Content-Security-Policy: script-src 'self'; style-src 'self' 'unsafe-inline'
  ```

### ✅ 4. 设置 HttpOnly / Secure Cookie

- 防止 XSS 脚本窃取 Cookie：
  ```http
  Set-Cookie: token=abc; HttpOnly; Secure
  ```

### ✅ 5. 框架防护机制

| 框架    | 默认行为                                          |
| ------- | ------------------------------------------------- |
| React   | JSX 自动转义内容（`<div>{userInput}</div>` 安全） |
| Vue     | Mustache 语法 `{{ userInput }}` 会自动转义        |
| Angular | 默认开启模板防注入机制                            |

## 四、实际开发中的建议

| 场景                     | 防御建议                             |
| ------------------------ | ------------------------------------ |
| 用户输入（评论、富文本） | 后端存储前、前端渲染前都应清洗或转义 |
| 动态插入 HTML            | 使用 DOMPurify 等白名单清洗库        |
| 富文本编辑器（如 quill） | 限制上传脚本、标签白名单、后端清洗   |
| 用户上传图片 / 文件      | 检查 MIME 类型、防止脚本伪装         |

## 五、常见 XSS 安全测试方法

- 使用安全扫描工具（如：OWASP ZAP、Burp Suite）
- 手动测试 payload：
  ```js
  <script>alert(1)</script>
  <img src=x onerror=alert(1)>
  <svg onload=alert(1)>
  ```
