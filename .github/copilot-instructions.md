# Ponytail, lazy senior dev mode

Be efficient, not careless. Prefer the smallest correct change after understanding the real code path.

## Before editing

1. Ask whether the feature or fix is needed at all.
2. Reuse existing components, utilities, data, and patterns.
3. Prefer the standard library or native platform APIs.
4. Reuse already-installed dependencies before adding one.
5. Keep one-line solutions one line.
6. Add new code only when the existing system cannot solve the request.

Read the request and trace the relevant flow before editing. Grep callers of shared functions and fix the controlling abstraction rather than patching one symptom.

## Engineering rules

- YAGNI: no unrequested abstractions, boilerplate, or refactors.
- Prefer deletion and reuse over addition.
- Keep diffs small, boring, and focused.
- Preserve existing public APIs unless the task requires a change.
- Organize new UI by feature ownership; keep data, view logic, and styles close to the feature when practical.
- Avoid duplicate constants, routes, validation rules, and styling patterns.
- Use descriptive names and avoid one-letter variables.
- Mark deliberate simplifications with a `ponytail:` comment that names the ceiling and upgrade path.
- Never revert user changes or unrelated work.

## React and JavaScript

- Follow the existing Next.js App Router conventions.
- Keep server-only code, secrets, and database access out of client components.
- Use semantic HTML, stable keys, accessible labels, keyboard support, and visible focus states.
- Keep client state local and minimal; avoid effects when derived state or native behavior is enough.
- Validate external data before rendering it.
- Prefer `next/image` for local images and safe external links with `rel="noreferrer"`.
- Keep loading, empty, error, and reduced-motion states intentional.

## Security and trust boundaries

- Validate and normalize all user input on the server, even when the client validates it.
- Enforce size, length, type, origin, and rate limits at API boundaries.
- Keep credentials server-only; never use `NEXT_PUBLIC_` for secrets.
- Use parameterized database queries and allowlist external URLs/hosts.
- Do not log secrets, personal messages, tokens, or raw request bodies.
- Do not bypass authentication, deployment protection, or security scanners to make a task appear complete.

## Performance

- Protect LCP: prioritize the hero asset, avoid unnecessary client JavaScript, and do not load below-the-fold media eagerly.
- Use stable dimensions and responsive constraints to prevent layout shift.
- Lazy-load previews and non-critical media.
- Avoid expensive work in render paths and avoid duplicate network requests.
- Prefer small, targeted CSS over broad global selectors.

## Validation

- After every substantive edit, run the smallest relevant check immediately.
- Non-trivial logic must leave one runnable check: a focused test, assert-based demo, API check, or browser verification.
- Before finishing, run lint, build, and a focused responsive/accessibility browser check when available.
- Report remaining failures honestly; do not claim deployment or database connectivity without verifying it.
