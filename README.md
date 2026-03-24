# Portfolio Website

A production-ready personal portfolio built with Astro and Bun, with a stateless AI assistant powered by TogetherAI.

The site is static-first for speed and reliability: profile pages are pre-rendered, while the chat endpoint is serverless.

## Highlights

- TypeScript across pages, components, integrations, and API route
- Astro static architecture with a single interactive React chat island
- Build-time platform integrations (GitHub, StackOverflow) with local fallback data
- Manual Kaggle data source for reliability
- Hono + TogetherAI chat endpoint with input sanitization and rate limiting
- Clean project structure and Makefile shortcuts for day-to-day development

## Tech Stack

- Runtime and package manager: Bun
- Web framework: Astro 4
- UI styling: Tailwind CSS
- Client interactivity: React (Astro island)
- API router: Hono
- LLM provider: TogetherAI
- Model: meta-llama/Llama-3.3-70B-Instruct-Turbo-Free
- Hosting target: Vercel with bun@1 runtime for API routes

## Quick Start

```bash
git clone https://github.com/YOU/portfolio
cd portfolio
make install
cp env.example .env.local
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

Copy `env.example` to `.env.local` and fill values:

```bash
TOGETHER_API_KEY=your_together_api_key_here
GITHUB_USERNAME=your_github_username
STACKOVERFLOW_USER_ID=12345678
KAGGLE_USERNAME=your_kaggle_username
PUBLIC_OWNER_NAME="Your Full Name"
PUBLIC_OWNER_TAGLINE="Your tagline"
PUBLIC_SITE_URL=https://yoursite.vercel.app

# Optional
GITHUB_TOKEN=ghp_your_token_here
STACKOVERFLOW_KEY=your_so_key_here
```

## Personalization Workflow

1. Update `context/PROFILE.md` with your story, skills, and goals.
2. Update `context/achievements.json` with fallback stats (especially Kaggle).
3. Update `context/certifications.json` and add badge images in `public/certs`.
4. Review landing copy and hero messaging in `src/components/Hero.astro`.
5. Check links and profile handles in `.env.local`.

## Architecture Notes

- Public pages are generated statically at build time.
- Platform stats fetch at build time and fall back to local context JSON.
- Chat route lives in `api/chat.ts` and streams responses from TogetherAI.
- Chat is stateless: no message history persistence.
- Rate limit is enforced in-memory per IP.

## Deployment

### Vercel (recommended)

```bash
bunx vercel
bunx vercel --prod
```

Set all required environment variables in the Vercel project dashboard.

## Docker Policy

This MVP does not include a Dockerfile by design, so there is no `.dockerignore` yet.
If containerization is added later, add both files together in the same change.

## Verification Checklist

```bash
make check
make test
make build
```

Before first deploy, verify:

- Chat works with `TOGETHER_API_KEY` configured
- Build succeeds without relying on live APIs (fallback data present)
- Mobile layout is usable for Home, Achievements, and Chat pages

## Repository Docs

- `AGENT.md`: single source of implementation conventions and project rules

## License

MIT
