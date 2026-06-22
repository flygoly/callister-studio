# Callister Studio

English | [简体中文](README.zh-CN.md)

> A cross-platform desktop workbench for debugging, testing, and learning AI.

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)
![Status](https://img.shields.io/badge/Status-Early%20Development-orange)

## What is Callister Studio?

Callister Studio is an open-source **desktop workbench** that makes AI processes visible. Run an input, trace each step, inspect raw requests and responses, and compare outputs across providers. It is built for developers and learners who want to explore third-party AI services and open-source libraries — from ASR and TTS to LLMs, agents, OCR, and computer vision.

**What it is:** a local tool for debugging, testing, visualizing, and understanding AI pipelines.

**What it is not:** a production inference server, a chat-only client, or a model-training platform.

## Why use it?

- **See inside an AI call** — latency, token usage, raw JSON, and a step-by-step timeline
- **Test in one place** — cloud APIs and local models behind a unified interface
- **Compare providers** — run the same fixture side-by-side and diff results
- **Learn by doing** — understand how ASR, TTS, LLM, Agent, OCR, and CV pipelines actually work

## Features (planned / in progress)

| Module    | Debug & trace                   | Learn & visualize     | Status        |
| --------- | ------------------------------- | --------------------- | ------------- |
| LLM       | streaming, token stats, raw I/O | prompt experiments    | **Available** |
| ASR       | waveform + timestamps           | transcript alignment  | **Available** |
| TTS       | latency metrics                 | voice A/B comparison  | Planned       |
| NLP       | tokenization view               | embeddings explorer   | Planned       |
| Agent     | tool-call timeline              | step-by-step loop     | Planned       |
| OCR / CV  | bounding boxes                  | confidence overlays   | Planned       |
| Pipelines | end-to-end trace                | chain ASR → LLM → TTS | Planned       |

**ASR providers:** OpenAI Whisper, faster-whisper (local), iFlytek IAT (short) and LFASR (long).

Full phased checklist: [docs/ROADMAP.md](docs/ROADMAP.md)

## Screenshots

<!-- TODO: add screenshots after Phase 1 app shell -->

_App shell, LLM playground, and ASR workbench are functional — screenshot gallery coming in Phase 11._

## Quick Start

**Prerequisites:** Node.js 20+, pnpm 9+

```bash
git clone https://github.com/flygoly/callister-studio.git
cd callister-studio
pnpm install
pnpm dev
```

`pnpm dev` starts the Electron desktop app. Other useful commands:

```bash
pnpm build      # production build
pnpm typecheck  # TypeScript checks
pnpm lint       # ESLint
```

## Supported platforms

Windows · macOS · Linux (via Electron)

## Tech stack

- **Desktop:** Electron 33+
- **UI:** React 18, TypeScript, custom `@callister/ui` components
- **Build:** electron-vite, pnpm workspaces, Turborepo
- **State:** Zustand

Details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Project status

**Early development.** Phases 0–2 are complete; Phase 3 (ASR) is largely in place.

- **Available:** App shell, settings/credentials, LLM playground with trace inspector, ASR workbench with waveform and iFlytek integration
- **Roadmap:** [docs/ROADMAP.md](docs/ROADMAP.md)
- **v0.1.0 target:** app shell + LLM playground + trace inspector (met)
- **v0.2.0 target:** ASR + TTS + one pipeline preset (ASR in progress)

## Contributing

Contributions are welcome. See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).

Good first contributions: provider adapters, playground modules, and documentation.

## License

Apache 2.0 — see [LICENSE](LICENSE)
