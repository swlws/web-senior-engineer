# Node.js 中 VM 的实现原理

## 🧠 一、Node.js vm 到底是什么？

vm 是 Node.js 提供的内置沙箱执行环境，用于在独立的上下文（Context）中运行 JavaScript 代码。

它的作用类似：

- 提供一个"伪隔离"的 JS 运行环境
- 可自定义全局对象
- 可执行字符串脚本
- 可作为脚本执行引擎（简单版 V8 Context）

它本质上是对 V8 原生 API：`v8::Context` 的封装。

## 🧩 二、底层实现原理（重点）

### 1. 基于 V8 Context

Node 通过 V8 提供的 v8::Context 创建独立的上下文环境：

```cpp
v8::Isolate* isolate;
v8::HandleScope handle_scope(isolate);
v8::Local<v8::Context> context = v8::Context::New(isolate);
```

每个 Context 包含：

| 内容                 | 说明                            |
| -------------------- | ------------------------------- |
| Global Object        | 当前上下文的全局环境            |
| Built-in Objects     | 如 Object、Array、Date、Promise |
| 执行环境的变量作用域 | 独立作用域，与外层 JS 不共享    |

> ❗ 这些 Context 之间是隔离的，但共享同一套底层 V8 Runtime（同一 Isolate）。

因此隔离程度 `比 Worker 弱得多`。

### 2. vm.Script

vm.Script 会把 JS 源代码编译成 V8 的内部 bytecode：

```cpp
v8::ScriptCompiler::Compile(...)
```

并缓存编译结果，重复执行更快。

> 注意：它只有编译 & 执行能力，不提供安全隔离。

### 3. 作用域链隔离

执行脚本时，Node 会将用户提供的 sandbox 对象变成 Context 的 global：

```js
vm.createContext(sandbox);
// sandbox => 等同于 context.global
```

执行时 V8 会使用该 Context 的作用域链：

```txt
User Script
  ↑
Context global
  ↑
V8 built-ins
```

### 4. 隔离不彻底（面试常问！）

为什么说不是真沙箱？

- ✔ 全局分离
- ✔ 作用域链分离
- ❌ 共享同一 Isolate，所以仍然可以攻击原型链

例如：

```js
vm.runInContext("Object.prototype.hacked = true", sandbox);
```

会污染宿主环境！

> 原因：所有 Context 都共享同一个 Object.prototype（底层同一套 built-ins）。

所以 Node 官方说：

> vm is NOT secure for running untrusted code.

### 5. 原型污染风险（核心）

这是最典型的 vm 安全漏洞：

```js
vm.runInContext(
  `
  this.constructor.constructor('return process')().exit()
`,
  sandbox
);
```

为什么能逃脱？

> 因为：Function('code') 会逃出 context，进入宿主 context。

Node 为了防止这个攻击，在不同版本做了 patch，例如：

- 屏蔽 Function 构造器
- 限制 Error.prepareStackTrace
- 尝试冻结部分原型

但总的来说，`依然不安全`。

## 🏗 三、vm 与 vm2 的差异

| 特性                        | vm                    | vm2                               |
| --------------------------- | --------------------- | --------------------------------- |
| 隔离级别                    | 低，非安全            | 高得多                            |
| 是否独立 built-ins          | 否，所有 context 共享 | 是，自行构建 JS runtime           |
| 能否防原型污染              | 不行                  | 大部分情况能防                    |
| 是否使用 Proxy/Handler 隔离 | 否                    | 是                                |
| 能否执行不可信代码          | 不推荐                | 更安全但仍有漏洞                  |
| 实现方式                    | 封装 V8 Context       | 创建伪 JS Runtime + Proxy Sandbox |

vm2 本质是：

- 用 Proxy + whitelist 重写所有 JS API
- 模拟一个几乎隔离的世界

但 vm2 在 2023–2024 被爆出 10+ 次严重 escape 漏洞，已宣布不再维护。

## 🛠 四、vm 的使用方式 (内部流程)

示例：

```js
const vm = require("vm");

const sandbox = { a: 1 };
vm.createContext(sandbox);

vm.runInContext(
  `
  b = a + 1
`,
  sandbox
);

console.log(sandbox.b); // 2
```

执行流程：

1. 创建新的 V8 Context → context
2. 把 sandbox 变成 context.global
3. 用 Script 编译代码
4. 在 context 内执行并返回值

内部大致等价：

```cpp
script->Run(context);
```

## 🔥 五、vm 的典型使用场景

1. 模板引擎（eval 替代）

例如早期的 jade、handlebars 会用安全版本 vm 执行模板表达式。

2. 插件系统（插件隔离）

运行三方插件避免访问宿主变量。

3. 动态代码执行（DSL）

如：

- 公式计算（电商促销：`price * discount`）
- 小型脚本引擎
- 可配置自动化流程

4. SSR 渲染沙箱

Vue/React SSR 需要隔离 bundle：

```js
vm.runInNewContext(bundle, { window, document });
```

## ⚠ 六、vm 不能提供真正安全沙箱（结论）

理由：

- 所有 Context 共享同一个 V8 Isolate → 共享内置对象
- Function 构造器可逃逸
- 原型链污染可以跨 Context
- V8 bug 可导致 escape（历史上多次）

实践中不要让不可信代码通过 vm 执行。

## 📌 七、架构总结

Node.js vm 的原理是什么？

1. Node.js 的 vm 基于 V8 的 v8::Context 实现，通过创建独立的上下文来隔离 JavaScript 执行环境。
2. 它会把一个 sandbox 包装为 context 的 global，并使用 vm.Script 编译并运行脚本。
3. 不同 Context 拥有独立的作用域链，但共享同一个 V8 Isolate，因此 built-ins 也是共享的，这导致 vm 隔离并不彻底，容易发生`原型污染`和 `escape`，因此 `vm 不适合运行不可信代码`。
