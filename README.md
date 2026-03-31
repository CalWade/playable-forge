# PlayableForge

AI-powered Playable Ads generator for AppLovin. Upload assets → AI generates HTML → iterate via chat → batch produce variants.

## Quick Start

```bash
npm install
cp .env.example .env   # Edit with your AI API config
npx prisma generate
npx prisma db push
npm run dev
```

Open `http://localhost:3000`

## Tech Stack

- **Framework**: Next.js 14 (App Router) + React 18 + Tailwind CSS
- **UI**: shadcn/ui components
- **Database**: SQLite + Prisma 5
- **AI**: Vercel AI SDK (`ai` + `@ai-sdk/openai`) — any OpenAI-compatible endpoint
- **Image Processing**: Sharp
- **Auth**: JWT + bcrypt

## Project Structure

```
src/
├── app/                    # Next.js pages + API routes
│   ├── api/                # Backend API (25 endpoints)
│   ├── dashboard/          # Project list + stats
│   ├── login/              # Auth page
│   ├── projects/[id]/      # Workbench (assets + chat + preview)
│   └── settings/           # AI/validation/compression config
├── components/
│   ├── ui/                 # Base UI components (shadcn/ui)
│   └── workbench/          # Workbench-specific components
├── hooks/                  # Custom React hooks (useSSE, useAssets)
├── lib/
│   ├── ai/                 # AI orchestrator, classifier, prompts, provider
│   ├── assets/             # Image processing, base64, classifier
│   ├── auth/               # JWT, password, middleware (withAuth)
│   ├── html/               # Synthesizer, slot matcher
│   ├── validation/         # 10-rule validation engine
│   └── variants/           # Batch generation logic
└── types/                  # Shared TypeScript types
```

## Environment Variables

```
DATABASE_URL="file:./prisma/dev.db"
AI_BASE_URL="https://your-openai-compatible-endpoint/v1"
AI_API_KEY="sk-..."
AI_MODEL="gpt-4o"
JWT_SECRET="random-string-32-chars-min"
DATA_DIR="./data"
```

## Core Flow

1. **Upload assets** → auto-compressed, AI-classified (background/popup/button/etc)
2. **Generate skeleton** → AI creates HTML with `data-variant-slot` placeholders
3. **Preview** → system injects base64 assets into slots, renders in iframe
4. **Chat iterate** → natural language modifications, auto-validated each round
5. **Lock skeleton** → freeze the template for batch production
6. **Batch variants** → cartesian product of variant assets, pure slot replacement (no AI)
7. **Download** → ZIP of all variant HTML files

## License

Private — internal use only.
