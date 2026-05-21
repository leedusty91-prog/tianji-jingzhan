# 项目记忆与设计准则 (MEMORY)

本文件记录了「断易天机」系统的项目特性、架构偏好以及开发踩坑点，以便后续维护与 AI Agent 协作。

---

## 1. 核心技术栈与架构约束

- **前端架构**：React (TypeScript) + Vite 驱动的纯前端应用，支持 100% 离线运行。
- **背景特效层**：`src/components/FlowingRiverBackground.tsx` 作为整个应用的动态底色图层，以 Canvas 实时演算波浪效果。
- **音效策略**：**禁止加载外部 MP3/WAV 媒体资源**。所有交互音效（碰撞、落地、磬音）必须采用 **Web Audio API** 进行实时合成与编排，以保障网络可用性与零资源依赖。
- **布局设计**：采用双页面全屏流（Divination View -> Result View），摒弃导致高度超出视口（overflow leaks）的侧边栏双栏布局，确保占卜交互区与解卦画卷均能获得充裕的展示空间。
- **易占逻辑**：古铜钱起卦自下而上进行（`0` 代表背面/阴爻/⚋，`1` 代表正面/阳爻/⚊），二进制转换规则必须与 `ichingData.ts` 保持一致。

---

## 2. 踩坑与经验总结 (Lessons Learned)

- **Web Audio 自动播放拦截**：
  - 浏览器会限制在没有用户手势点击之前播放声音。
  - **解决方案**：在用户第一次点击“开始起卦”按钮或摇晃竹筒时，触发 `AudioContext.resume()` 以解锁音频上下文。
- **3D 动画瞬切与重置**：
  - 在 CSS 3D 转换中，从无限循环的 `@keyframes coinFlipAnim` 切换到固定的 `rotateY` 时，可能会产生旋转突变。
  - **解决方案**：硬币处于翻转状态时添加 `.flipping` 类；落地时移除 `.flipping` 并根据正反结果赋上 `.heads` / `.tails`，利用 `.ancient-coin` 上的 `transition: transform` 平滑过渡到最终朝向。
- **页面返回时的组件状态重置**：
  - 在双页面流中，当用户从解卦页返回占卦页时，如果直接用简单的状态切换，占卜组件会保留上一次的「已完成」结果和硬币落地朝向。
  - **解决方案**：在 `<BambooDivination>` 挂载时传入 `key={viewState}`。当 `viewState` 发生切换时，React 会强制重置并重新挂载该组件，从而自动将其内部状态重置为 `'idle'`，提供干净无残留的二次起卦体验。
- **Canvas 动画后台泄漏与 CPU 占用过高**：
  - 在 React 挂载 Canvas 背景时，如果同步调用 `tick()` 又紧接着使用 `requestAnimationFrame(tick)` 调度，会导致在浏览器帧队列中注册两个重叠的动画循环。
  - **解决方案**：仅同步调用 `tick()` 一次让其自循环，或只调用一次 `requestAnimationFrame`。组件卸载时强制 `isPlayingRef.current = false` 并 `cancelAnimationFrame`，避免后台静默 CPU/GPU 泄漏。
- **组件卸载时残留异步计时器引发 AudioContext 与 React 状态泄露**：
  - 如果用户在金钱起卦中途退出（卸载组件），未清除的 `setInterval` 和 `setTimeout` 会继续在后台运行，不仅会导致 unmounted component 状态更新警告，更会因为重新实例化已经 close 的 AudioContext 导致严重的句柄泄露。
  - **解决方案**：引入 `shakeIntervalRef`、`startRevealTimeoutRef` 等 Refs，并在 `useEffect` 卸载 cleanup 中对所有 active 计时器进行强制清除。

