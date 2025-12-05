# WebSocket 工具

## Tool

```js
 // ReconnectingWebSocket.js
class ReconnectingWebSocket {
  constructor(url, opts = {}) {
    this.url = url
    this.protocols = opts.protocols
    this.ws = null
    this.retryCount = 0
    this.forcedClose = false
    this.reconnectTimer = null
    this.sendQueue = []
    this.heartbeatTimer = null
    this.connectTimeoutTimer = null

    this.options = {
      maxRetries: opts.maxRetries ?? Infinity,
      initialDelay: opts.initialDelay ?? 1000,
      maxDelay: opts.maxDelay ?? 30000,
      backoffFactor: opts.backoffFactor ?? 1.5,
      jitter: opts.jitter ?? 0.2,
      heartbeatInterval: opts.heartbeatInterval ?? 0,
      heartbeatMsg: opts.heartbeatMsg ?? '__ping__',
      timeout: opts.timeout ?? 0,
      autoOpen: opts.autoOpen ?? true,
      debug: opts.debug ?? false
    }

    this.onopen = null
    this.onclose = null
    this.onmessage = null
    this.onerror = null
    this.onreconnect = null

    if (this.options.autoOpen) this.open()

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        if (this.options.debug) console.info('[RWS] online')
        this.tryReconnect(0)
      })
      window.addEventListener('offline', () => {
        if (this.options.debug) console.info('[RWS] offline')
        this.clearTimers()
      })
    }
  }

  log(...args) {
    if (this.options.debug) console.debug('[RWS]', ...args)
  }

  open() {
    this.forcedClose = false
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return
    this.connect()
  }

  connect() {
    this.clearTimers()
    try {
      this.log('connecting', this.url)
      this.ws = this.protocols ? new WebSocket(this.url, this.protocols) : new WebSocket(this.url)
    } catch (err) {
      this.log('constructor error', err)
      this.scheduleReconnect()
      return
    }

    if (this.options.timeout) {
      this.connectTimeoutTimer = setTimeout(() => {
        this.log('connect timeout')
        this.cleanupSocket()
        this.scheduleReconnect()
      }, this.options.timeout)
    }

    this.ws.onopen = ev => {
      if (this.connectTimeoutTimer) {
        clearTimeout(this.connectTimeoutTimer)
        this.connectTimeoutTimer = null
      }
      this.retryCount = 0
      this.startHeartbeat()
      this.flushQueue()
      this.onopen && this.onopen(ev)
      if (this.retryCount > 0) this.onreconnect && this.onreconnect()
    }

    this.ws.onmessage = ev => {
      this.onmessage && this.onmessage(ev.data, ev)
    }

    this.ws.onclose = ev => {
      this.log('closed', ev.code, ev.reason)
      this.stopHeartbeat()
      this.onclose && this.onclose(ev)
      if (!this.forcedClose) this.scheduleReconnect()
    }

    this.ws.onerror = ev => {
      this.log('error', ev)
      this.onerror && this.onerror(ev)
    }
  }

  cleanupSocket() {
    if (!this.ws) return
    try {
      this.ws.onopen = this.ws.onmessage = this.ws.onclose = this.ws.onerror = null
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close()
      }
    } catch (e) {}
    this.ws = null
  }

  close() {
    this.forcedClose = true
    this.clearTimers()
    this.cleanupSocket()
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data)
    } else {
      this.sendQueue.push(data)
    }
  }

  flushQueue() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    while (this.sendQueue.length) {
      const d = this.sendQueue.shift()
      try {
        this.ws.send(d)
      } catch (e) {
        this.sendQueue.unshift(d)
        break
      }
    }
  }

  scheduleReconnect() {
    if (this.forcedClose) return
    if (this.retryCount >= this.options.maxRetries) {
      this.log('max retries reached')
      return
    }
    this.retryCount += 1
    const base = this.options.initialDelay * Math.pow(this.options.backoffFactor, this.retryCount - 1)
    const capped = Math.min(base, this.options.maxDelay)
    const jitter = (Math.random() * 2 - 1) * this.options.jitter * capped
    const delay = Math.max(0, Math.floor(capped + jitter))
    this.log('reconnect in', delay)
    this.reconnectTimer = setTimeout(() => this.connect(), delay)
  }

  tryReconnect(delay = 0) {
    if (this.forcedClose) return
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.reconnectTimer = setTimeout(() => this.connect(), delay)
  }

  startHeartbeat() {
    if (this.options.heartbeatInterval <= 0) return
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
      try {
        this.ws.send(this.options.heartbeatMsg)
      } catch (e) {
        this.log('heartbeat failed', e)
      }
    }, this.options.heartbeatInterval)
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  clearTimers() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.connectTimeoutTimer) {
      clearTimeout(this.connectTimeoutTimer)
      this.connectTimeoutTimer = null
    }
    this.stopHeartbeat()
  }

  get readyState() {
    return this.ws ? this.ws.readyState : WebSocket.CLOSED
  }

  replaceUrl(newUrl) {
    this.url = newUrl
    this.close()
    this.forcedClose = false
    this.open()
  }
}

const rws = new ReconnectingWebSocket('ws://localhost:3000/ws/chat', {
  initialDelay: 1000,
  maxDelay: 20000,
  maxRetries: Infinity,
  heartbeatInterval: 20 * 1000,
  heartbeatMsg: JSON.stringify({ type: 'ping' }),
  timeout: 10000,
  debug: true
})

rws.onopen = () => console.log('connected')
rws.onmessage = msg => console.log('msg', msg)
rws.onclose = () => console.log('closed')
rws.onerror = e => console.warn('ws error', e)

// 发送数据（若未连接会入队）
rws.send(JSON.stringify({ type: 'hello' }))

```
