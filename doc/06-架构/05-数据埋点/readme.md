# 埋点

## 常见的 Web 埋点工具 可以分为三类：

1. 通用分析平台（最常见）

- Google Analytics (GA4)：全球最常用的埋点与流量分析工具，支持事件埋点、转化追踪、用户路径分析。
- Adobe Analytics：企业级方案，功能全面但学习成本高，常配合 Adobe Experience Cloud。
- Mixpanel：以事件分析为核心，擅长漏斗分析、留存分析，适合产品数据驱动增长。
- Amplitude：专注用户行为分析和增长模型，支持 cohort 分析、AB 测试，偏向产品经理使用。

2. 国内常见埋点工具

- 友盟（Umeng）+ 阿里数据：较早的移动 & Web 埋点方案，接入简单。
- 神策数据（Sensors Data）：支持全埋点、可视化埋点，企业常用。
- GrowingIO：无埋点埋点和可视化事件配置，适合快速上线。
- 百度统计：免费的流量和行为分析工具，常见于国内站点。
- TalkingData：移动端起家，现也支持 Web。

3. 前端埋点/日志采集 SDK（更偏工程化）

- Sentry：偏向错误埋点（前端异常、性能监控）。
- Datadog / NewRelic：全链路监控，含前端埋点能力。
- OpenTelemetry：开源可观测性标准，支持事件、日志、链路追踪。
- PostHog：开源替代 Mixpanel/Amplitude，可私有化部署。
- 自研埋点 SDK：企业常见，基于 window.addEventListener + fetch/beacon 实现事件采集。

## 📊 总结

- 如果你要做 流量/转化分析 → Google Analytics / 百度统计。
- 如果要做 产品行为分析 → Mixpanel / Amplitude / 神策 / GrowingIO。
- 如果要做 前端性能 & 错误监控 → Sentry / Datadog / OpenTelemetry。
- 如果企业要求 私有化部署 & 数据安全 → PostHog / 神策 / 自研。
