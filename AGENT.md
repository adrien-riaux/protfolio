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
- Keep pages static-first. Fetch platform data at build time.
- Keep chat stateless. Do not store conversation history server-side.
- Use local fallback data from context files if external APIs fail.
- Keep code modular with clear separation:
   - UI components in src/components
   - page routes in src/pages
   - business/data logic in src/lib
   - chat endpoint in api/chat.ts

## Source of Truth for Content
- context/PROFILE.md: personal story, experience, positioning
- context/achievements.json: fallback achievements and platform stats
- context/certifications.json: certifications metadata
- public/certs: local badge images

## Environment Variables
Use env.example as template for .env.local.

Required:
- TOGETHER_API_KEY
- GITHUB_USERNAME
- STACKOVERFLOW_USER_ID
- KAGGLE_USERNAME
- PUBLIC_OWNER_NAME
- PUBLIC_OWNER_TAGLINE
- PUBLIC_SITE_URL

Optional:
- GITHUB_TOKEN
- STACKOVERFLOW_KEY

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
- Vercel using bun@1 runtime for api/**/*.ts from vercel.json.

## Change Workflow
When making changes:
1. Implement the smallest correct change.
2. Run checks/build.
3. Update README if behavior/setup changed.
4. Keep this file current if project conventions change.
