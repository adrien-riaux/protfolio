# AGENT.md - Portfolio Implementation Guide

This file is the single instruction source for this repository.

## Mission
Build and maintain a portfolio website that is fast, clean, and easy to personalize.

## Mandatory Technical Decisions
- Runtime and package manager: Bun
- Framework: Astro
- Styling: Tailwind CSS
- API router: Hono
- Chat provider: TogetherAI only
- Primary model: meta-llama/Llama-3.3-70B-Instruct-Turbo-Free
- Language: TypeScript for all logic and components

## Product Rules
- Keep pages static-first. Load platform data from local context JSON.
- Keep chat stateless. Do not store conversation history server-side.
- Use context files as the source of truth for profile and achievements.
- Keep code modular with clear separation:
   - UI components in src/components
   - page routes in src/pages
   - business/data logic in src/lib
   - chat endpoint in api/chat.ts

## Source of Truth for Content
- context/PROFILE.md: personal story, experience, positioning
- context/achievements.json: achievements and platform stats
- context/certifications.json: certifications metadata
- public/certs: local badge images

## Environment Variables
Use .env.example as template for .env.local.

Required:
- TOGETHER_API_KEY
- PUBLIC_OWNER_NAME
- PUBLIC_OWNER_TAGLINE
- PUBLIC_SITE_URL

## Quality Rules
- Keep naming clean and explicit.
- Prefer small focused files and composable functions.
- Validate all user input to API routes.
- Keep README aligned with actual implementation.
- Do not add Docker files unless explicitly requested.
- If Dockerfile is ever added, add .dockerignore in the same change.

## Development Commands
- make install
- make dev
- make check
- make test
- make build
- make preview

## Deployment Target
- Vercel with Node.js version pinned via package.json engines (node: 20.x).
- GitHub Actions uses two workflows:
   - .github/workflows/test.yml runs check and test on push to dev and main.
   - .github/workflows/deploy.yml deploys to Vercel only after CI Tests succeeds on main.

## CI/CD Secrets
Required GitHub repository secrets for deployment workflow:
- VERCEL_TOKEN
- VERCEL_ORG_ID
- VERCEL_PROJECT_ID

## Change Workflow
When making changes:
1. Implement the smallest correct change.
2. Run checks/build.
3. Update README if behavior/setup changed.
4. Keep this file current if project conventions change.
