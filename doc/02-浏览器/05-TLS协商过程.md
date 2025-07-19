# TLS协商过程

TLS（Transport Layer Security，传输层安全协议）协商过程，也称为 TLS Handshake（握手），是客户端与服务器之间在建立安全通信连接之前进行的一系列步骤，用于协商加密算法、交换密钥，并实现身份验证。以下是 TLS 1.2 和 TLS 1.3 两种版本的协商过程对比及详细说明。

## 🧩 一、TLS 协商过程概览

### 🔐 TLS 1.2 协商过程

```text
客户端            ↔             服务器
ClientHello       → 
                                 ←  ServerHello
                                 ←  Certificate
                                 ←  ServerKeyExchange（视情况而定）
                                 ←  ServerHelloDone
ClientKeyExchange →
ChangeCipherSpec  →
Finished          →
                                 ←  ChangeCipherSpec
                                 ←  Finished
```

### 🔒 TLS 1.3 协商过程（更快、更安全）

```text
客户端            ↔             服务器
ClientHello       →
                                 ←  ServerHello
                                 ←  EncryptedExtensions
                                 ←  Certificate（可选）
                                 ←  CertificateVerify（可选）
                                 ←  Finished
Finished          →
```

## 🧾 二、详细说明

### 1. ClientHello

客户端发起 TLS 握手：

- 支持的协议版本（如 TLS 1.3、1.2）
- 支持的加密套件列表（如 TLS_AES_128_GCM_SHA256）
- 随机数（用于密钥生成）
- 可选的扩展（SNI、ALPN、Session Resumption、Key Share 等）

### 2. ServerHello

服务器响应：

- 选择的协议版本
- 选择的加密套件
- 服务器随机数
- 可选扩展确认（如 SNI）

### 3. 证书交换（仅适用于需要身份验证的情况）

TLS 1.2：

- Certificate：服务器发送证书链
- ServerKeyExchange：如果使用临时密钥（如 ECDHE），发送密钥交换信息
- ServerHelloDone：表示服务器结束其握手消息

TLS 1.3：

- EncryptedExtensions：包含 SNI 等信息的扩展
- Certificate（可选）：发送证书（可省略，比如匿名通信）
- CertificateVerify（可选）：验证服务器身份
- Finished：验证握手数据是否一致

### 4. 密钥交换与加密启动

TLS 1.2：

- ClientKeyExchange：客户端发送预主密钥（通常用服务器公钥加密）
- ChangeCipherSpec：开始使用协商好的密钥
- Finished：发送加密校验信息

TLS 1.3：

- 客户端早已发送 KeyShare，握手早已完成密钥协商
- Finished：客户端发送最后的验证消息，完成握手

### 5. 应用数据传输

握手完成后，客户端和服务器即可使用协商出的会话密钥进行加密通信。

## 三、TLS 1.3 相比 1.2 的改进

| 项目       | TLS 1.2            | TLS 1.3             |
| -------- | ------------------ | ------------------- |
| 握手轮次     | 至少 2 次             | 1 次（0-RTT 支持）       |
| 加密算法     | 多种，有些不安全           | 移除不安全算法，如 RC4、SHA-1 |
| 前向安全     | 可选                 | 默认使用 ECDHE，强前向安全    |
| 加密起始     | ChangeCipherSpec 后 | ServerHello 后立即启用   |
| 支持 0-RTT | ❌                  | ✅（有重放风险）            |

## 📌 四、可选扩展（常见）

- SNI（Server Name Indication）：多个域名共享同一 IP 时，客户端提前告诉服务器访问哪个域
- ALPN（Application-Layer Protocol Negotiation）：用于协商 HTTP/2、HTTP/1.1 等协议
- Session Resumption：快速恢复之前会话（节省握手时间）
