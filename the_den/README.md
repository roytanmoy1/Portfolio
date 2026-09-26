# Tanmoy Kumar Roy — Portfolio

A data-driven Next.js portfolio with a glassmorphism interface, responsive navigation, theme switching, project filtering, resume download, and direct SMTP contact delivery.

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

The form posts to the server route at `/api/contact`. The route validates content type, origin, body size, field lengths, email format, control characters, a honeypot field, and a lightweight per-instance rate limit before storing the message in Neon and sending it through authenticated SMTP. The visitor address is used as `Reply-To`; the authenticated mailbox remains the sender so SPF and DMARC checks are preserved.

For Gmail, enable 2-Step Verification, create an app password, and set these server-only values in `.env.local` and Vercel:

```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=you@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_FROM_EMAIL=you@gmail.com
CONTACT_TO_EMAIL=you@gmail.com
```

Use the mailbox address for `SMTP_FROM_EMAIL`. `CONTACT_TO_EMAIL` may be any inbox that should receive portfolio enquiries. If SMTP rejects a delivery, the form reports an error while the validated submission remains retained in Neon.

Never commit `.env.local`, mailbox passwords, or app passwords.

## Portfolio assistant

The header robot control opens a responsive right-side assistant over an authenticated WebSocket. The browser obtains a two-minute, origin-bound JWT from `/api/chat/token`, then connects directly to the `portfoliochat` Neon Function. Gemini credentials remain only in the Function environment.

Security controls include:

- same-origin token minting and an origin allowlist on the WebSocket handshake
- signed, short-lived, scope-limited JWTs
- text-only frames, strict input/output sizes, per-connection rate limits, one in-flight model request, and timeouts
- deterministic refusal of unrelated questions, prompt extraction, jailbreaks, and credential requests before inference
- a curated public-data allowlist instead of database access or arbitrary retrieval
- Gemini safety settings, low-temperature answers, output scanning, sanitized errors, and no prompt/body logging

Guardrails reduce abuse but cannot make probabilistic model output infallible. Keep the context public-only, monitor refusals and model errors, rotate credentials, and review the policy whenever portfolio data changes.

The Gemini key shared in chat must be revoked before use. Create a replacement in Google AI Studio and enter it only into a gitignored deployment environment file or secure terminal prompt.

Configure the Function in the existing `us-east-2` Neon project:

```bash
neon login
neon link
neon deploy --env .env.chat.local --no-env-pull
neon functions get portfoliochat
```

Use the same `CHAT_TOKEN_SECRET` in Neon and Vercel. Store `GEMINI_API_KEY`, `GEMINI_MODEL`, and `CHAT_ALLOWED_ORIGINS` in Neon. Store only `CHAT_TOKEN_SECRET` and the returned invocation origin as `CHAT_WEBSOCKET_URL` in Vercel. Redeploy Vercel after setting those variables.

Run the deterministic boundary checks with:

```bash
npm run test:chat
```

The Bengaluru map is a keyless Google Maps embed. It intentionally shows the city, not a precise home address.

## Deployment

The current public Vercel deployment is [tanmoyroy.vercel.app](https://tanmoyroy.vercel.app/). The Vercel project is connected to [github.com/roytanmoy1/Portfolio](https://github.com/roytanmoy1/Portfolio).

To deploy the updated version on Vercel:

1. Import the repository into Vercel.
2. Set the project root to `the_den` if the repository root is the parent `Portfolio` folder.
3. Use the default Next.js build settings.
4. Add `NEXT_PUBLIC_SITE_URL` with the final public URL.
5. Add the server-only `DATABASE_URL` from Neon.
6. Add the server-only SMTP variables from the contact-form section.
7. Deploy the Neon Function and add the chat variables from the portfolio-assistant section.
8. Deploy and submit a real test message before relying on the form.
9. Verify `/`, `/robots.txt`, `/sitemap.xml`, `/api/portfolio`, `/api/chat/token`, the assistant WebSocket, and the resume download.

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
