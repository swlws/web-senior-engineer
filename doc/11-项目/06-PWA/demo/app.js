// 简易接口模拟：/api/time —— 由静态服务器回落不到时可用本地模拟；
// 若你有真实后端，改成你的真实接口即可。
//
// 方案 A（推荐）：在你的后端提供 /api/time。
// 方案 B（本地模拟）：用 Service Worker 的 fetch 事件在 /api/time 分支返回动态时间。
// 本示例采用 B（见 sw.js 中 “本地模拟 API”）。

const $ = (sel) => document.querySelector(sel);

$("#reload-img").addEventListener("click", async () => {
  const img = new Image();
  img.src = `/icons/icon-192.png?ts=${Date.now()}`; // 加个查询防止浏览器自身内存缓存干扰演示
  img.width = 96;
  img.height = 96;
  img.alt = "logo";
  const target = $("#reload-img");
  target.insertAdjacentElement("afterend", img);
  $("#img-status").textContent = "已再次请求图片（看 Network 面板）";
});

$("#fetch-api").addEventListener("click", async () => {
  try {
    const res = await fetch("/api/time", {
      headers: { Accept: "application/json" },
    });
    const text = await res.text();
    $(
      "#api-result"
    ).textContent = `${new Date().toLocaleTimeString()} → ${text}`;
  } catch (e) {
    $("#api-result").textContent = `请求失败：${e}`;
  }
});

$("#clear-caches").addEventListener("click", async () => {
  const keys = await caches.keys();
  await Promise.all(keys.map((k) => caches.delete(k)));
  alert("已清空 CacheStorage");
});
