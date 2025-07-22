# JWT Token

在请求头中添加 Token 的方式，可以有效防止 CSRF 攻击，原因如下：

## ✅ 为什么使用自定义 Header（如 Authorization）能防止 CSRF？

### 🔐 CSRF 的本质依赖于：

浏览器在跨站请求中会自动携带 Cookie，而不会自动携带自定义的请求头，比如：

```http
Cookie: session=abc123  ✅自动携带
Authorization: Bearer xxx  ❌不会自动携带
```

### 所以：

- 若服务端认证方式不依赖 Cookie，而是依赖 Authorization 头等自定义 Header；
- 浏览器发起 CSRF 请求时（如通过 <img>、<form> 或伪造的 fetch）无法自动加上这个 Header；
- 因此请求根本无法通过身份认证，CSRF 攻击失效 ✅。

## ✅ 示例（安全）

### 前端请求（例如使用 JWT）：

```js
fetch("https://api.example.com/user/delete", {
  method: "POST",
  headers: {
    Authorization: "Bearer <your-jwt-token>",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ userId: 123 }),
});
```

### 后端认证（伪代码）：

```js
const token = req.headers["authorization"]?.replace("Bearer ", "");
if (!verifyJwt(token)) return 401;
```

## ❗ 注意事项

| 点                        | 说明                                                                |
| ------------------------- | ------------------------------------------------------------------- |
| ✅ 不使用 Cookie          | 完全规避了自动携带身份的问题                                        |
| ✅ 身份凭证放在 Header 中 | 浏览器不会自动带上，防止被利用                                      |
| ❗ 仅限 AJAX 请求         | 不能用于 `<a>`、`<form>`、`<img>` 等发起的请求（因为不能加 Header） |
| ❗ 防止 XSS 泄露 token    | token 应保存在 `memory` 或 `sessionStorage`，避免 XSS 时被长期盗用  |
| ✅ 跨域控制               | 搭配 CORS 配置，进一步确保访问来源可信                              |

## 🔐 最安全做法建议：

| 项目       | 建议                                                   |
| ---------- | ------------------------------------------------------ |
| 鉴权方式   | 使用 Token（如 JWT）放在 `Authorization` Header        |
| Token 存储 | **`sessionStorage`**（避免长期存活），或内存中         |
| CORS       | 只允许可信域名发送请求                                 |
| XSS 防护   | 严格转义所有动态渲染内容                               |
| CSRF       | **无需额外 CSRF Token 防护**（因为不会被伪造请求携带） |

## ✅ 结论

> 只要你的服务端认证完全依赖请求头（如 Authorization），不依赖 Cookie，就可以完全避免 CSRF 攻击。
