# Vue3 封装 Hooks 遵循的原则

在 Vue 3 中，`hooks/composables` 本质是一个普通的函数，内部使用 Composition API（ref, reactive, computed, watch, onMounted 等）来封装可复用的业务逻辑。

## ✅ 封装 composables 的 10 条核心原则

### 1️⃣ 单一职责原则

一个 composable 只处理一类业务逻辑。
避免一个 composable 同时处理「状态 + 业务请求 + 事件 + UI 分析」。

- ✔️ useFetch 专注数据请求
- ✔️ usePagination 专注分页管理
- ✔️ useMouse 专注鼠标位置
- ✔️ useCounter 专注计数逻辑

❌ 把 fetch + pagination + modal 状态放一起 → 难维护

### 2️⃣ 不要操作 DOM，保持逻辑纯粹

除非是专门的 DOM composable（如 useElementSize），否则 composables 应尽量保持：

- 不依赖 DOM
- 不依赖 Vue 组件实例
- 不依赖 UI 动画

逻辑与 UI 分离是核心原则。

### 3️⃣ 保持无状态 / 可注入状态

- ❌ 错误：内部读写全局单例状态
- ✔️ 正确：允许用户通过参数传入状态对象

例如分页：

```js
export function usePagination(initial = 1) {
  const page = ref(initial);
  const pageSize = ref(20);
  return { page, pageSize };
}
```

### 4️⃣ 避免副作用在 composable 中“自动执行”

- ❌ composable 自动发请求
- ✔️ composable 返回 run() 让使用者调用

这种方式可控性更高

### 5️⃣ 命名以 “use” 开头（官方推荐）

统一使用：

```txt
useXXX
```

例如：

- useList
- useSelect
- useDebounce
- useEventListener
- useDraggable

### 6️⃣ composable 返回的数据结构要清晰

通常应该返回 一个对象，包含：

- 状态（ref/reactive）
- 方法（函数）
- 生命周期控制函数（如 reset）

例子：

```ts
return {
  loading,
  data,
  run,
  cancel,
};
```

### 7️⃣ 可选：使用 TypeScript 增强复用性

减少 any，多用：

- 泛型 `<T>`
- 明确类型接口
- Partial / Pick / Omit 控制类型

示例：

```ts
export function useFetch<T>(api: () => Promise<T>) {
  const data = ref<T>();
}
```

### 8️⃣ composable 不直接依赖路由 / store

- ❌ 不推荐在 composable 里直接使用 useRoute/useRouter
- ✔️ 推荐从外部传入依赖：

```ts
export function useQueryParams(route = useRoute()) {
  const query = computed(() => route.query);
}
```

这样 composable 在不同环境（SSR、测试）更易复用。

### 9️⃣ composable 内部必须支持手动/自动清理

尤其是：

- addEventListener
- setInterval
- setTimeout
- watch（长期监听）
- 全局状态订阅

必须提供停止机制：

```ts
onUnmounted(() => stop());
```

### 🔟 composable 必须可在多个组件重复使用，不互相污染

确保使用的响应式变量不是全局单例。
一般变量应放在函数内部，而不是文件最顶层。

❌ 错误（所有组件共享一个状态）：

```ts
const count = ref(0);
export function useCounter() {
  return { count };
}
```

✔️ 正确：

```ts
export function useCounter() {
  const count = ref(0);
  return { count };
}
```

## 📌 常见 composable 模板

### 通用模板

```ts
export function useSomething(params) {
  // 1. 状态
  const state = ref()
  const loading = ref(false)

  // 2. 计算属性
  const result = computed(() => ...)

  // 3. 方法
  function run() {}

  // 4. watch
  watch(...)

  // 5. 生命周期
  onMounted(() => ...)
  onUnmounted(() => ...)

  // 6. 返回
  return {
    state,
    loading,
    result,
    run,
  }
}
```

## 🧩 示例：封装 useFetch

```ts
export function useFetch<T>(fn: () => Promise<T>) {
  const data = ref<T>();
  const loading = ref(false);
  const error = ref<unknown>();

  async function run() {
    loading.value = true;
    error.value = undefined;
    try {
      data.value = await fn();
    } catch (err) {
      error.value = err;
    } finally {
      loading.value = false;
    }
  }

  return {
    data,
    loading,
    error,
    run,
  };
}
```

组件内使用：

```ts
const { data, loading, run } = useFetch(() => api.getList());
run();
```

## 🧩 示例：封装 useEventListener

```ts
export function useEventListener(
  target: EventTarget,
  event: string,
  handler: EventListener
) {
  onMounted(() => target.addEventListener(event, handler));
  onUnmounted(() => target.removeEventListener(event, handler));
}
```
