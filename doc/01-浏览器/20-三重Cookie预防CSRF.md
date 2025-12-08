# 三重 Cookie 预防 CSRF

三重 Cookie 是对抗 CSRF 的`最强被动防御之一`（无需后端处理 CSRF Token 的额外字段）。
它结合 SameSite + HttpOnly + Secure + 非 HttpOnly Cookie（双重提交），构成“三重”。

核心是这三个 Cookie：

```txt
1. HttpOnly + Secure + SameSite=Strict/Lax   → 认证 Cookie（sessionId / refresh token）
2. 非 HttpOnly Cookie                         → CSRF Token Cookie
3. Secure                                           → 强制 HTTPS
```

这三者组合起来，抵御了 CSRF 的核心漏洞点。

## 🎯 先复习：CSRF 攻击本质

CSRF 的核心利用点：

1. 攻击者诱导用户发起一个请求
2. 浏览器会自动带上用户的 Cookie
3. 服务端看到 Cookie → 错误地认为是用户本人操作
4. 于是执行了恶意操作（转账、修改密码等）

> 所以：CSRF 要成功 = 需要自动携带认证 Cookie

## 🚧 三重 Cookie 如何阻止 CSRF？

### 🥇 第一重：SameSite Cookie（Strict / Lax）

```txt
Set-Cookie: sessionid=xxx; HttpOnly; Secure; SameSite=Strict
```

SameSite=Strict/Lax 的作用：

> 阻止跨站请求自动携带认证 Cookie

| 场景                                                | 是否带认证 Cookie？ |
| --------------------------------------------------- | ------------------- |
| 用户在 A.com → A.com 发请求                         | ✔ 会带 Cookie       |
| 用户被钓鱼跳转到 B.com，然后 B.com 发起请求到 A.com | ❌ 不会带 Cookie    |
| 攻击者 `<img src="A.com/transfer">`                 | ❌ 不会带 Cookie    |

CSRF 在这里已经被基本阻断。

但是，SameSite 仍有两个问题：

1. SameSite=Lax 允许 GET 导航请求发送 Cookie
2. 某些旧浏览器不支持 SameSite

所以仅靠这一重还不够。

### 🥈 第二重：CSRF Cookie（非 HttpOnly，双重提交）

我们额外设置一个 可被 JS 读取 的 Cookie，比如：

```txt
Set-Cookie: csrf_token=xxx; Secure; HttpOnly=false
```

它的作用是：

> 1. 服务端在响应中设置这个 Cookie
> 2. 前端在发起请求时，从这个 Cookie 中读取值，放到请求头中

这样做的效果是：

> 1. 服务端可以验证请求头中的 Token 是否与 Cookie 中的值匹配
> 2. 若不匹配 → 则认为是 CSRF 攻击

> 注意：这个 Cookie 不能设置 HttpOnly，否则前端无法读取到它的值

### 🥉 第三重：HttpOnly + Secure 强化认证 Cookie

认证 Cookie（sessionId / refresh token）通常为：

```txt
Set-Cookie: sessionId=xxx; HttpOnly; Secure; SameSite=Strict
```

作用：

#### 1️⃣ HttpOnly → 防止 XSS 读取认证 Cookie

即便网站出现 XSS：

- XSS 能读取 csrfToken（因为它是非 HttpOnly）
- 但 XSS 不能读取 sessionId
  → 无法伪造完整登录状态
  → 无法进行“会话劫持”

#### 2️⃣ Secure → 强制 HTTPS

攻击者无法通过中间人攻击（MitM）窃取 Cookie。

#### 3️⃣ SameSite → 强化跨站阻断

再次阻止 Cookie 自动发送。

## 🔐 所以“三重 Cookie”最终实现的是：

| 重数 | Cookie                        | 作用                             |
| ---- | ----------------------------- | -------------------------------- |
| 1    | SameSite Cookie               | 阻断跨站自动发送                 |
| 2    | 非 HttpOnly CSRF Token Cookie | 让客户端参与签名，攻击者无法伪造 |
| 3    | HttpOnly + Secure Cookie      | 防止 XSS + 强制 HTTPS，保护会话  |

三个层次构成互补防御体系：

- 跨站请求 → 无法携带 Cookie（SameSite）或没有 csrfToken（双重提交）
- XSS → 也无法读 sessionId（HttpOnly）
- 网络劫持 → 无法读写任何 Cookie（Secure）

即使一项被突破，还有两项兜底。

## 📌 总结结构图

```txt
用户请求 ──►
           1）SameSite=Strict → 不带 sessionId  → CSRF 失败
           2）无 csrfToken 值 → 签名校验失败
           3）无 HttpOnly session → 会话伪造失败
```

## 🧱 总结

> 三重 Cookie = SameSite 阻自动发送 + 双 Cookie 防伪造 + HttpOnly 防 XSS。
> 就算浏览器自动带 Cookie，攻击者也造不出 Token。
