# IndexDB 工具

## 工具

```js
export class IndexedDBManager {
  /**
   * IndexedDB 数据库管理类
   *
   * @param {Object} options 配置参数
   * @param {string} options.dbName                数据库名称（必填）
   * @param {number} [options.version=1]           数据库版本号，默认 1
   * @param {Object} [options.stores={}]           数据表配置对象
   *        - key: 表名
   *        - value: { keyPath?: string, indexes?: string[] }
   *          例如：
   *          {
   *            users: { keyPath: 'id', indexes: ['name', 'email'] },
   *            orders: { keyPath: 'orderId' }
   *          }
   * @param {number} [options.maxRetries=5]        数据库打开失败时的最大重试次数（默认 5 次）
   */
  constructor({ dbName, version = 1, stores = {}, maxRetries = 5 }) {
    this.dbName = dbName
    this.version = version
    this.stores = stores
    this.db = null
    this.maxRetries = maxRetries
    this._initPromise = this.init()
  }

  /** 确保数据库已初始化 */
  async ensureConnect() {
    if (this.db) return

    if (!this._initPromise) this._initPromise = this.init()
    await this._initPromise
  }

  /** 初始化数据库，支持异常重连 */
  async init(retries = 0) {
    try {
      this.db = await this._openDB()
      console.log(`IndexedDB "${this.dbName}" 初始化成功`)
    } catch (error) {
      console.error(`IndexedDB 打开失败: ${error}`)
      if (retries < this.maxRetries) {
        console.log(`尝试重连 IndexedDB (${retries + 1}/${this.maxRetries})...`)
        await new Promise(resolve => setTimeout(resolve, 500))
        return this.init(retries + 1)
      } else {
        throw new Error(`IndexedDB 打开失败，超过最大重连次数 (${this.maxRetries})`)
      }
    }
  }

  /** 打开数据库并创建表与索引 */
  _openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onupgradeneeded = event => {
        const db = event.target.result
        for (const [storeName, options] of Object.entries(this.stores)) {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, {
              keyPath: options.keyPath || 'id'
            })
            if (options.indexes && options.indexes.length) {
              options.indexes.forEach(idx => store.createIndex(idx, idx, { unique: false }))
            }
          }
        }
      }

      request.onsuccess = event => resolve(event.target.result)
      request.onerror = event => reject(event.target.error)
      request.onblocked = () => console.warn('数据库打开被阻塞')
    })
  }

  _getStore(storeName, mode = 'readonly') {
    const tx = this.db.transaction(storeName, mode)
    return tx.objectStore(storeName)
  }

  /** 插入单条记录（若主键重复则报错） */
  async insertOne({ storeName, data }) {
    await this.ensureConnect()
    const store = this._getStore(storeName, 'readwrite')
    const keyPath = this.stores[storeName].keyPath || 'id'

    // 如果没有主键，则自动生成 UUID
    if (!data[keyPath]) {
      data[keyPath] = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
    }

    return new Promise((resolve, reject) => {
      const request = store.add(data) // add() 方法在 key 重复时会抛错
      request.onsuccess = () => resolve(data)
      request.onerror = e => reject(new Error(`插入失败：${e.target.error.message}`))
    })
  }

  /** 批量插入记录（若主键重复则忽略或报错） */
  async insertMany({ storeName, dataList, skipError = false }) {
    await this.ensureConnect()
    const keyPath = this.stores[storeName].keyPath || 'id'
    const tx = this.db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)

    const results = []
    for (const data of dataList) {
      if (!data[keyPath]) {
        data[keyPath] = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
      }
      try {
        store.add(data)
        results.push(data)
      } catch (e) {
        if (!skipError) {
          tx.abort()
          throw new Error(`批量插入失败：${e.message}`)
        }
      }
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(results)
      tx.onerror = e => reject(e.target.error)
    })
  }

  /** 查找单条记录 */
  async findOne({ storeName, value, index = null }) {
    await this.ensureConnect()
    const store = this._getStore(storeName)
    return new Promise((resolve, reject) => {
      const request = index ? store.index(index).get(value) : store.get(value)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /** 查找所有记录 */
  async findAll({ storeName, index = null, value = null }) {
    await this.ensureConnect()
    const store = this._getStore(storeName)
    return new Promise((resolve, reject) => {
      const request = index && value !== null ? store.index(index).getAll(value) : store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /** 删除单条记录 */
  async removeOne({ storeName, value, index = null }) {
    await this.ensureConnect()
    if (index) {
      const item = await this.findOne({ storeName, value, index })
      if (!item) return false
      value = item[this.stores[storeName].keyPath || 'id']
    }
    return new Promise((resolve, reject) => {
      const store = this._getStore(storeName, 'readwrite')
      const request = store.delete(value)
      request.onsuccess = () => resolve(true)
      request.onerror = () => reject(request.error)
    })
  }

  /** 批量删除，事务安全 */
  async removeMany({ storeName, filterFn, index = null }) {
    await this.ensureConnect()
    const all = await this.findAll({
      storeName,
      index,
      value: typeof filterFn !== 'function' ? filterFn : null
    })
    const itemsToDelete = typeof filterFn === 'function' ? all.filter(filterFn) : all

    const tx = this.db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)

    for (const item of itemsToDelete) {
      store.delete(item[this.stores[storeName].keyPath || 'id'])
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(itemsToDelete.length)
      tx.onerror = e => reject(e.target.error)
    })
  }

  /**
   * 删除指定表中所有数据
   * @param {Object} params
   * @param {string} params.storeName 表名
   * @returns {Promise<number>} 删除的记录数
   */
  async removeAll({ storeName }) {
    await this.ensureConnect()

    return new Promise((resolve, reject) => {
      const store = this._getStore(storeName, 'readwrite')

      const countRequest = store.count() // 删除前统计数量
      let deleteCount = 0

      countRequest.onsuccess = () => {
        deleteCount = countRequest.result || 0
        const clearRequest = store.clear()

        clearRequest.onsuccess = () => resolve(deleteCount)
        clearRequest.onerror = event => reject(event.target.error)
      }

      countRequest.onerror = event => reject(event.target.error)
    })
  }

  /** 更新单条记录 */
  async updateOne({ storeName, value, updateData, index = null }) {
    await this.ensureConnect()
    let key = value
    if (index) {
      const item = await this.findOne({ storeName, value, index })
      if (!item) return null
      key = item[this.stores[storeName].keyPath || 'id']
    }
    const item = await this.findOne({ storeName, value: key })
    if (!item) return null
    const updated = { ...item, ...updateData }
    const store = this._getStore(storeName, 'readwrite')
    return new Promise((resolve, reject) => {
      const request = store.put(updated)
      request.onsuccess = () => resolve(updated)
      request.onerror = () => reject(request.error)
    })
  }

  /** 批量更新，事务安全 */
  async updateMany({ storeName, filterFn, updateData }) {
    await this.ensureConnect()
    const all = await this.findAll({ storeName })
    const tx = this.db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)

    const updatedItems = all.reduce((acc, item) => {
      if (filterFn(item)) {
        const updated = { ...item, ...updateData }
        store.put(updated)
        acc.push(updated)
      }
      return acc
    }, [])

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(updatedItems)
      tx.onerror = e => reject(e.target.error)
    })
  }

  /** 单条 upsert，支持指定索引 */
  async upsertOne({ storeName, upsertData, index = null, indexValue = null }) {
    await this.ensureConnect()
    const store = this._getStore(storeName, 'readwrite')
    const keyPath = this.stores[storeName].keyPath || 'id'
    let key = upsertData[keyPath]

    return new Promise((resolve, reject) => {
      if (index && indexValue !== null) {
        const idxStore = store.index(index)
        const request = idxStore.openCursor(IDBKeyRange.only(indexValue))
        request.onsuccess = event => {
          const cursor = event.target.result
          let finalItem
          if (cursor) {
            key = cursor.primaryKey
            finalItem = { ...cursor.value, ...upsertData }
            cursor.update(finalItem)
          } else {
            if (!key) {
              return reject(new Error(`Key【${keyPath}】 is required`))
            }
            finalItem = { ...upsertData, [keyPath]: key }
            store.put(finalItem)
          }
          resolve(finalItem)
        }
        request.onerror = e => reject(e.target.error)
      } else {
        if (!key) {
          return reject(new Error(`Key【${keyPath}】 is required`))
        }
        const request = store.put({ ...upsertData, [keyPath]: key })
        request.onsuccess = () => resolve({ ...upsertData, [keyPath]: key })
        request.onerror = e => reject(e.target.error)
      }
    })
  }

  /** 批量 upsert，基于 upsertOne，事务安全 */
  async upsertMany({ storeName, upsertDataList, index = null, getIndexValue = null }) {
    await this.ensureConnect()
    const promises = upsertDataList.map(item => {
      const indexValue = index && typeof getIndexValue === 'function' ? getIndexValue(item) : null
      return this.upsertOne({
        storeName,
        upsertData: item,
        index,
        indexValue
      })
    })
    return Promise.all(promises)
  }

  /** 关闭数据库连接 */
  close() {
    if (this.db) {
      this.db.onversionchange = null
      this.db.close()
      this.db = null
      this._initPromise = null
      console.log(`IndexedDB "${this.dbName}" 已关闭`)
    }
  }
}

// 测试用例
// ;(async () => {
//   const log = (msg, data) => {
//     console.log(`✅ ${msg}`, data ?? '')
//   }
//   const err = (msg, e) => {
//     console.error(`❌ ${msg}`, e)
//   }

//   /** 模拟配置 */
//   const dbName = 'TestDB_IndexedDBManager'
//   const manager = new IndexedDBManager({
//     dbName,
//     version: 1,
//     stores: {
//       users: { keyPath: 'id', indexes: ['name', 'age'] },
//       orders: { keyPath: 'orderId', indexes: ['userId'] }
//     },
//     maxRetries: 3
//   })

//   // 确保初始化
//   await manager.ensureConnect()

//   try {
//     log('✅ 数据库初始化成功')

//     await manager.removeAll({ storeName: 'users' })
//     await manager.removeAll({ storeName: 'orders' })

//     // 1️⃣ 插入单条记录
//     const user1 = await manager.insertOne({
//       storeName: 'users',
//       data: { id: 1, name: 'Alice', age: 25 }
//     })
//     log('insertOne 成功', user1)

//     // 2️⃣ 插入多条记录
//     const userList = await manager.insertMany({
//       storeName: 'users',
//       dataList: [
//         { id: 2, name: 'Bob', age: 30 },
//         { name: 'Charlie', age: 28 } // 自动生成 UUID
//       ]
//     })
//     log('insertMany 成功', userList)

//     // 3️⃣ 查找单条
//     const found = await manager.findOne({ storeName: 'users', value: 1 })
//     log('findOne 成功', found)

//     // 4️⃣ 按索引查找
//     const foundByName = await manager.findOne({
//       storeName: 'users',
//       value: 'Alice',
//       index: 'name'
//     })
//     log('findOne 按索引成功', foundByName)

//     // 5️⃣ 查找全部
//     const allUsers = await manager.findAll({ storeName: 'users' })
//     log('findAll 成功', allUsers)

//     // 6️⃣ 更新单条
//     const updated = await manager.updateOne({
//       storeName: 'users',
//       value: 1,
//       updateData: { age: 26 }
//     })
//     log('updateOne 成功', updated)

//     // 7️⃣ 批量更新
//     const updatedList = await manager.updateMany({
//       storeName: 'users',
//       filterFn: u => u.age >= 25,
//       updateData: { active: true }
//     })
//     log('updateMany 成功', updatedList)

//     // 8️⃣ upsertOne 按主键插入新纪录
//     const newUser = await manager.upsertOne({
//       storeName: 'users',
//       upsertData: { id: 4, name: 'Diana', age: 32 }
//     })
//     log('upsertOne 插入成功', newUser)

//     // 9️⃣ upsertOne 按索引更新
//     const updatedByIndex = await manager.upsertOne({
//       storeName: 'users',
//       upsertData: { age: 33 },
//       index: 'name',
//       indexValue: 'Diana'
//     })
//     log('upsertOne 按索引更新成功', updatedByIndex)

//     // 🔟 批量 upsertMany
//     const upsertedMany = await manager.upsertMany({
//       storeName: 'users',
//       upsertDataList: [
//         { id: 5, name: 'Eve', age: 29 },
//         { id: 6, name: 'Frank', age: 41 }
//       ]
//     })
//     log('upsertMany 成功', upsertedMany)

//     // 12️⃣ 删除单条
//     const delOne = await manager.removeOne({
//       storeName: 'users',
//       value: 1
//     })
//     log('removeOne 成功', delOne)

//     // 13️⃣ 批量删除
//     const delManyCount = await manager.removeMany({
//       storeName: 'users',
//       filterFn: u => u.age >= 30
//     })
//     log('removeMany 成功，删除数量', delManyCount)

//     // 14️⃣ 删除全部
//     const delAll = await manager.removeAll({ storeName: 'orders' })
//     log('removeAll 成功', delAll)

//     // 15️⃣ 插入 orders 表数据并验证索引
//     await manager.insertMany({
//       storeName: 'orders',
//       dataList: [
//         { orderId: 'A1', userId: 2, amount: 100 },
//         { orderId: 'A2', userId: 2, amount: 200 },
//         { orderId: 'A3', userId: 3, amount: 300 }
//       ]
//     })
//     const ordersByUser2 = await manager.findAll({
//       storeName: 'orders',
//       index: 'userId',
//       value: 2
//     })
//     log('findAll 按索引查询成功', ordersByUser2)

//     // 16️⃣ 测试异常插入（重复主键）
//     try {
//       await manager.insertOne({
//         storeName: 'users',
//         data: { id: 99, name: 'Dup', age: 18 }
//       })
//       await manager.insertOne({
//         storeName: 'users',
//         data: { id: 99, name: 'Dup', age: 18 }
//       })
//       err('insertOne 未抛错', '应当抛出重复键错误')
//     } catch (e) {
//       log('insertOne 重复主键错误捕获成功', e.message)
//     }

//     // 17️⃣ 测试 removeOne 按索引删除
//     const result = await manager.removeOne({
//       storeName: 'users',
//       index: 'name',
//       value: 'Eve'
//     })
//     log('removeOne 按索引成功', result)

//     // 18️⃣ 测试关闭与重连
//     manager.close()
//     log('数据库已关闭')
//     await manager.ensureConnect()
//     log('ensureConnect 重连成功')

//     // 19️⃣ 最终检查：查询全部用户
//     const finalAll = await manager.findAll({ storeName: 'users' })
//     log('最终数据', finalAll)

//     console.log('🎉 所有测试用例执行完成 ✅')
//   } catch (e) {
//     err('测试出错', e)
//   } finally {
//     manager.close()
//   }
// })()

```
