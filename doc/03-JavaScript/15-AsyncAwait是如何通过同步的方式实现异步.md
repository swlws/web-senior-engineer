# Async/Await 是如何通过同步的方式实现异步的

## 1. 背景

- 异步问题：JS 单线程，I/O 等操作是异步的（如 setTimeout、网络请求）。
- 传统写法：回调函数（callback hell）、Promise .then() 链。
- Async/Await 的目标：让异步代码“看起来”像同步写法，提升可读性。

## 2. Async/Await 的本质

1. async 函数：
   - 自动返回一个 Promise。
   - 函数内部可以使用 await。
2. await 表达式：
   - 会暂停 async 函数的执行，等待右侧的 Promise 结果。
   - 等待的同时不会阻塞主线程（因为 JS 引擎会把后续逻辑放到微任务队列）。

## 3. 内部实现原理（Generator + Promise）

其实 async/await 是基于 Generator + Promise 的语法糖，编译器帮我们做了封装。核心原理：

- await 类似 yield，用来“暂停”函数执行；
- 引擎用 Promise.then 来调度后续代码；
- 通过自动执行器（类似 co 库）驱动整个流程。

---

## 手写一个简化版对比

用 Generator 实现一个“看起来像同步”的异步：

```js
function run(gen) {
  const g = gen();

  function step(nextF, arg) {
    let next;
    try {
      next = nextF(arg); // 执行 generator
    } catch (e) {
      return Promise.reject(e);
    }

    if (next.done) return Promise.resolve(next.value);

    return Promise.resolve(next.value).then(
      (v) => step(g.next.bind(g), v),
      (e) => step(g.throw.bind(g), e)
    );
  }

  return step(g.next.bind(g));
}
```

用法：

```js
function* myGen() {
  const a = yield Promise.resolve(1);
  console.log(a); // 1
  const b = yield Promise.resolve(2);
  console.log(b); // 2
  return b + 1;
}

run(myGen).then((res) => console.log(res)); // 输出 3
```

👉 这就是 async/await 的底层思想：

- yield → await
- run(generator) → JS 引擎自动帮你做

## 4. 执行流程示意

```js
async function foo() {
  const a = await fetchData(1);
  const b = await fetchData(2);
  return a + b;
}
```

执行过程：

- foo() 返回一个 Promise。
- 执行到第一个 await，把 fetchData(1) 的 Promise 暂存，暂停函数。
- 等 Promise resolve 后，继续执行，把结果赋给 a。
- 遇到第二个 await，再暂停，等结果。
- 最终 return a + b，相当于 Promise.resolve(a + b)。

## 5. 总结一句话

- async/await = Generator + Promise + 自动执行器
- 它通过 暂停（yield/await）+ 恢复执行（Promise.then 调度），让开发者用同步代码风格去写异步逻辑。
