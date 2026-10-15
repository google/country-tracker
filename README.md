# 🌎 Country Tracker

**This project is intended for demonstration purposes only. It is not
intended for use in a production environment.**

**Country Tracker** is a fun project built to visually and collaboratively document your worldwide travels. Stamp your digital passport, compete with friends in global and private group leaderboards, and manage your digital travel persona.

**🤖 100% AI-Built Project**: This application was built entirely using AI (leveraging Google's AI capabilities and the Antigravity coding assistant) to explore and demonstrate the capabilities of AI-driven coding today.

> ⚠️ **Generative AI Disclaimer**: As this project was built using generative AI, it may contain mistakes or unintended behaviors. It is meant to be a learning example and a proof of concept, not a production-ready application. If you choose to deploy it, you must thoroughly check all functionality. There is no promise of correctness or warranty of any kind.

> ⚠️ **Caution Security Disclaimer**: This project is provided "as is" as a fun proof of concept. Users are responsible for reviewing and testing all backend security rules before any production deployment. See [SECURITY.md](./docs/SECURITY.md) for the full policy.

## 🔑 Prerequisites

This application supports multiple backend solutions via an abstraction layer.

- **PocketBase (Default)**: A lightweight, single-file open-source backend. See [PocketBase Guide](./docs/pocketbase/README.md) for setup and schema instructions.
- **Firebase (Option)**: Supported as an alternative backend. See [Firebase Guide](./docs/firebase/README.md) for setup and deployment instructions.
- **Custom Backend**: You can implement your own backend by fulfilling the interfaces defined in the abstraction layer. See [Architecture Guide](./docs/ARCHITECTURE.md) for details.

Before running the application locally, you must:
1. Create a `.env.local` file and set `NEXT_PUBLIC_BACKEND_TYPE` to your desired backend, along with the specific configuration for that backend.
2. Provide your own country list in `config/countries.json` (following [`config/countries.schema.json`](./config/countries.schema.json)). Because country lists can vary by use case or organization, no hardcoded list is bundled in source control. You can copy [`config/countries.example.json`](./config/countries.example.json) to get started quickly.

## 🚀 Quick Start

Ensure you are using the correct Node version specified in our `.nvmrc` file:
```bash
nvm use
npm install
cp config/countries.example.json config/countries.json
echo 'NEXT_PUBLIC_POCKETBASE_URL="http://127.0.0.1:8090"' >> .env.local
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) inside your web browser. By default, the application runs on PocketBase with native email/password authentication and zero external cloud dependencies. If you prefer to use Firebase instead, set `NEXT_PUBLIC_BACKEND_TYPE="firebase"` in `.env.local` and see the [Firebase Guide](./docs/firebase/README.md).

## 📚 Documentation Reference

To maintain an uncluttered root repository, extensive engineering and DevOps specifications have been categorized into the `/docs/` directory:

| Guide | Description |
|---|---|
| 🛡️ **[PocketBase Docs](./docs/pocketbase/)** | Setup, schema, and deployment guides for the default PocketBase backend. |
| 🔥 **[Firebase Docs](./docs/firebase/)** | Setup, security rules, and deployment guides for the alternative Firebase backend. |
| 🏛 **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** | Technical design document covering SWR caching layers, backend abstraction interfaces, data mapping, and country list configuration. |
| 🔒 **[SECURITY.md](./docs/SECURITY.md)** | Proof-of-concept security disclaimer and references to backend security rules. |
| 🎨 **[STYLE_GUIDES.md](./docs/STYLE_GUIDES.md)** | TypeScript, HTML/CSS, and testing style conventions enforced across the codebase. |
| 🧰 **[TECH_STACK.md](./docs/TECH_STACK.md)** | Overview of the frontend, backend, and testing frameworks used. |
| 📋 **[PRODUCT.md](./docs/PRODUCT.md)** | Product vision, user stories, and design guidelines. |

## 🧪 Testing & CI

We utilize Jest, React Testing Library, ESLint, and TypeScript to validate code quality and prevent regressions:
```bash
npm run lint
npx tsc --noEmit
npm test
```

All pull requests and commits to `main` are automatically validated by our [GitHub Actions CI workflow](./.github/workflows/ci.yml), which checks out the repository using the Node.js version specified in `.nvmrc` and runs linting, static type checking, and the full Jest test suite with coverage.

## 🤝 Contributing & License

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) and [Code of Conduct](./CODE_OF_CONDUCT.md) before submitting a pull request.

Copyright 2026 Google LLC. Licensed under the [Apache 2.0 License](./LICENSE).

## Misc

This is not an officially supported Google product. This project is not eligible for the [Google Open Source Software Vulnerability Rewards Program](https://bughunters.google.com/open-source-security).

