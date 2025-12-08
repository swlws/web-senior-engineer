# Cookie Session Token 的演变历程

## 🌐 Session / Cookie / Token 技术演变历程

Web 身份认证技术的演化，本质是为了解决三个核心问题：

1. 如何标识用户状态（身份 / 会话）？
2. 如何安全地在客户端与服务端之间传递状态？
3. 如何支持不断变化的前端架构（SPA、APP、跨端）、分布式后端、第三方登陆等？

下面按年代和技术阶段，完整演变脉络。

## 🕰 1. Cookie 诞生前：HTTP 完全无状态（1995 以前）

HTTP 只会处理请求 → 响应，每个请求之间没有状态。

问题：

- 服务器无法知道“是谁”发的请求
- 无法做登录、购物车等功能

## 🧁 2. Cookie 出现：浏览器首次具有“客户端状态存储”（1995）

Netscape 发明 cookie。

用途：

- 在浏览器持久化少量信息
- 每个请求自动携带到服务器

关键字段：

- `name=value`
- `domain / path`：指定哪些域名下可以访问该 cookie
- `expires / max-age`：过期时间
- `secure（HTTPS only）`：只能在 HTTPS 下发送
- `HttpOnly（不可被 JS 读取）`：防止 XSS 攻击

> 作用：👉 解决“服务器不知道请求来自谁”

## 🔐 3. Server Session + Cookie（1997–2005）

这是 `传统 Web 应用（JSP / PHP / ASP）`时代的标准方案。

流程：

1. 用户登录成功后，服务端生成一个 sessionId
2. 在服务端内存/Redis 中保存 session（用户状态）
3. 将 sessionId 通过 Set-Cookie 发给浏览器
4. 浏览器每次请求自动带上 cookie
5. 服务端根据 cookie 中的 sessionId 找到会话状态

- 服务端存：状态
- 客户端传：sessionId 句柄

优点：

- 超安全（信息不暴露给客户端）
- Session 可控，可主动失效

问题：

- Session 存在服务器上 → 服务端需要 存储压力
- 分布式部署必须 session 共享（Redis、session sticky）
- CSRF 依然可利用 cookie 自动携带

适用：

- 后端模板渲染、单体应用
- 小规模系统

## 🔑 4. CSRF & XSS 安全意识增强（2005–2013）

随着安全事件增加，两类攻击变得显著：

### 4.1 CSRF(跨站请求伪造)

因为 cookie 会 `自动带到任意请求`，导致用户可能被恶意站点“借身份”操作。

对抗方式：

- 三重 Cookie
- `SameSite=lax/strict（Chrome 2017+ 强制化）`
- CSRF Token（隐藏字段）
- Double Submit Cookie

### 4.2 XSS(跨站脚本攻击)

用户信息可能被前端 JS 窃取，于是出现了：

- HttpOnly cookie
- CSP（Content Security Policy）

## 🧬 5. Token 化：无状态服务 / 移动端需求推动（2013–2017）

随着 SPA / Mobile App / 多端 API 接口增多：

- 服务端不再需要存储会话状态
- 客户端负责存储和携带 Token
- 服务端验证 Token 有效性

为什么 Token 出现？

- 多端（Web / App / 小程序）需要同一套认证
- 后端逐渐用 微服务 → Session 共享成本变高
- 支持 跨域、前后端分离 需求高涨
- Cookie 在 App、小程序里不好用

客户端传递方式：

```bash
Authorization: Bearer <token>
```

> Token 的核心理念：👉 让服务器不保存状态，通过签名验证 token 真实性

## 🧾 6. JWT（JSON Web Token）爆火（2014–2020）

JWT 是 token 的具体实现，是一种“自包含状态”的认证方式。

结构：

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "1234567890",
    "name": "John Doe",
    "iat": 1516239022
  },
  "signature": "..."
}
```

性质：

- 无状态（服务端无需 session）
- 可跨域（放在 header）
- 存储方式灵活（localStorage / sessionStorage / cookie）

优点：

- 适合微服务、前后端分离
- 多端统一登录逻辑
- 扩展信息可塞到 payload

缺点：

- token 一旦泄露，期间无法回收
- 过长（header+payload+signature），影响带宽
- 存 localStorage 容易 XSS 被盗

→ 于是出现 Refresh Token 体系。

## 🔁 7. Access Token + Refresh Token（2020–2024）

解决 JWT 不能主动失效问题。设计模式：

| Token 类型        | 存储位置        | 作用                            |
| ----------------- | --------------- | ------------------------------- |
| **Access Token**  | Memory / Cookie | 短期有效（5-15 分钟）           |
| **Refresh Token** | HttpOnly Cookie | 长期有效（7–30 天），换新 token |

流程：

- 客户端拿 Access Token 访问 API
- 若过期 → 用 Refresh Token 换新
- 若 RefreshToken 被盗 → 立即拉黑（服务器存黑名单 / rotate）

现在 OAuth2 / OpenID Connect 也都是这个模型。

优点：

- 安全性大幅提升
- 可部分找回“可控状态”

## 🕊 8. 现代趋势：Session + Token 混合（2023–2025）

目前最安全、最主流的方案是混合模式：

- 前端：
  - Access Token → 内存（受 XSS 限制，不持久化）
  - Refresh Token → HttpOnly + Secure + SameSite=strict Cookie
- 服务端：
  - Refresh Token 存服务端数据库（支持 revoke）
  - Access Token 无状态验证（快速）

优势：

- 避免 JWT 过度膨胀、不可控
- 保留 session 的可控性
- 跨域 + 多端兼容性好
- 默认抵抗 XSS / CSRF 大部分攻击

## 📌 9. 最新趋势（2024–2025）

包括：

### 1）Session Tokenization（服务器签发短期 session token）

结合 session 安全性 + token 灵活性，例如：

- NextAuth v5
- Supabase Auth
- Auth.js

### 2）OAuth2 / PKCE 普及

单页应用推荐：

- OAuth2 + PKCE + Refresh Token Rotation

### 3）双重 Cookie 防御

- Access Token 放 header（不放 cookie）
- Refresh Token 放 HttpOnly Cookie

### 4）WebAuthn / Passkey（无密码）

正在逐步替代密码体系，但仍需要 session/token 绑定。

## 📚 总结：Session / Cookie / Token 演变时间线

```txt
1995   Cookie 发明
1997   Server Session 模型（PHP/JSP 时代）
2005   CSRF / XSS 防御加强
2013   API / APP / 跨端兴起 → Token 流行
2014   JWT 出现并流行
2018   OAuth2 + PKCE 成为 SPA 标准
2020   Access + Refresh 双 Token 成为主流
2023   混合 Session-Token 模式兴起
2024   WebAuthn / Passkey 在无密码场景普及
2025   Secure Hybrid Auth（混合式认证）成为事实标准
```
