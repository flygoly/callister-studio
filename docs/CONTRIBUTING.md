# Contributing

Thank you for your interest in Callister Studio.

## Project stage

The project is in **early development**. Phase 0–2 are complete; the LLM playground and ASR workbench are functional. TTS, Agent, OCR, CV, NLP, and Pipelines are placeholders. Check [ROADMAP.md](ROADMAP.md) for what is planned and what is in progress.

## How to contribute

1. Open an issue to discuss larger changes before starting work.
2. Fork the repository and create a feature branch.
3. Keep pull requests focused — one concern per PR when possible.
4. Run `pnpm typecheck` and `pnpm lint` before submitting.

## Good first contributions

- **Provider adapters** — wrap a cloud API or local library behind `ProviderAdapter` or `AsrProviderAdapter`
- **Playground modules** — TTS, OCR, CV, NLP tooling
- **Documentation** — improve README, architecture notes, or in-app help copy
- **Fixtures** — sample test cases for comparing providers

## Development setup

```bash
git clone https://github.com/flygoly/callister-studio.git
cd callister-studio
pnpm install
pnpm dev
```

**Prerequisites:** Node.js 20+, pnpm 9+

Useful scripts:

```bash
pnpm build      # production build
pnpm typecheck  # TypeScript checks
pnpm lint       # ESLint
pnpm format     # Prettier
```

## Repository layout

See [ARCHITECTURE.md](ARCHITECTURE.md) for monorepo structure and core abstractions.

## Code of conduct

Be respectful and constructive. This is a learning-oriented open-source project.

## License

By contributing, you agree that your contributions will be licensed under the [Apache License 2.0](../LICENSE).
