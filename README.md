# Portfolio Website

A production-ready personal portfolio built with Astro and Bun, with a stateless AI assistant powered by TogetherAI.

The site is static-first for speed and reliability: profile pages are pre-rendered, while the chat endpoint is serverless.

## Highlights

- TypeScript across pages, components, integrations, and API route
- Astro static architecture with a single interactive React chat island
- Static JSON-backed achievements data for GitHub, StackOverflow, and Kaggle
- Hono + TogetherAI chat endpoint with input sanitization and rate limiting
- Clean project structure and Makefile shortcuts for day-to-day development

## Tech Stack

- Runtime and package manager: Bun
- Web framework: Astro 4
- UI styling: Tailwind CSS
- Client interactivity: React (Astro island)
- API router: Hono
- LLM provider: TogetherAI
- Model: openai/gpt-oss-120b
- Hosting target: Vercel with Node.js runtime for API routes

## Quick Start

```bash
make install
cp .env.example .env
make dev
```

Development server runs at `http://localhost:4321`.

## Makefile Commands

```bash
make help
make install
make dev
make build
make preview
make check
make test
make clean
```

## Environment Variables

Copy `.env.example` to `.env` and fill values:

```bash
TOGETHER_API_KEY=your_together_api_key_here
PUBLIC_OWNER_NAME="Your Full Name"
PUBLIC_OWNER_TAGLINE="Your tagline"
PUBLIC_SITE_URL=https://yoursite.vercel.app
```

## Architecture Notes

- Public pages are generated statically at build time.
- Platform stats are loaded from local context JSON.
- Chat route lives in `api/chat.ts` and streams responses from TogetherAI.
- Chat is stateless: no message history persistence.
- Rate limit is enforced in-memory per IP.

## Deployment

### Vercel

The portfolio is deployed using Vercel. Set all required environment variables in the Vercel project dashboard.

### GitHub Actions CI/CD

This repository includes two workflows:
- `.github/workflows/test.yml`
	- Triggers on push to `dev` and `main`
	- Runs `bun run check` and `bun run test`
- `.github/workflows/deploy.yml`
	- Triggers after `CI Tests` completes
	- Deploys to Vercel production only when tests succeeded for `main`
	- Deploys the exact tested commit from `main`

Required GitHub repository secrets:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

