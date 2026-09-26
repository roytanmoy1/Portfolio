# Tanmoy Kumar Roy — Portfolio

A data-driven Next.js portfolio with a glassmorphism interface, responsive navigation, theme switching, project filtering, resume download, and an optional contact form provider.

## Run locally

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Next.js Fast Refresh reflects edits automatically; `nodemon` is not needed for normal Next.js development.

## Production commands

```bash
npm run build
npm run start
```

## Contact form

The form posts to the server route at `/api/contact`. Set the server-only `FORMSPREE_ENDPOINT` in `.env.local` to a verified Formspree endpoint. The route validates content type, origin, body size, field lengths, email format, control characters, a honeypot field, and a lightweight per-instance rate limit before storing and forwarding the message. If delivery is not configured, the form reports an error without opening another application.

Never commit `.env.local` or provider credentials.

## Deployment

The current public Vercel deployment is [tanmoyroy.vercel.app](https://tanmoyroy.vercel.app/). The Vercel project is connected to [github.com/roytanmoy1/Portfolio](https://github.com/roytanmoy1/Portfolio).

To deploy the updated version on Vercel:

1. Import the repository into Vercel.
2. Set the project root to `the_den` if the repository root is the parent `Portfolio` folder.
3. Use the default Next.js build settings.
4. Add `NEXT_PUBLIC_SITE_URL` with the final public URL.
5. Add the server-only `DATABASE_URL` from Neon.
6. Add the server-only `FORMSPREE_ENDPOINT` for direct email delivery.
7. Deploy and verify `/`, `/robots.txt`, `/sitemap.xml`, `/api/portfolio`, and the resume download.

## Data and database

The portfolio uses Neon Postgres as an optional server-side data layer. The schema is in [db/schema.sql](db/schema.sql), and [scripts/seed-neon.mjs](scripts/seed-neon.mjs) stores the current portfolio data as JSONB in `portfolio_content`. Contact submissions are stored in `contact_messages` when `DATABASE_URL` is configured. The static data in [app/data/portfolioData.js](app/data/portfolioData.js) remains the source used by the client build and is the fallback when Neon is not configured.

Set up Neon locally:

```bash
copy .env.example .env.local
# edit .env.local and add DATABASE_URL
npm run db:seed
```

Use `/api/portfolio` to confirm that the portfolio row is available. Use the Neon console's SQL editor to inspect rows safely; never expose `DATABASE_URL` with a `NEXT_PUBLIC_` prefix.

## Project hosting model

The Lab section separates enterprise case studies from personal projects and loads the public, non-fork repositories from GitHub. It shows live preview panels only for projects with an explicitly configured `liveUrl`; other repositories remain clearly marked as not deployed. Each GitHub repository needs its own deployment configuration, build command, environment variables, and service credentials. The portfolio cannot safely deploy all repositories automatically without access to the hosting account and project-specific configuration.

For the Vercel workflow, import each repository as its own Vercel project, configure its root directory and environment variables, then add the resulting URL to that project's `liveUrl` entry in [app/data/portfolioData.js](app/data/portfolioData.js). You can also set the repository's GitHub homepage so the repository shelf can discover it. Deployment tokens should stay outside this repository.
