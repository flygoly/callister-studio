# Callister Studio

[English](README.md) | 简体中文

> 跨平台桌面工作台，用于 AI 的调试、测试、学习与过程可视化。

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)
![Status](https://img.shields.io/badge/Status-早期开发中-orange)

## Callister Studio 是什么？

Callister Studio 是一款开源的**桌面工作台**，让 AI 的处理过程变得可见。输入数据、逐步追踪、检查原始请求与响应、横向对比不同服务商的输出。面向正在探索第三方 AI 服务与开源库的开发者和学习者，覆盖 ASR、TTS、LLM、Agent、OCR、计算机视觉等方向。

**它是什么：** 用于调试、测试、呈现与学习 AI 流水线的本地桌面工具。

**它不是什么：** 生产级推理服务、纯聊天客户端，或模型训练平台。

## 为什么使用它？

- **看清 AI 调用内部** — 延迟、Token 用量、原始 JSON、逐步时间线
- **统一测试入口** — 在同一界面调用云端 API 与本地模型
- **横向对比** — 用相同测试用例（Fixture）对比不同服务商并 diff 结果
- **边做边学** — 理解 ASR、TTS、LLM、Agent、OCR、CV 等流水线如何工作

## 功能（规划中 / 开发中）

| 模块      | 调试与追踪                     | 学习与可视化         | 状态       |
| --------- | ------------------------------ | -------------------- | ---------- |
| LLM       | 流式输出、Token 统计、原始 I/O | Prompt 实验          | **已可用** |
| ASR       | 波形 + 时间戳                  | 转写对齐             | **已可用** |
| TTS       | 延迟指标                       | 音色 A/B 对比        | 规划中     |
| NLP       | 分词视图                       | 向量探索             | 规划中     |
| Agent     | 工具调用时间线                 | 逐步循环可视化       | 规划中     |
| OCR / CV  | 边界框标注                     | 置信度叠加           | 规划中     |
| Pipelines | 端到端追踪                     | 串联 ASR → LLM → TTS | 规划中     |

**ASR 服务商：** OpenAI Whisper、faster-whisper（本地）、讯飞 IAT（短语音）与 LFASR（长语音）。

完整路线图（英文）：[docs/ROADMAP.md](docs/ROADMAP.md)

## 截图

<!-- TODO: Phase 1 壳层完成后添加截图 -->

_应用壳层、LLM 演练场与 ASR 工作台已可用 — 截图画廊将在 Phase 11 补充。_

## 快速开始

**环境要求：** Node.js 20+、pnpm 9+

```bash
git clone https://github.com/flygoly/callister-studio.git
cd callister-studio
pnpm install
pnpm dev
```

`pnpm dev` 启动 Electron 桌面应用。其他常用命令：

```bash
pnpm build      # 生产构建
pnpm typecheck  # TypeScript 检查
pnpm lint       # ESLint
```

## 支持平台

Windows · macOS · Linux（基于 Electron）

## 技术栈

- **桌面端：** Electron 33+
- **界面：** React 18、TypeScript、`@callister/ui` 组件库
- **构建：** electron-vite、pnpm workspaces、Turborepo
- **状态：** Zustand

详见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## 项目状态

**早期开发中。** Phase 0–2 已完成；Phase 3（ASR）大部分已就绪。

- **已可用：** 应用壳层、设置/凭证管理、带追踪检查器的 LLM 演练场、带波形与讯飞集成的 ASR 工作台
- **路线图：** [docs/ROADMAP.md](docs/ROADMAP.md)（英文）
- **v0.1.0 目标：** 应用壳层 + LLM 演练场 + 追踪检查器（已达成）
- **v0.2.0 目标：** ASR + TTS + 一条流水线预设（ASR 进行中）

## 参与贡献

欢迎贡献，请参阅 [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)。

适合入门的贡献方向：服务商适配器、演练场模块、文档完善。

## 许可证

Apache 2.0 — 见 [LICENSE](LICENSE)
