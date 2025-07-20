# 跨域资源共享 CORS

CORS（Cross-Origin Resource Sharing，跨域资源共享）是浏览器基于同源策略限制跨域请求时，服务器通过设置响应头允许某些跨域请求的一种机制。理解 CORS 的请求流程，需要掌握三种类型：

## 🧩 一、CORS 请求类型总览

| 请求类型      | 是否预检 | 示例                               |
| ------------- | -------- | ---------------------------------- |
| ✅ 简单请求   | 否       | `GET`、`POST`（限定 Content-Type） |
| ✅ 预检请求   | 是       | `PUT`、`DELETE`，或自定义头        |
| ✅ 带凭证请求 | 可能预检 | `withCredentials: true`，带 cookie |

### 🔸 1. 简单请求（Simple Request）

满足所有下列条件的请求称为简单请求：

- 方法是以下三种之一：
  - GET
  - POST
  - HEAD
- Content-Type 限定为以下之一：
  - text/plain
  - application/x-www-form-urlencoded
  - multipart/form-data
- 没有自定义头部（如 X-Token、Authorization）

#### ✅ 流程图

```text
浏览器发起跨域请求
↓
直接发送请求（无 OPTIONS）
↓
服务器响应头中必须包含：
  Access-Control-Allow-Origin: *
或
  Access-Control-Allow-Origin: https://xxx.com
```

#### 📝 注意事项

> ✅ 在浏览器中发起一个简单请求（不触发预检），如果服务端没有设置允许跨域的响应头，浏览器会拦截响应，前端拿不到数据，但服务端是确实收到了请求、也返回了响应。

| 项目                 | 说明                                                  |
| -------------------- | ----------------------------------------------------- |
| 请求是否发出         | ✅ 是的，网络层面正常发出                             |
| 服务端是否响应       | ✅ 是的，响应可能已经返回 200 和数据                  |
| 浏览器是否能读响应体 | ❌ 不能，浏览器阻止前端 JS 读取数据                   |
| 控制台是否报错       | ✅ 是的，显示 CORS 错误信息                           |
| 是否与“简单请求”有关 | ✅ 是，但即便是简单请求也要满足 CORS 响应头才允许读取 |

### 🔸 2. 预检请求（Preflight Request）

如果请求不满足“简单请求”条件，浏览器会先发送一个 OPTIONS 请求进行预检，确认服务器是否允许该跨域操作。

#### ✅ 流程：

```text
1. 浏览器先发送 OPTIONS 请求
   - Origin: 当前网页域
   - Access-Control-Request-Method: 实际请求方法（如 PUT）
   - Access-Control-Request-Headers: 自定义头部列表（如 X-Token）

2. 服务器返回响应头，表明是否允许：
   - Access-Control-Allow-Origin
   - Access-Control-Allow-Methods
   - Access-Control-Allow-Headers

3. 如果允许，浏览器再发送真实请求
```

#### 🔍 示例：

**请求：**

```http
OPTIONS /api/user HTTP/1.1
Origin: https://a.com
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: Content-Type, X-Token
```

**响应：**

```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://a.com
Access-Control-Allow-Methods: GET, POST, PUT
Access-Control-Allow-Headers: Content-Type, X-Token
Access-Control-Max-Age: 86400
```

### 🔸 3. 带凭证请求（Credentials Request）

指跨域请求中携带 cookie、HTTP 认证信息、客户端 SSL 证书等凭证。

需要前后端双方都开启支持：

**✅ 前端设置：**

```js
fetch("https://api.xxx.com/data", {
  credentials: "include",
});
```

**✅ 后端响应头必须显式设置：：**

```http
Access-Control-Allow-Origin: https://a.com   # 不能是 *
Access-Control-Allow-Credentials: true
```

否则浏览器将拒绝接收响应。

## ⚠️ 二、常见响应头说明

| 响应头                             | 说明                                         |
| ---------------------------------- | -------------------------------------------- |
| `Access-Control-Allow-Origin`      | 指定允许的源（不能为多个逗号分隔；动态控制） |
| `Access-Control-Allow-Methods`     | 允许的方法，如 `GET, POST, PUT`              |
| `Access-Control-Allow-Headers`     | 允许的自定义头，如 `X-Token`                 |
| `Access-Control-Allow-Credentials` | 是否允许带 cookie 等凭证                     |
| `Access-Control-Max-Age`           | 预检请求的缓存时间，单位为秒                 |

## ✅ 总结对比

| 类型       | 是否预检 | 能否带 Cookie | 响应要求                                        |
| ---------- | -------- | ------------- | ----------------------------------------------- |
| 简单请求   | 否       | 默认否        | `Access-Control-Allow-Origin`                   |
| 预检请求   | 是       | 默认否        | 需允许方法、头等                                |
| 带凭证请求 | 可能     | ✅ 是         | `Allow-Credentials: true` 且 `Allow-Origin ≠ *` |

## 🎯 附加建议

- 不建议后端写 Access-Control-Allow-Origin: \* 同时允许带凭证
- 对于复杂请求，合理配置 OPTIONS 预检返回值，提高性能
- 配置 Access-Control-Max-Age 可以减少预检请求频率
