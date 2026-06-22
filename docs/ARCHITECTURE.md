# Architecture

High-level design for Callister Studio. See [ROADMAP.md](ROADMAP.md) for the phased build plan.

## Overview

Callister Studio is an Electron desktop application organized as a **pnpm monorepo**. The renderer hosts React playgrounds for each AI domain; the main process handles credentials, local subprocesses, and persistence.

## Monorepo layout

```
callister-studio/
├── README.md                    # Project intro — English
├── README.zh-CN.md              # Project intro — 简体中文
├── apps/
│   └── desktop/                 # Electron app entry
│       ├── src/main/            # Main process (IPC, services, credential vault)
│       ├── src/preload/         # Typed IPC bridge
│       └── src/renderer/        # React UI (pages, layouts, stores)
├── packages/
│   ├── ui/                      # @callister/ui — shared components
│   ├── core/                    # @callister/core — types, settings, IPC contracts
│   ├── providers/               # @callister/providers — cloud & local adapters
│   └── trace/                   # @callister/trace — request logging, spans
├── docs/
│   ├── ROADMAP.md               # Phased checklist (Phases 0–11)
│   ├── ARCHITECTURE.md          # This file
│   └── CONTRIBUTING.md
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Process model

| Process      | Responsibility                                                              |
| ------------ | --------------------------------------------------------------------------- |
| **Main**     | Window lifecycle, secure credential vault, ASR/LLM services, file dialogs |
| **Preload**  | Typed IPC bridge (`CallisterBridge`) with context isolation                 |
| **Renderer** | React UI, playgrounds, trace inspector                                    |

## Core abstractions

Built in Phase 1; reused by every playground module. Types live in `@callister/core`; adapters in `@callister/providers`.

### `ProviderAdapter` (LLM)

Unified interface for cloud APIs and local backends:

- `configure()` — API keys, base URL, model defaults
- `stream()` — streaming chat completion
- `healthCheck()` — connectivity probe

### `AsrProviderAdapter` (ASR)

- `transcribe()` — file-based speech-to-text with raw request/response trace
- Provider-specific auth (e.g. iFlytek HMAC signatures) handled in main process

### `TraceSession`

Every run gets a session ID with steps, timings, and payloads. Surfaced in the trace inspector (latency, tokens, raw JSON, timeline).

### `Fixture`

Reusable test input: file path, text, or structured params. Import/export for provider comparison and session replay.

### `PlaygroundModule` (conceptual)

Sidebar entry + route + default layout. Future contract for plugin modules:

```typescript
interface PlaygroundModule {
  id: string // e.g. "asr", "llm"
  label: string
  inputSchema: JsonSchema
  run(ctx: RunContext): AsyncIterable<RunEvent>
}
```

## UI layout

```
┌──────────┬─────────────────────────────────────────────┐
│ Sidebar  │  Top bar (provider / model / run / export)  │
│          ├──────────────────┬──────────────────────────┤
│ Home     │  Input panel     │  Output panel            │
│ ASR      │                  │                          │
│ TTS      ├──────────────────┴──────────────────────────┤
│ LLM      │  Trace inspector (drawer or bottom panel)   │
│ ...      │                                             │
└──────────┴─────────────────────────────────────────────┘
```

**Conventions:**

- Left sidebar: module navigation (Home, ASR, TTS, LLM, Agent, OCR, CV, NLP, Pipelines, Settings)
- Split workspace: input vs output
- Trace inspector: request/response details, step timeline
- ASR: provider cards at top, per-vendor debug panel with API doc link
- Theme: light / dark / system via CSS variables

## Tech stack

| Layer       | Choice                                        |
| ----------- | --------------------------------------------- |
| Desktop     | Electron 33+                                  |
| Build       | electron-vite, TypeScript                     |
| UI          | React 18, `@callister/ui` component library   |
| State       | Zustand                                       |
| Persistence | electron-store (settings + encrypted creds)     |
| Packaging   | electron-builder                              |
| Monorepo    | pnpm workspaces, Turborepo                    |

## Build phases

See [ROADMAP.md](ROADMAP.md) for the full phased checklist (Phases 0–11).

| Milestone  | Scope                                                        |
| ---------- | ------------------------------------------------------------ |
| **v0.1.0** | Phase 0 + 1 + 2 — app shell, LLM playground, trace inspector |
| **v0.2.0** | ASR + TTS + one pipeline preset                              |
| **v1.0.0** | Core modules stable, pipeline composer, plugin API           |
