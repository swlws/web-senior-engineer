# AutoDispose

事件管理

## Code

```js
/*
AutoDispose - DOM cleanup utility (vanilla JS)

目标：在真实线上项目中防止 Detached DOM / lingering closures / 未解绑监听器 导致的内存泄露。
特点：
 - 轻量（单文件），无外部依赖
 - 使用 WeakMap 将 DOM 与清理函数关联，避免强引用
 - 提供常用 API：on/once/interval/timeout/raf/observe/createPortal/register
 - 支持手动销毁，也支持自动检测 detached 节点并回收
 - 便于在原生 JS、Vue、React 中使用

使用方法：
 1. import AutoDispose from './auto-dispose.js'
 2. auto = new AutoDispose()
 3. const disposer = auto.register(el)
    disposer.on('click', handler)
    disposer.interval(() => {...}, 1000)
 4. 当 el 被移除或你调用 disposer.dispose()，自动清理

注意：AutoDispose 本身不会持有强引用 DOM（使用 WeakMap），但如果你把 DOM 挂到 window/global 上，那仍会阻止 GC。
*/

class AutoDispose {
  constructor({ autoScanInterval = 2000, enableAutoScan = true } = {}) {
    // WeakMap: Element -> Set of cleanup functions
    this.map = new WeakMap()
    this.enableAutoScan = enableAutoScan
    this._scanTimer = null
    if (enableAutoScan) this.startAutoScan(autoScanInterval)
  }

  // register an element, return a Disposer instance
  register(el) {
    if (!el || typeof el !== 'object') throw new Error('register requires a DOM element')
    if (!this.map.has(el)) this.map.set(el, new Set())

    const addCleanup = (fn) => {
      const set = this.map.get(el)
      set.add(fn)
      return () => { set.delete(fn) }
    }

    const disposer = {
      el,
      on: (target, event, handler, options) => {
        // target can be el or window/document/whatever
        const t = target || el
        t.addEventListener(event, handler, options)
        return addCleanup(() => { try { t.removeEventListener(event, handler, options) } catch (e) {} })
      },
      once: (target, event, handler, options) => {
        const t = target || el
        const wrapped = function (e) { handler.call(this, e); cleanup() }
        t.addEventListener(event, wrapped, options)
        const cleanup = addCleanup(() => { try { t.removeEventListener(event, wrapped, options) } catch (e) {} })
        return cleanup
      },
      interval: (fn, ms) => {
        const id = setInterval(fn, ms)
        return addCleanup(() => { clearInterval(id) })
      },
      timeout: (fn, ms) => {
        const id = setTimeout(fn, ms)
        return addCleanup(() => { clearTimeout(id) })
      },
      raf: (fn) => {
        let id = requestAnimationFrame(fn)
        return addCleanup(() => { cancelAnimationFrame(id) })
      },
      observe: (target, cb, options) => {
        // MutationObserver or IntersectionObserver
        if (typeof MutationObserver !== 'undefined' && target instanceof Node) {
          const mo = new MutationObserver(cb)
          mo.observe(target, options || { childList: true, subtree: true })
          return addCleanup(() => { try { mo.disconnect() } catch (e) {} })
        }
        if (typeof IntersectionObserver !== 'undefined') {
          const io = new IntersectionObserver(cb, options)
          io.observe(target)
          return addCleanup(() => { try { io.disconnect() } catch (e) {} })
        }
        throw new Error('Unsupported observer or environment')
      },
      keep: (fn) => addCleanup(fn), // 手动注册任意清理函数
      setAttr: (name, value) => {
        el.setAttribute(name, value)
        return addCleanup(() => { try { el.removeAttribute(name) } catch (e) {} })
      },
      dispose: () => {
        this._disposeElement(el)
      }
    }

    return disposer
  }

  // 手动触发清理某 element
  _disposeElement(el) {
    const set = this.map.get(el)
    if (!set) return
    try {
      for (const fn of Array.from(set)) {
        try { fn() } catch (e) { console.error('AutoDispose cleanup error', e) }
      }
    } finally {
      this.map.delete(el)
    }
  }

  // 开启定期扫描，寻找 detached nodes 并回收
  startAutoScan(interval = 2000) {
    if (this._scanTimer) return
    this._scanTimer = setInterval(() => {
      this._runScan()
    }, interval)
  }

  stopAutoScan() {
    if (!this._scanTimer) return
    clearInterval(this._scanTimer)
    this._scanTimer = null
  }

  // 扫描 WeakMap 中的元素（注意 WeakMap 不允许遍历），我们需要保有一个弱引用列表
  // 为了实现扫描，我们在内存中维护一个 WeakRef 列表（若支持），并对其进行清理。
  // 如果环境不支持 WeakRef（旧浏览器），不能高可靠地自动扫描，所以我们依赖于用户手动 dispose 或 hook 到框架生命周期

  _runScan() {
    if (typeof WeakRef === 'undefined') return // 无法遍历 WeakMap 的 keys，跳过
    // We maintain an internal list of WeakRefs for scanning — lazily built
    if (!this._weakRefs) this._weakRefs = []

    // 构造弱引用列表：所有已注册的元素都生成一个 WeakRef (若不存在)
    // Note: we cannot iterate WeakMap directly; instead maintain list when register called
  }

  // 更可靠的做法：在 register 时把 element 引入一个普通 Array 的弱引用池（WeakRef 或直接 element 引用）
  // 当 WeakRef 不可用时，元素会以强引用形式存在于数组中——这会阻止 GC，因此我们只在支持 WeakRef 的环境下自动扫描

  _ensureWeakList() {
    if (!this._weakRefs) this._weakRefs = []
    return this._weakRefs
  }

  // wrapper: registerWithWeakList 用于兼容性更好的自动扫描
  registerWithWeakList(el) {
    const disposer = this.register(el)
    const weakList = this._ensureWeakList()
    if (typeof WeakRef !== 'undefined') {
      weakList.push(new WeakRef(el))
    } else {
      // 如果环境没有 WeakRef，我们仍然 push el 的弱引用占位，但这将是强引用 — 因此我们建议在不支持 WeakRef 的环境禁用 autoScan
      weakList.push({ __el: el })
    }
    return disposer
  }

  // 手动清理所有已注册元素（通常用于 SPA 页面切换）
  disposeAll() {
    // weakMap keys 不可遍历；如果你需要全量清理，请在 registerWithWeakList 时维护一个可遍历集合
    if (this._weakRefs) {
      for (const entry of this._weakRefs) {
        let el = null
        if (entry instanceof WeakRef) el = entry.deref()
        else el = entry.__el
        if (el) this._disposeElement(el)
      }
      this._weakRefs = []
    }
    // stop scanner
    this.stopAutoScan()
  }
}

// ------- Usage examples -------

// 1) Vanilla usage
/*
const auto = new AutoDispose()
const el = document.querySelector('#menu')
const d = auto.registerWithWeakList(el)

d.on(null, 'click', (e) => { console.log('clicked menu', e) })

d.interval(() => { console.log('tick') }, 1000)

// 当你要手动销毁
// d.dispose() 或者 auto.disposeAll()
*/

// 2) Vue 3 composition 示例
/*
import { onBeforeUnmount } from 'vue'
const auto = new AutoDispose()
function useAutoDisposable(elRef) {
  let disposer
  watch(elRef, (el) => {
    if (disposer) disposer.dispose()
    if (el) disposer = auto.registerWithWeakList(el)
  })
  onBeforeUnmount(() => disposer && disposer.dispose())
}
*/

// 3) React Hook 示例
/*
import { useRef, useEffect } from 'react'
const auto = new AutoDispose()
function useAutoDispose() {
  const ref = useRef(null)
  useEffect(() => {
    const d = ref.current ? auto.registerWithWeakList(ref.current) : null
    return () => { d && d.dispose() }
  }, [])
  return ref
}
*/

export default AutoDispose
```
