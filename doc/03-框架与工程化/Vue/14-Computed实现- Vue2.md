# Vue2 中 Computed 实现

## 🧩 核心思想

对比普通 Watcher

| 类型             | 是否立即执行 | 是否缓存  | 用途                                     |
| ---------------- | ------------ | --------- | ---------------------------------------- |
| 普通 watcher     | ✅ 立即执行  | ❌ 不缓存 | 用于监听数据变化，立即回调更新           |
| 计算属性 watcher | ❌ 惰性执行  | ✅ 缓存   | 仅在被访问时计算，依赖变化后标记为 dirty |

## ✅ 简化版实现（可运行）

在我们之前的 Dep / Watcher / defineReactive 基础上，加上一个 computed 实现：

```js
class Dep {
  constructor() {
    this.subs = new Set();
  }
  depend() {
    if (Dep.target) this.subs.add(Dep.target);
  }
  notify() {
    this.subs.forEach((sub) => sub.update());
  }
}

Dep.target = null;

class Watcher {
  constructor(getter, options = {}) {
    this.getter = getter;
    this.dirty = !!options.lazy; // 是否惰性
    this.lazy = !!options.lazy;
    this.value = this.lazy ? undefined : this.get();
    this.deps = new Set();
  }

  get() {
    Dep.target = this;
    const value = this.getter(); // 执行 getter 收集依赖
    Dep.target = null;
    return value;
  }

  update() {
    if (this.lazy) {
      // 计算属性只标记为 dirty，不立即求值
      this.dirty = true;
    } else {
      // 普通 watcher 立即执行
      const newVal = this.get();
      console.log("普通 watcher 触发:", newVal);
    }
  }

  evaluate() {
    if (this.dirty) {
      this.value = this.get();
      this.dirty = false;
    }
    return this.value;
  }

  depend() {
    this.deps.forEach((dep) => dep.depend());
  }
}

function defineReactive(obj, key, val) {
  const dep = new Dep();
  Object.defineProperty(obj, key, {
    get() {
      dep.depend();
      return val;
    },
    set(newVal) {
      if (newVal !== val) {
        val = newVal;
        dep.notify();
      }
    },
  });
}

function observe(obj) {
  Object.keys(obj).forEach((k) => defineReactive(obj, k, obj[k]));
}

// ----------------------------
// 创建一个 computed 实现
// ----------------------------
function defineComputed(target, key, getter) {
  const watcher = new Watcher(getter, { lazy: true });

  Object.defineProperty(target, key, {
    get() {
      // 如果依赖变化，重新计算
      if (watcher.dirty) watcher.evaluate();

      // 让外部的 watcher（如渲染函数）也能订阅 computed 的依赖
      if (Dep.target) watcher.depend();

      return watcher.value;
    },
  });
}

// ----------------------------
// 测试
// ----------------------------
const state = { a: 1, b: 2 };
observe(state);

const computed = {};
defineComputed(computed, "sum", () => state.a + state.b);

// 模拟渲染函数
new Watcher(() => {
  console.log("渲染：sum =", computed.sum);
});

state.a = 3; // 修改依赖，触发 sum 重新计算
state.b = 5;
console.log("再次访问 sum：", computed.sum);
```

### 🧠 运行结果

```bash
渲染：sum = 3
再次访问 sum： 8
```

### ⚙️ 实现要点拆解

1. 惰性求值（lazy）
   - 初始化时 lazy = true，不立即执行 getter
   - 首次访问时执行 evaluate() → 真正计算一次结果并缓存
2. 缓存机制（dirty）
   - 当依赖属性变化时，依赖的 Dep 会通知 Watcher
   - 此时只是标记 dirty = true（懒更新）
   - 下次访问 computed 时再重新计算
3. 双层依赖收集
   - 访问 computed 时会触发：
   - 内部依赖收集：computed 依赖的数据属性
   - 外部依赖收集：其他 watcher（如渲染 watcher）依赖 computed 本身
   - 这样当依赖变更时，computed 重新计算 → 渲染函数自动更新

## 🧩 Vue2 中的真实对应逻辑

| 模块                         | 对应源码位置                   | 作用                            |
| ---------------------------- | ------------------------------ | ------------------------------- |
| `Watcher`                    | `src/core/observer/watcher.js` | 负责收集依赖与更新              |
| `Dep`                        | `src/core/observer/dep.js`     | 管理依赖关系                    |
| `initComputed`               | `src/core/instance/state.js`   | 创建带 lazy watcher 的 computed |
| `computedWatcher.evaluate()` | 同步计算逻辑（带缓存）         |                                 |
| `computedWatcher.depend()`   | 让渲染 watcher 订阅内部依赖    |                                 |
