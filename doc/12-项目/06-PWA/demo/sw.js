/* Service Worker with TTL cache (3 minutes) for both static & API */

const VERSION = "v1.0.0";
const STATIC_CACHE = `static-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;
const TTL_MS = 3 * 60 * 1000; // 3 minutes
const TS_HEADER = "x-sw-cache-time";

/** 需要预缓存的静态资源（首屏关键资源） */
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(PRECACHE_URLS);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // 清理旧版本缓存
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => ![STATIC_CACHE, RUNTIME_CACHE].includes(k))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

/** 根据响应写入时间戳头，返回新 Response（用于实现 TTL） */
async function wrapWithTimestamp(resp) {
  // Opaque 响应（多见于 no-cors 跨域）无法读取或改头，直接返回原响应且不缓存
  if (!resp || resp.type === "opaque") return null;

  const cloned = resp.clone();
  const headers = new Headers(cloned.headers);
  headers.set(TS_HEADER, Date.now().toString());
  const body = await cloned.blob();
  return new Response(body, {
    status: cloned.status,
    statusText: cloned.statusText,
    headers,
  });
}

/** 判断缓存是否在有效期内 */
function isFresh(resp) {
  if (!resp) return false;
  const ts = resp.headers.get(TS_HEADER);
  if (!ts) return false;
  const age = Date.now() - Number(ts);
  return age >= 0 && age <= TTL_MS;
}

/** 是否同源并且允许缓存 */
function isCacheable(request, response) {
  if (!response || response.status !== 200) return false;
  try {
    const reqUrl = new URL(request.url);
    const swUrl = new URL(self.registration.scope);
    if (reqUrl.origin !== swUrl.origin) return false; // 仅同源缓存，简化 TTL 处理
  } catch (_) {
    return false;
  }
  // 仅缓存 GET
  return request.method === "GET";
}

/** 统一的 “强制 TTL” 策略：新鲜则返回缓存；否则必须走网络 */
async function fetchWithStrictTTL(event) {
  const request = event.request;

  // 尝试匹配静态/运行时缓存
  const cached =
    (await caches.match(request, { cacheName: STATIC_CACHE })) ||
    (await caches.match(request, { cacheName: RUNTIME_CACHE }));

  // 在有效期内 → 直接返回缓存
  if (cached && isFresh(cached)) {
    return cached;
  }

  // 过期或未命中 → 必须从网络获取
  try {
    const networkResp = await fetch(request);

    if (isCacheable(request, networkResp)) {
      const wrapped = await wrapWithTimestamp(networkResp);
      if (wrapped) {
        const cache = await caches.open(
          PRECACHE_URLS.includes(new URL(request.url).pathname)
            ? STATIC_CACHE
            : RUNTIME_CACHE
        );
        cache.put(request, wrapped.clone());
        return wrapped;
      }
    }
    // 不可缓存或跨域 → 直接返回网络响应
    return networkResp;
  } catch (err) {
    // 要求“过期后必须从后端拉取”，因此此处**不回退陈旧缓存**
    // 直接抛出/返回错误响应
    return new Response(
      JSON.stringify({ error: "Network failed and no fresh cache available" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}

/** 路由：静态、API 和默认统一走严格 TTL */
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // 仅处理 GET
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // —— 本地模拟 API：/api/time（你有真实后端时可移除此分支）——
  if (url.origin === location.origin && url.pathname === "/api/time") {
    event.respondWith(
      (async () => {
        // 看看缓存是否新鲜
        const cached = await caches.match(request, {
          cacheName: RUNTIME_CACHE,
        });
        if (cached && isFresh(cached)) return cached;

        // 生成一个动态响应（当前时间），并缓存（带时间戳头）
        const payload = { now: new Date().toISOString() };
        const json = new Response(JSON.stringify(payload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
        const wrapped = await wrapWithTimestamp(json);
        const cache = await caches.open(RUNTIME_CACHE);
        await cache.put(request, wrapped.clone());
        return wrapped;
      })()
    );
    return;
  }

  // 其他资源统一严格 TTL
  event.respondWith(fetchWithStrictTTL(event));
});
