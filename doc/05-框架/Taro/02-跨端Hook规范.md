# 跨端 Hook 规范

目标：在跨端项目中最大化复用业务逻辑，并将平台差异隔离在 Hook 层，使 UI 层无差异。

## 1. 🎯 设计目标（必须达成）

跨端 Hook 设计必须满足：

1. 业务代码不出现平台判断（无 if (TARO_ENV)）
2. 平台能力差异由 Hook 内部封装
3. UI 组件完全跨端复用
4. 保证 SSR/H5/RN/小程序均可运行
5. 每个 Hook 都是独立可测试（unit-test）的
6. 命名规则统一，目录结构清晰

## 2. 📁 目录结构规范（生产级标准）

```txt
src/
  shared/
    hooks/
      useLogin/
        index.ts        # 跨端 Hook 主入口
        index.weapp.ts
        index.h5.ts
        useLogin.rn.ts
        types.ts
      useInfiniteList/
        index.ts
        adapter.ts      # 复杂适配抽离
    utils/
      platform.ts       # 平台判断 + 能力探测
  platform/
    weapp.ts
    h5.ts
    rn.ts
```

关键点：

- 每个 Hook 都是一个独立目录。
- 按平台拆分文件，自动走 Tree-Shaking。
- 对外只暴露统一接口（index.ts）。

## 3. 📌 Hook 命名规则

所有 Hook 必须：

1. 以 use 开头
2. 副作用低 → 函数纯粹（不直接操作 DOM/Node）
3. 只做“逻辑抽象”，不涉及 UI

示例：

- useLogin
- useUserInfo
- usePageScroll
- useInfiniteList
- useToast
- useUpload

## 4. 🧪 TypeScript 规范

每个 Hook 必须定义：

1. 输入参数类型
2. 输出 return 类型

例如：

```ts
// types.ts
export interface UseLoginOptions {
  redirect?: boolean;
}

export interface UseLoginResult {
  login: () => Promise<LoginResult>;
  logout: () => Promise<void>;
  user: User | null;
}
```

Hook 主文件：

```ts
export function useLogin(opts?: UseLoginOptions): UseLoginResult;
```

## 5. 🔀 跨端差异隔离模型（核心规范）

跨端差异仅能通过以下方式隔离：

### ✔ 方式一：按平台拆分 Hook（推荐）

示例：

```ts
// useLogin/index.ts
export * from "./index.weapp";
```

Webpack/Vite 会根据 TARO_ENV 自动选择对应文件。

文件列表：

```txt
index.weapp.ts
index.h5.ts
useLogin.rn.ts
```

适合：

- login
- 支付（pay）
- 授权能力
- file API
- 网络能力

### ✔ 方式二：在 Hook 内部使用适配器

```ts
import { platform } from "@/platform";

export function useUpload() {
  const upload = (file) => platform.uploadFile(file);
  return { upload };
}
```

适合：

- 页面跳转
- 文件系统
- 网络能力
- 小程序特殊 API

### ✔ 方式三：抽象出“策略函数”

适合复杂差异：

```ts
const strategy = {
  weapp: () => {},
  h5: () => {},
  rn: () => {},
};

export function useShare() {
  const share = strategy[Taro.getEnv()];
  return { share };
}
```

### 6. ✔ 输入输出必须稳定（防止 UI 层崩溃）

无论哪个端，Hook 必须返回：

- 相同的字段
- 相同的 Promise 行为
- 相同的错误处理机制

例如，如果登录失败，所有端都必须：

```ts
throw new Error("LOGIN_FAILED");
```

不能 H5 返回 null，小程序返回 false。

### 7. 🔄 性能规范

1. 内部必须使用 useCallback / useMemo（React）或 computed（Vue3）
2. 避免在 Hook 内创建大量匿名函数
3. 不可在 Hook 内发起“非惰性请求”
   （即：只能在 onLoad/onMounted 之后执行）

示例错误写法：

```ts
export function useUser() {
  fetchUser(); // ❌ Hook 不能直接执行
}
```

正确写法：

```ts
export function useUser() {
  const loadUser = () => fetchUser();
  return { loadUser };
}
```

### 8. 🧼 错误处理规范（必须统一）

每个 Hook 必须内置统一错误处理：

```ts
try {
  return await platform.xxxx();
} catch (err) {
  console.error("[useLogin]", err);
  throw new Error("LOGIN_FAILED");
}
```

业务逻辑不需要知道平台差异。

### 9. 🧪 单元测试规范（可直接跑）

用 jest：

```txt
__tests__/
  index.weapp.test.ts
  index.h5.test.ts
```

测试：

- 逻辑正确性
- 平台差异是否走正确实现
- 错误是否正确抛出

### 10. 🧱 真实生产示例（开箱可用）

沙盒示例：跨端登录 Hook

```txt
useLogin/
  index.ts
  index.weapp.ts
  index.h5.ts
  types.ts
```

#### index.ts

```ts
export * from "./index.weapp";
```

#### 自动编译：

- WeApp → index.weapp
- H5 → index.h5

#### index.weapp.ts

```ts
import Taro from "@tarojs/taro";
import { UseLoginResult } from "./types";

export function useLogin(): UseLoginResult {
  const login = async () => {
    const { code } = await Taro.login();
    return { type: "weapp", code };
  };
  return { login };
}
```

#### index.h5.ts

```ts
import { UseLoginResult } from "./types";

export function useLogin(): UseLoginResult {
  const login = async () => {
    const token = localStorage.getItem("token");
    return { type: "h5", token };
  };
  return { login };
}
```

## 11. 📘 最终总结（可贴团队 Wiki）

跨端 Hook 的本质是“差异集中 + 业务无差异 + 单一出口”。

- Hook 层抽象业务逻辑
- Adapter 层屏蔽平台差异
- UI 层完全跨端复用
- 平台差异不入侵业务逻辑
- 每个 Hook 都是独立、可测试、可替换的
