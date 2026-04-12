# Qudurat — Next.js 15 App

Bilingual (English + Arabic) enterprise HR assessment platform for the MENA region.

This is the Next.js 15 migration target — built alongside the existing Vite app.
The Vite app at `../src/` continues to serve the live customer while this
scaffold is iterated on.

## Stack

- **Framework**: Next.js 15 (App Router, Server Components, Server Actions)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **Auth & DB**: Supabase (via `@supabase/ssr`)
- **i18n**: next-intl (EN + AR, RTL-aware)
- **State**: TanStack Query
- **Theming**: next-themes (light + dark)
- **Motion**: Framer Motion 12
- **Charts**: Tremor
- **Command palette**: cmdk
- **Drawers**: Vaul
- **Toasts**: Sonner
- **Tests**: Vitest + React Testing Library + Playwright

## Project Layout

```
qudurat-next/
├── messages/              # Locale message files (en.json, ar.json)
├── public/                # Static assets
├── src/
│   ├── app/               # App Router
│   │   ├── [locale]/      # i18n-prefixed routes
│   │   │   ├── (marketing)/  # Public marketing pages (SSG)
│   │   │   ├── (auth)/       # Login, register, forgot password
│   │   │   ├── (app)/        # Authenticated app
│   │   │   ├── (admin)/      # Super admin
│   │   │   └── layout.tsx    # Locale layout (html lang, dir, fonts)
│   │   ├── assess/[token]/   # Public assessment taker (no locale prefix)
│   │   ├── api/              # API routes (webhooks, cron)
│   │   ├── layout.tsx        # Root layout (minimal)
│   │   ├── providers.tsx     # Client-side providers tree
│   │   └── globals.css       # Tailwind + design tokens
│   ├── components/
│   │   ├── ui/               # shadcn primitives
│   │   ├── layout/           # Headers, footers, sidebars
│   │   └── shared/           # Reusable business components
│   ├── lib/
│   │   ├── supabase/         # Client / server / middleware splits
│   │   ├── tenant/           # Hostname resolver and context
│   │   ├── i18n/             # next-intl config and routing
│   │   ├── email/            # Provider adapters (Resend, Mailgun, SMTP...)
│   │   ├── ai/               # Provider adapters (OpenAI, Anthropic, Gemini...)
│   │   ├── secrets/          # Vault wrapper
│   │   ├── branding/         # OKLCH color scale generator
│   │   └── utils.ts          # cn(), helpers
│   └── middleware.ts         # Three concerns: tenant → auth → locale
├── next.config.mjs          # Security headers, next-intl plugin
├── tailwind.config.ts       # Design tokens
├── tsconfig.json            # TypeScript strict mode
└── package.json
```

## Getting Started

```bash
cd qudurat-next
npm install
cp .env.example .env.local
# Fill in .env.local with real values
npm run dev
```

Then visit:

- `http://localhost:3000/en` — English landing page
- `http://localhost:3000/ar` — Arabic landing page (RTL)
- `http://localhost:3000/en/login` — Login page
- `http://localhost:3000/en/dashboard` — Dashboard (requires auth)

## Middleware Behavior

The root `middleware.ts` handles three concerns in order:

1. **Tenant resolution**: Reads `Host` header, looks up tenant via:
   - Custom domain match (`assess.acme.com` → org)
   - Subdomain match (`acme.qudurat.com` → org)
   - Platform host (`qudurat.com` → no tenant, renders marketing site)
   - Injects `x-tenant-id`, `x-tenant-subdomain`, `x-tenant-plan` headers

2. **Supabase session refresh**: Uses `@supabase/ssr` to refresh the auth
   cookie on every request. Without this, SSR shows logged-out content to
   logged-in users.

3. **Locale detection**: Uses `next-intl` to prefix routes with `/en` or `/ar`
   and redirect root requests to the default or preferred locale.

## Migration Status

- [x] **Week 2**: Scaffold (this PR)
- [ ] **Week 3**: Marketing + auth + dashboard migration
- [ ] **Week 4**: Assessment CRUD + groups + employees + results
- [ ] **Week 5**: Testing + CI/CD
- [ ] **Week 6**: Billing integration

## Commands

| Command | Action |
|---|---|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript type check |
| `npm run test` | Vitest unit tests |
| `npm run test:e2e` | Playwright E2E tests |
| `npm run format` | Prettier format |

## Notes

- This scaffold does NOT replace the live Vite app yet. Both run in parallel.
- Final cutover to Next.js happens in Week 6 of Phase 1 after full migration.
- Database types should be regenerated before merge: `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts`
