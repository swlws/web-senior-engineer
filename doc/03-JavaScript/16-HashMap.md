# HashMap

## 🌱 一、基本概念

HashMap 是一种基于 哈希表（Hash Table） 的键值对存储结构。
它的核心目标是：

> 在平均情况下，让 插入 (put)、查找 (get)、删除 (delete) 的时间复杂度达到 O(1)。

## 🧩 二、核心思路概述

HashMap 的实现大体可以分成 五个核心步骤：

### 1. 哈希函数（Hash Function）

- 把键（key）转换成一个整数哈希值（hash code）。
- 示例：

  ```js
  hash = hashFunction(key)
  ```

- 要求：
  - 相同的 key 必须生成相同的 hash
  - 不同的 key 尽量分布均匀

### 2. 索引定位（Indexing）

- 根据哈希值计算在底层数组中的下标：

  ```js
  index = hash % capacity
  ```

- capacity 是底层存储桶（bucket）的数量（一般为 2 的幂）。

### 3. 冲突处理（Collision Resolution）

- 不同的 key 可能得到相同的 index，这叫“哈希冲突”。
- 常见处理方式：
  - 分离链表（Separate Chaining）：每个桶放一个链表或数组。
  - 开放寻址（Open Addressing）：在数组中找下一个空位。

### 4. 动态扩容（Rehashing / Resizing）

- 当 HashMap 填充过多（负载因子 load factor > 阈值，如 0.75），
  就需要扩大底层数组容量并重新分配位置（rehash）。

### 5. Key 的相等判定

- 插入或查找时，不仅看 hash，还要用 ===（或 .equals()）判断 key 是否真的相同。
- 因为不同的 key 可能 hash 相同（冲突）。

## ⚙️ 三、结构设计（内存布局）

一个简单的 JS 伪结构如下：

```js
class HashMap {
  buckets = [ [], [], [], ... ]; // 每个桶是一个数组，用于处理冲突
  capacity = 16;                 // 初始容量
  size = 0;                      // 已存储的键值对数量
}
```

> 在 Java、C++ 里，每个桶常常是链表节点（甚至红黑树）；
> 在 JS 里，通常用数组就足够模拟。

## 🧮 四、操作流程详解

### 1️⃣ 插入（set(key, value)）

```txt
key → hash(key) → index → buckets[index]
```

伪代码：

```js
function set(key, value) {
  const hash = hashKey(key);
  const index = hash % capacity;
  const bucket = buckets[index];

  // 检查是否已有相同 key
  for (let entry of bucket) {
    if (entry.key === key) {
      entry.value = value; // 更新
      return;
    }
  }

  // 没有则插入
  bucket.push({ key, value });
  size++;

  // 检查是否需要扩容
  if (size / capacity > 0.75) resize();
}
```

### 2️⃣ 查找（get(key)）

```js
function get(key) {
  const hash = hashKey(key);
  const index = hash % capacity;
  const bucket = buckets[index];

  for (let entry of bucket) {
    if (entry.key === key) return entry.value;
  }
  return undefined;
}
```

### 3️⃣ 删除（delete(key)）

```js
function delete(key) {
  const index = hashKey(key) % capacity;
  const bucket = buckets[index];

  for (let i = 0; i < bucket.length; i++) {
    if (bucket[i].key === key) {
      bucket.splice(i, 1);
      size--;
      return true;
    }
  }
  return false;
}
```

### 4️⃣ 扩容（resize()）

当负载因子超过阈值：

- 新建更大的桶数组；
- 重新计算每个键的 index；
- 把所有旧数据重新分配（rehash）。

```js
function resize() {
  const oldBuckets = buckets;
  capacity *= 2;
  buckets = Array.from({ length: capacity }, () => []);

  for (let bucket of oldBuckets) {
    for (let entry of bucket) {
      const index = hashKey(entry.key) % capacity;
      buckets[index].push(entry);
    }
  }
}
```

## ⚔️ 五、冲突解决策略对比

| 策略       | 原理            | 优点     | 缺点          |
| -------- | ------------- | ------ | ----------- |
| 分离链表     | 每个桶用链表或数组存冲突项 | 简单直观   | 需要额外内存      |
| 开放寻址     | 冲突时寻找下一个空位    | 内存紧凑   | 删除复杂、性能退化风险 |
| 再哈希（双哈希） | 用另一个哈希函数跳步探测  | 减少聚集冲突 | 实现复杂        |

## 📏 六、复杂度分析

| 操作        | 平均复杂度       | 最坏复杂度 |
| --------- | ----------- | ----- |
| 插入 set    | O(1)        | O(n)  |
| 查找 get    | O(1)        | O(n)  |
| 删除 delete | O(1)        | O(n)  |
| 扩容 resize | O(n) （偶尔触发） | O(n)  |

## 🧠 七、设计优化点

1. 合理的哈希函数
   - 避免所有 key 哈希集中在少数桶上。
2. 负载因子控制
   - 通常在 0.5~0.75 之间。
3. 桶数量取 2 的幂
   - 方便使用位运算 (hash & (capacity - 1)) 替代 %。
4. 对象 key
   - JS 不能直接对对象做哈希，通常借助 WeakMap 或给对象分配唯一 ID。
5. 渐进扩容
   - 可设计为分批 rehash，避免一次性扩容带来的性能尖峰。

## 🎯 八、总结一句话

> HashMap = 哈希函数 + 数组 + 冲突处理策略 + 扩容机制

## Demo

```js
/**
 * HashMap (JS)
 * - 支持任意 key 类型（primitive / object / function / symbol）
 * - 分离链表（每个 bucket 用数组存放 entry）
 * - 动态扩容（loadFactor = 0.75）
 *
 * API:
 *  - set(key, value) / put(key, value)
 *  - get(key)
 *  - has(key)
 *  - delete(key)
 *  - size
 *  - clear()
 *  - keys(), values(), entries()
 */

class HashMap {
  constructor(initialCapacity = 16, loadFactor = 0.75) {
    this._capacity = Math.max(4, initialCapacity | 0);
    this._loadFactor = loadFactor;
    this._buckets = Array.from({ length: this._capacity }, () => []);
    this._size = 0;

    // 用 WeakMap 给对象/函数类型的 key 分配稳定的内部 id（避免把对象转字符串）
    this._objKeyToId = new WeakMap();
    this._nextObjId = 1;
  }

  get size() {
    return this._size;
  }

  // public aliases
  set(key, value) {
    return this.put(key, value);
  }
  put(key, value) {
    this._ensureCapacityFor(this._size + 1);
    const idx = this._bucketIndex(key);
    const bucket = this._buckets[idx];

    console.log(this._buckets);
    console.log(idx, bucket);

    for (let entry of bucket) {
      if (this._sameKey(entry.key, key)) {
        entry.value = value;
        return this;
      }
    }

    bucket.push({ key, value });
    this._size++;
    return this;
  }

  get(key) {
    const bucket = this._buckets[this._bucketIndex(key)];
    for (let entry of bucket) {
      if (this._sameKey(entry.key, key)) return entry.value;
    }
    return undefined;
  }

  has(key) {
    const bucket = this._buckets[this._bucketIndex(key)];
    for (let entry of bucket) {
      if (this._sameKey(entry.key, key)) return true;
    }
    return false;
  }

  delete(key) {
    const idx = this._bucketIndex(key);
    const bucket = this._buckets[idx];
    for (let i = 0; i < bucket.length; i++) {
      if (this._sameKey(bucket[i].key, key)) {
        bucket.splice(i, 1);
        this._size--;
        return true;
      }
    }
    return false;
  }

  clear() {
    this._buckets = Array.from({ length: this._capacity }, () => []);
    this._size = 0;
    // keep obj id map (WeakMap) — entries will be GC'd if no external refs
  }

  *keys() {
    for (let bucket of this._buckets) for (let e of bucket) yield e.key;
  }

  *values() {
    for (let bucket of this._buckets) for (let e of bucket) yield e.value;
  }

  *entries() {
    for (let bucket of this._buckets)
      for (let e of bucket) yield [e.key, e.value];
  }

  [Symbol.iterator]() {
    return this.entries();
  } // for-of

  // ---- internal helpers ----

  _bucketIndex(key) {
    const hash = this._hashKeyToNumber(key);
    // ensure non-negative
    return (hash & 0x7fffffff) % this._capacity;
  }

  _ensureCapacityFor(wantedSize) {
    if (wantedSize / this._capacity > this._loadFactor) {
      this._resize(this._capacity * 2);
    }
  }

  _resize(newCapacity) {
    newCapacity = Math.max(4, newCapacity | 0);
    const oldBuckets = this._buckets;
    this._capacity = newCapacity;
    this._buckets = Array.from({ length: this._capacity }, () => []);
    // rehash entries
    for (let bucket of oldBuckets) {
      for (let e of bucket) {
        const idx = this._bucketIndex(e.key);
        this._buckets[idx].push(e);
      }
    }
  }

  // 判断两个 key 是否相同（对 object/function 使用 ===，对 NaN 特殊处理）
  _sameKey(a, b) {
    if (a === b) return true;
    // special case: NaN === NaN should be treated equal
    return (
      typeof a === 'number' && typeof b === 'number' && isNaN(a) && isNaN(b)
    );
  }

  // 把 key 映射成一个整数（使用字符串化 + djb2 哈希），但对象/函数使用 WeakMap id 避免 toString 冲突
  _hashKeyToNumber(key) {
    const keyStr = this._keyToStableString(key);
    // simple string hash (djb2)
    let hash = 5381;
    for (let i = 0; i < keyStr.length; i++) {
      hash = (hash << 5) + hash + keyStr.charCodeAt(i); // hash * 33 + c
      // keep in 32-bit
      hash |= 0;
    }
    return hash;
  }

  _keyToStableString(key) {
    const t = typeof key;
    if (key === null) return 'null';
    if (t === 'undefined') return 'undefined';
    if (t === 'number')
      return 'n:' + (Object.is(key, -0) ? '-0' : key.toString());
    if (t === 'string') return 's:' + key;
    if (t === 'boolean') return 'b:' + key;
    if (t === 'symbol') {
      // 尽可能稳定：使用 WeakMap 注册 symbol 或者 symbol.toString()
      return 'sym:' + key.toString();
    }
    if (t === 'function' || t === 'object') {
      // 使用 WeakMap 为每个对象/函数分配唯一 id
      let id = this._objKeyToId.get(key);
      if (!id) {
        id = `obj#${this._nextObjId++}`;
        this._objKeyToId.set(key, id);
      }
      return id;
    }
    // fallback
    return String(key);
  }
}

const map = new HashMap();
map.set(1, 'one');

```
