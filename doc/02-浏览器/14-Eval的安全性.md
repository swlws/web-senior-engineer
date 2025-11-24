# Eval 的安全性

在前端、Node.js、任何 JavaScript 环境中，eval 是最危险、最不建议使用的 API 之一。

## 🚨 1. eval 的核心安全问题

eval 会做两件非常危险的事情：

### ✔ （1）把任意字符串「当作代码执行」

只要字符串中出现攻击者可控内容，就能：

- 执行系统命令（Node 环境）
- 绕过权限控制
- 注入逻辑
- 操控用户数据
- 直接运行恶意 JS（XSS）

### ✔ （2）eval 在「调用上下文」内执行代码

eval(code) 可以访问当前作用域所有变量：

```js
let secret = 'token123';
eval("console.log(secret)"); // → token123
```

所以如果攻击者插入一段字符串，直接读取敏感变量，完全破防。

## 😨 2. 能被攻击者利用的真实场景

### ✔ XSS（最常见）

```js
const userInput = "<img src=x onerror=alert('hack')>";
eval(userInput); 
```

浏览器直接执行攻击代码。

### ✔ 后端 Node 远程代码执行（RCE）

如果你做 SSR、模板编译、低代码平台，很容易中招：

```js
const code = req.body.code;
eval(code); // 攻击者直接执行系统命令
```

攻击者输入：

```js
require('child_process').exec('rm -rf /')
```

你服务器就没了。

### ✔ 任意变量泄漏

```js
const password = "p123456";
eval("console.log(password)");
```

攻击者能读到所有变量。

### ✔ 作用域污染（Scope Pollution）

攻击者的代码运行后，可以修改你的业务变量：

```js
let admin = false;
eval("admin = true");
console.log(admin); // true，权限被窃取
```

## 🔒 3. eval 的安全替代方案

### ✔ 1. Function 构造器（沙箱隔离更好，但仍危险）

```js
new Function("return 1+1")()
```

- 只能访问全局作用域
- 不能读取局部变量（比 eval 安全）

但仍然能访问 window / global，所以仍不安全。

### ✔ 2. 运行时 sandbox（真正安全）

浏览器 sandbox

- iframe sandbox
- Worker + message 机制

Node sandbox

- vm2
- isolated-vm

例如：

```js
import { VM } from 'vm2';

const vm = new VM({ timeout: 1000 });
vm.run("while(true){}"); // 会被阻止
```

### ✔ 3. 安全模板引擎（Vue/React 都是这种方式）

例如 Vue 模板不会直接 eval：

- tokenization
- parse 成 AST
- codegen
- runtime 执行（没有字符串执行）

## 💡 5. 总结

- eval 会在当前作用域执行任意字符串代码。
- 这会导致严重的安全问题（XSS、RCE、变量泄漏、权限提升），
- 且破坏 JS 引擎优化，非常慢。
- 正确做法是使用 sandbox 或 AST，而不是 eval。
