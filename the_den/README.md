# Tanmoy Kumar Roy — Portfolio

A data-driven portfolio for Tanmoy Kumar Roy, built with Next.js, React, and CSS Modules. It includes a responsive portfolio, project sorting, an authenticated AI assistant, file analysis, and contact workflows.

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

## Stack and architecture

- Frontend: Next.js 16 App Router, React 19, JavaScript, CSS Modules, and React Icons.
- Web backend: Node.js Next.js route handlers for contact delivery, portfolio data, and short-lived chat tokens.
- Assistant backend: a Node.js 24 Neon Function using WebSockets, Neon Postgres, and Gemini.
- Data and delivery: Neon Postgres and Static Forms for contact submission/email notification.

`app/` contains route entrypoints and global styles. Feature code is grouped under `features/assistant`, `features/contact`, `features/navigation`, `features/portfolio`, and `features/theme`. The Neon entrypoint stays at `functions/chat.js`, which re-exports the assistant implementation from `features/assistant/server`; reusable sortable UI lives in `shared/components`, and server-only database access lives in `server`. Portfolio sections share one feature-owned CSS Module, while the assistant, navigation, and sortable grid keep focused CSS Modules. See [docs/api.md](docs/api.md) for HTTP and WebSocket contracts.

## Contact form

The form posts to `/api/contact`. The route normalizes and validates fields, checks origin and body size, applies a honeypot and per-instance rate limit, stores validated submissions in Neon when configured, then calls Static Forms from the server. The API key is never sent to the browser.

Create a free Static Forms account, create a form addressed to your inbox, and set its server-only API key in `.env.local` and Vercel:

```dotenv
STATIC_FORMS_API_KEY=your-static-forms-api-key
```

The current free plan includes 250 submissions per month. HTTP 200 means the provider accepted and recorded the submission; it does not guarantee inbox placement. Use the Static Forms dashboard as the source of truth if an email notification is delayed or filtered. Validated submissions also remain in Neon when database storage is configured.

Keep `STATIC_FORMS_API_KEY` server-only and never prefix it with `NEXT_PUBLIC_`. The contact test is `npm run test:contact`.

Never commit `.env.local`, mailbox passwords, or app passwords.

## Portfolio assistant

The header robot control opens a responsive right-side assistant over an authenticated WebSocket. The browser obtains a two-minute, origin-bound JWT from `/api/chat/token`, then connects directly to the `portfoliochat` Neon Function. Gemini credentials remain only in the Function environment. The complete HTTP and WebSocket contract is documented in [docs/api.md](docs/api.md).

The panel starts closed on all devices and opens from the header robot control. It appears as a responsive right-side assistant on desktop and a compact bottom sheet on actual mobile devices. Before chat controls appear, the visitor must provide a 2–60 character display name; the normalized name accompanies retained audit rows described below. Voice input records up to 15 seconds and sends audio to Gemini through the authenticated Function for transcription; audio is not stored or logged. Typed chat remains available if microphone permission or transcription is unavailable, and spoken replies are opt-in.

Visitors may attach up to five `.pdf`, `.txt`, or modern Excel `.xlsx` files, with a hard limit of 2 MiB each. The paperclip opens a review dialog where files are chosen or dropped, inspected, removed, and explicitly saved before upload. Legacy `.xls` is intentionally unsupported. Both client and Function validate the limits; the Function also verifies PDF/TXT signatures or parses the XLSX package with expansion, sheet, row, column, cell, and extracted-text caps. Files are SHA-256 hashed, encrypted with AES-256-GCM before insertion, scoped to the anonymous HttpOnly-cookie session, unavailable through any public download route, and excluded from queries after 24 hours. Uploaded content is untrusted context, never model instructions.

After the required visitor name is entered, ask the assistant to email Tanmoy. It collects the sender's name, reply email, and message one at a time in the transcript, validates each answer, then posts once to the same `/api/contact` route as the full-page form. The Static Forms API key stays server-side.

Chat exchanges are written to `chat_messages` for later portfolio analytics. Rows contain the anonymous session ID, normalized visitor name, redacted question, final response, status, model label, attachment count, and timestamps. On an authenticated reconnect, the Function restores up to four answered exchanges from the same session and previous 24 hours; it never accepts conversation history from the browser. Tokens, hidden prompts, file contents, and detected key/password values are never logged. Rows expire from application queries after 90 days and are deleted opportunistically as new messages arrive.

Security controls include:

- same-origin token minting and an origin allowlist on the WebSocket handshake
- signed, short-lived, scope-limited JWTs
- text-only frames, strict input/output sizes, per-connection rate limits, one in-flight model request, and timeouts
- authenticated multipart uploads, MIME/signature checks, transactional five-file limits, encrypted Postgres storage, and attachment ownership checks
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

Use the same `CHAT_TOKEN_SECRET` in Neon and Vercel. Store `GEMINI_API_KEY`, `GEMINI_MODEL`, `CHAT_ALLOWED_ORIGINS`, and a base64-encoded 32-byte `FILE_ENCRYPTION_KEY` in Neon. Store only `CHAT_TOKEN_SECRET` and the returned invocation origin as `CHAT_WEBSOCKET_URL` in Vercel. Redeploy Vercel after setting those variables.

Run the deterministic boundary checks with:

```bash
npm run test:chat
node --env-file=.env.neon.local scripts/verify-chat-schema.mjs
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
6. Add the server-only `STATIC_FORMS_API_KEY` from the contact-form section.
7. Deploy the Neon Function and add the chat variables from the portfolio-assistant section.
8. Deploy and submit a real test message before relying on the form.
9. Verify `/`, `/robots.txt`, `/sitemap.xml`, `/api/portfolio`, `/api/chat/token`, the assistant WebSocket, and the resume download.

## Data and database

Portfolio content is stored in normalized Neon Postgres tables defined in [db/schema.sql](db/schema.sql). Server-only queries in [server/portfolio.js](server/portfolio.js) load the home profile for the initial render and fetch Experience, Skills, Profile, and Lab independently as each section approaches the viewport. The allowlisted `/api/portfolio?section=...` endpoint returns only the requested section. There is no bundled portfolio-data fallback; the app requires `DATABASE_URL` and migrated portfolio tables. Contact submissions and chat records use their separate tables.

Create or select an isolated Neon development branch, then pull its Postgres variables into the ignored `.env.neon.portfolio.local` file:

```bash
neon env pull --branch <development-branch> --file .env.neon.portfolio.local --service postgres
npm run db:migrate
npm run db:verify
npm run test:portfolio
```

The migration backfills normalized tables from the legacy `portfolio_content` row when present, then removes that legacy table. Runtime and migration code require server-only database URLs; never expose either URL with a `NEXT_PUBLIC_` prefix. Portfolio edits after migration belong in Postgres, not a frontend data file.

For production, apply the schema using the direct URL in `.env.neon.local`, preview the content replacement, then explicitly apply it:

```bash
npm run db:migrate:prod
npm run db:promote:check
npm run db:promote:prod
```

The promotion script copies only portfolio tables from `.env.neon.portfolio.local` to the `production` branch in `.env.neon.local`; it leaves contact and chat records unchanged. Without the `db:promote:prod` confirmation command, the operation rolls back.

## Project hosting model

The Lab section separates enterprise case studies from personal projects and loads the public, non-fork repositories from GitHub. It shows live preview panels only for projects with an explicitly configured `liveUrl`; other repositories remain clearly marked as not deployed. Each GitHub repository needs its own deployment configuration, build command, environment variables, and service credentials. The portfolio cannot safely deploy all repositories automatically without access to the hosting account and project-specific configuration.

For the Vercel workflow, import each repository as its own Vercel project, configure its root directory and environment variables, then set its `live_url` in `portfolio_personal_projects`. You can also set the repository's GitHub homepage so the repository shelf can discover it. Deployment tokens should stay outside this repository.
