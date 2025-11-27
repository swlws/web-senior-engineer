# CSFR

CSRF（Cross-Site Request Forgery，跨站请求伪造）是一种劫持用户身份，在用户不知情的情况下，冒充用户向服务器发送请求的攻击方式。

## 一、CSRF 攻击的原理

### ✅ 攻击成立的前提：

- 用户已登录受害网站，并拥有合法 Cookie（如：token, sessionId）。
- 网站通过 Cookie 进行身份验证。
- 网站未做 CSRF 防护。

### 🧨 攻击流程：

- 用户登录了银行网站（受害站），拥有有效的登录态。
- 用户访问攻击者网站，该页面中嵌入了：
  ```html
  <img src="https://bank.com/transfer?to=attacker&amount=1000" />
  ```
- 浏览器会自动带上用户在 bank.com 上的 Cookie 发起请求。
- 转账成功。

## 二、CSRF 攻击示例

```html
<!-- 攻击者构造页面 -->
<html>
  <body>
    <form action="https://example.com/api/delete" method="POST">
      <input type="hidden" name="postId" value="123" />
      <input type="submit" value="点击赢大奖" />
    </form>
    <script>
      document.forms[0].submit(); // 自动提交
    </script>
  </body>
</html>
```

如果用户已登录 example.com，就会触发该操作。

## 三、CSRF 与 XSS 的区别

| 项目     | XSS            | CSRF                         |
| -------- | -------------- | ---------------------------- |
| 本质     | 注入脚本       | 利用用户身份伪造请求         |
| 条件     | 不要求用户登录 | 要求用户登录受害站           |
| 危害     | 执行任意代码   | 伪造敏感操作（如转账、发帖） |
| 防护方式 | 输入输出转义   | Token 校验 / SameSite Cookie |

## 四、防御 CSRF 的常用方式

### ✅ 1. CSRF Token（推荐）

- 每个用户或表单生成唯一的 Token，提交请求时必须带上。
- 服务端验证 Token 是否有效。

前端示例：

```html
<input type="hidden" name="csrf_token" value="abc123" />
```

后端验证：

```js
if (req.body.csrf_token !== session.csrf_token) {
  reject("非法请求");
}
```

> 注意： Token 应设置为一次性或短时间有效。

### ✅ 2. SameSite Cookie 属性

- 设置 Cookie 的 SameSite 属性，限制第三方网站携带：
  ```http
  Set-Cookie: token=abc; SameSite=Strict; HttpOnly; Secure
  ```

| SameSite 值 | 含义                                      |
| ----------- | ----------------------------------------- |
| `Strict`    | 完全禁止第三方携带 Cookie（最安全）       |
| `Lax`       | 允许 GET 请求（如 `<a>` 跳转），阻止 POST |
| `None`      | 完全开放（**必须加 Secure**）             |

### ✅ 3. Referer / Origin 校验（辅助）

- 后端检查请求头：
  ```http
  Origin: https://trusted.com
  Referer: https://trusted.com/form
  ```
- 拒绝来源非本站的请求（易被绕过，不推荐单独使用）。

### ✅ 4. 验证码 / 双重确认（提升攻击成本）

- 增加操作阻力，如转账、删除时必须输入验证码或确认密码。

## 五、前端开发中的建议

| 场景                         | 建议                                           |
| ---------------------------- | ---------------------------------------------- |
| 登录状态                     | 使用 SameSite=Strict Cookie                    |
| 重要操作表单（如删除、转账） | 加 CSRF Token                                  |
| 与后端 API 交互              | 建议采用 JWT + 自定义 Header（非 Cookie 身份） |
| 使用框架                     | 启用框架内置防护（如 Django、Rails、Spring）   |

## 六、判断是否容易被 CSRF 攻击

若你当前的请求满足以下条件：

- 使用 Cookie 作为身份凭证（如浏览器自动携带 session）。
- 后端未校验请求来源（无 Token、无 Referer 校验）。
- 请求是敏感操作（如转账、删除、修改密码）。

就存在被 CSRF 攻击的风险。
