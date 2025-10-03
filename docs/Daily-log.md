# 📘 Daily Log – Momentam Web App (Frontend)

## Day 1 – Project Foundation (2025-10-03)

### Objectives

- [ ] Initialize Next.js web app scaffold (App Router)
- [ ] Configure dependencies (TailwindCSS, shadcn/ui, lucide-react, Radix UI, theme support)
- [ ] Setup folder structure for modular development
- [ ] Push code to GitHub organization repo
- [ ] Prepare documentation (Daily Log + Handover)

### Progress

- ✅ Initialized Next.js project (`momentam-web-app`) using **App Router**
- ✅ Installed and configured core dependencies:
  - TailwindCSS (v4) with `@tailwindcss/postcss`
  - shadcn/ui components via `class-variance-authority`, `clsx`, `tailwind-merge`
  - `lucide-react` for icons
  - Radix UI dropdowns
  - `next-themes` for dark/light mode toggle
- ✅ Verified `app/` router-based structure working
- ✅ Configured **light/dark theme support**
- ✅ GitHub repo created and initial commit pushed (`momentam-technologies/momentam-web-app`)
- ⏳ CI/CD not needed now — will finalize via Vercel after refactor completion

### Notes / Decisions

- Using **Vercel** for hosting + auto-deploy (CI/CD handled automatically on push)
- App will follow **feature-first folder structure** under `app/` (e.g., `app/(auth)`, `app/(dashboard)`)
- Shared components live in `components/`
- Shared utilities & helpers in `lib/`
- ESLint + TypeScript strict mode enabled (`check-errors` script added)
- Using `--turbopack` for faster dev builds

### Blockers

- None for Day 1
