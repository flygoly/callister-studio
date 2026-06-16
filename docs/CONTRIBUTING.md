# Contributing

Thank you for your interest in Callister Studio.

## Project stage

The project is in **early development**. Documentation and roadmap exist; the Electron app scaffold is not yet in the repository. Check [ROADMAP.md](ROADMAP.md) for what is planned and what is in progress.

## How to contribute

1. Open an issue to discuss larger changes before starting work.
2. Fork the repository and create a feature branch.
3. Keep pull requests focused — one concern per PR when possible.
4. Match existing code style once the toolchain (ESLint, Prettier) is in place.

## Good first contributions

- **Provider adapters** — wrap a cloud API or local library behind `ProviderAdapter`
- **Playground modules** — ASR, TTS, OCR, CV, NLP tooling
- **Documentation** — improve README, architecture notes, or in-app help copy
- **Fixtures** — sample test cases for comparing providers

## Development setup

> Coming soon — after Phase 0 monorepo scaffold.

```bash
git clone https://github.com/flygoly/callister-studio.git
cd callister-studio
pnpm install
pnpm dev
```

**Prerequisites:** Node.js 20+, pnpm 9+

## Code of conduct

Be respectful and constructive. This is a learning-oriented open-source project.

## License

By contributing, you agree that your contributions will be licensed under the [Apache License 2.0](../LICENSE).
