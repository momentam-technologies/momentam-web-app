# 📗 Handover Notes – Momentam Web App (Frontend)

### Overview

The `momentam Web App` is the frontend for the Momentam platform.  
It is built with **Next Js 15 App Router**, styled using **TailwindCSS** and **shadcn/ui**, with **dark/light mode** already configured.

### Tech Stack

- **Styling**: Tailwind v4 + shadcn/ui (Radix-based)
- **Themes**: `next-themes` for light/dark mode
- **Icons**: `lucide-react`
- **TypeScript**: enabled with strict checks (`npm run check-errors`)
- **Linting**: ESLint + Next.js config (`npm run lint`)

### Folder Structure

## Setup & Installation

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### CI/CD

- Deployment is handled on **Vercel**
- CI/CD requires no manual setup:
  1. Connect GitHub repo to Vercel
  2. Push to `main` branch → auto-deploy
- Environment variables can be managed inside **Vercel Dashboard**

### Future Improvements

- Refactor folder structure into feature modules
- Setup auth with `auth.js`
- Add API integration layer (auth + business logic endpoints)
- Begin adding UI pages for user flow

## Known Issues/Limitations

## Contacts

Developer: officialgilbert24@gmail.com
