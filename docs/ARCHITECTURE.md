# Architecture

High-level design for Callister Studio. This document will grow as the codebase is scaffolded.

## Overview

Callister Studio is an Electron desktop application organized as a **pnpm monorepo**. The renderer hosts React playgrounds for each AI domain; the main process handles credentials, local subprocesses, and persistence.

```
callister-studio/
├── apps/
│   └── desktop/                 # Electron app (main / preload / renderer)
├── packages/
│   ├── ui/                      # @callister/ui — shared components
│   ├── core/                    # @callister/core — provider interfaces, pipeline runner
│   ├── providers/               # @callister/providers — cloud & local adapters
│   └── trace/                   # @callister/trace — request logging, spans
└── docs/
```

## Process model

| Process      | Responsibility                                                              |
| ------------ | --------------------------------------------------------------------------- |
| **Main**     | Window lifecycle, secure credential vault, SQLite, local model subprocesses |
| **Preload**  | Typed IPC bridge (context isolation)                                        |
| **Renderer** | React UI, playgrounds, trace inspector                                      |

## Core abstractions

Built in Phase 1; reused by every playground module.

### `ProviderAdapter`

Unified interface for cloud APIs and local backends:

- `configure()` — API keys, base URL, model defaults
- `invoke()` — single-shot request
- `stream()` — streaming response
- `healthCheck()` — connectivity probe

### `TraceSession`

Every run gets a session ID with steps, timings, and payloads. Surfaced in the trace inspector (latency, tokens, raw JSON, timeline).

### `Fixture`

Reusable test input: file path, text, or structured params. Import/export for provider comparison.

### `PlaygroundModule`

Sidebar entry + route + default layout. Conceptual contract:

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
- Theme: light / dark / system via CSS variables

## Tech stack

| Layer       | Choice                                        |
| ----------- | --------------------------------------------- |
| Desktop     | Electron 33+                                  |
| Build       | electron-vite, TypeScript                     |
| UI          | React 18, Tailwind CSS, shadcn/ui             |
| State       | Zustand, TanStack Query                       |
| Persistence | better-sqlite3 (main), electron-store (prefs) |
| Packaging   | electron-builder                              |
| Monorepo    | pnpm workspaces, Turborepo                    |

## Build phases

See [ROADMAP.md](ROADMAP.md) for the full phased checklist (Phases 0–11).

**v0.1.0:** Phase 0 + 1 + 2 — app shell, LLM playground, trace inspector.
