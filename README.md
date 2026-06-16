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

Nothing is marked _Available_ yet. This project is in early development.

| Module    | Debug & trace                   | Learn & visualize     |
| --------- | ------------------------------- | --------------------- |
| LLM       | streaming, token stats, raw I/O | prompt experiments    |
| ASR       | waveform + timestamps           | transcript alignment  |
| TTS       | latency metrics                 | voice A/B comparison  |
| NLP       | tokenization view               | embeddings explorer   |
| Agent     | tool-call timeline              | step-by-step loop     |
| OCR / CV  | bounding boxes                  | confidence overlays   |
| Pipelines | end-to-end trace                | chain ASR → LLM → TTS |

Full phased checklist: [docs/ROADMAP.md](docs/ROADMAP.md)

## Screenshots

<!-- TODO: add screenshots after Phase 1 app shell -->

_Coming soon — UI is not built yet._

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
- **UI:** React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Build:** electron-vite, pnpm workspaces, Turborepo
- **State:** Zustand, TanStack Query

Details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## Project status

**Early development.** Phase 0–2 are in place: monorepo shell, settings/credentials, and LLM playground with trace inspector.

- **Latest:** LLM playground with streaming, sessions, fixture export
- **Roadmap:** [docs/ROADMAP.md](docs/ROADMAP.md)

## Contributing

Contributions are welcome. See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).

Good first contributions: provider adapters, playground modules, and documentation.

## License

Apache 2.0 — see [LICENSE](LICENSE)
