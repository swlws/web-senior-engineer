# JSON-RPC

## 一、JSON-RPC 是什么（一句话 + 定位）

> JSON-RPC 是一种基于 JSON 的轻量级远程过程调用协议

它解决的是：

> 在进程 / 服务之间，用“函数调用”的方式通信

JSON-RPC 的核心特征

| 点    | 说明                 |
| ---- | ------------------ |
| 数据格式 | JSON               |
| 通信模型 | Request / Response |
| 调用语义 | 像调用函数              |
| 协议简单 | 规范极小               |

> 👉 MCP 选择 JSON-RPC，本质是：LLM / IDE ↔ Tool Server 的最小可行协议

## 二、JSON-RPC 在你系统里的真实位置

结合你现在的体系：

```txt
Agent
 ↓
MCP Client
 ↓   JSON-RPC
MCP Server
 ↓
Tool / Resource
```

👉 你写的这行代码：

```ts
ctx.rpc.call(toolName, params)
```

> 100% 就是 JSON-RPC 调用

## 三、JSON-RPC 2.0 的完整消息结构

### 1️⃣ Request（请求）

```json
{
  "jsonrpc": "2.0",
  "method": "analyze_project",
  "params": {
    "entry": "src/components/Button.tsx"
  },
  "id": 1
}
```

字段含义：

| 字段      | 必须 | 说明                 |
| ------- | -- | ------------------ |
| jsonrpc | ✅  | 固定 `"2.0"`         |
| method  | ✅  | 方法名                |
| params  | ❌  | 参数（object / array） |
| id      | ❌  | 请求标识               |

### 2️⃣ Response（响应）

```json
{
  "jsonrpc": "2.0",
  "result": {
    "nodes": [],
    "edges": []
  },
  "id": 1
}
```

或错误：

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32601,
    "message": "Method not found"
  },
  "id": 1
}
```

## 四、JSON-RPC 的 4 种调用模式

### 1️⃣ 普通调用（最常用）

```txt
Request → Response
```

### 2️⃣ Notification（无返回）

```json
{
  "jsonrpc": "2.0",
  "method": "log_event",
  "params": { "msg": "build start" }
}
```

📌 没有 id，Server 不能回包, 适合：

- 日志
- 埋点
- 心跳

### 3️⃣ Batch（批量调用）

```json
[
  { "jsonrpc": "2.0", "method": "read_file", "params": {...}, "id": 1 },
  { "jsonrpc": "2.0", "method": "analyze_project", "params": {...}, "id": 2 }
]
```

👉 IDE 场景可以显著减少 IPC 次数。

### 4️⃣ 错误返回（标准化）

| code   | 含义               |
| ------ | ---------------- |
| -32600 | Invalid Request  |
| -32601 | Method not found |
| -32602 | Invalid params   |
| -32603 | Internal error   |

## 五、JSON-RPC vs REST（工程视角）

| 维度      | JSON-RPC | REST |
| ------- | -------- | ---- |
| 调用语义    | 函数       | 资源   |
| schema  | 强        | 弱    |
| 批量      | 原生支持     | ❌    |
| Tool 调用 | ✅        | ❌    |
| LLM 友好度 | 极高       | 一般   |

> 👉 MCP / Agent 场景，JSON-RPC 完胜 REST

## 六、在 MCP 中，JSON-RPC 的“角色分工”

### MCP Server 内部

```ts
const methods = {
  analyze_project(params) {},
  read_file(params) {},
  search_code(params) {}
}
```

JSON-RPC 只是：

> method name → 函数映射

### MCP Client 侧（你用过的）

```ts
async function call(method, params) {
  return rpc.call(method, params)
}
```

> Agent / VSCode 完全不用关心通信细节

## 七、为什么 JSON-RPC 特别适合 Agent

### 1️⃣ 强结构，弱语义

- LLM 不需要理解 HTTP
- 只需生成 { method, params }

### 2️⃣ 天然支持 Tool Calling

```json
{
  "tool": "read_file",
  "input": { "path": "xxx.ts" }
}
```

→ 直接映射 JSON-RPC

### 3️⃣ 易审计、易回放

你可以：

- 记录每一次 RPC
- 重放 Agent 行为
- Debug 决策过程

👉 Agent 可解释性核心手段

## 八、JSON-RPC 在 IDE / MCP 的典型流

```txt
VSCode
 ↓
JSON-RPC
 ↓
frontend-mcp-server
 ↓
Tool
```

- stdio：插件进程
- socket：本地服务
- http：远程 MCP

协议不变，载体可换

## 九、一个典型模式（点评）

```ts
const reducers = {
  [ENUM_TOOL_NAMES.ANALYZE_PROJECT]: (body) => {
    return body.content[0].json
  }
}

export async function ctxRpcCall(ctx, toolName, params) {
  const body = await ctx.rpc.call(toolName, params)
  const handler = reducers[toolName]
  return handler(body)
}
```

这实际上是：

- JSON-RPC transport
- Tool result normalization
- MCP Tool Adapter

👉 这是非常标准、工程质量很高的 JSON-RPC 使用方式

## 十、JSON-RPC 的常见坑（务必注意）

- ❌ params 结构不稳定
- ❌ 用字符串拼 JSON
- ❌ Tool 内抛异常不转 error code
- ❌ id 复用导致错配
- ❌ 超时 / 中断无处理

## 十一、JSON-RPC + Agent 的最佳实践

1. method 名即 Tool 名
2. params 必须有 schema
3. error code 统一封装
4. Agent 只看到 result，不看 transport
5. 记录每一次 RPC 作为 Agent Trace
