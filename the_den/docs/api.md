# API Reference

The web app runs on Next.js 16 route handlers with the Node.js runtime. The assistant's long-lived WebSocket and upload endpoint run in the `portfoliochat` Neon Function. The frontend calls the HTTP routes on the portfolio origin and the Function directly.

## Portfolio content

### `GET /api/portfolio?section=<name>`

Returns one allowlisted section from normalized Postgres tables. Supported names are `experience`, `skills`, `about`, and `lab`. The home profile is fetched server-side for the initial render; the browser requests deeper sections as they approach the viewport.

- `200`: `{ "section": "experience", "data": [...] }`
- `400`: missing or unsupported section.
- `503`: portfolio data is unavailable.

`GET /llms.txt` builds its public text from the same database-backed section queries. There is no bundled portfolio-data fallback.

## Contact

### `POST /api/contact`

Accepts same-origin JSON. `name` must be 2-80 characters, `email` a valid address up to 254 characters, and `message` 10-4,000 characters. `company` is a honeypot field and should be empty. Requests are limited to 5 per 15 minutes per running route instance. Validated content is stored in `contact_messages` before delivery when `DATABASE_URL` is configured.

The route submits to Static Forms using the server-only `STATIC_FORMS_API_KEY`. The visitor email is sent as the reply-to address. Static Forms records accepted submissions in its dashboard and sends the configured notification.

- `200`: Static Forms accepted and recorded the message: `{ "ok": true, "delivery": "received" }`.
- `400`: malformed JSON or form payload.
- `403`: origin mismatch.
- `413`: request exceeds 32 KiB.
- `415`: request is not JSON.
- `422`: field validation failed.
- `429`: rate limit exceeded.
- `502`: Static Forms rejected the submission or could not accept it.
- `503`: Neon storage or Static Forms is not configured/available.

HTTP 200 confirms Static Forms recorded the submission, not that the notification reached the inbox. Its dashboard is the source of truth for accepted submissions; the free plan currently includes 250 submissions per month.

## Chat token

### `POST /api/chat/token`

Same-origin request with no body. The response sets an HttpOnly, SameSite=Strict session cookie and returns a short-lived origin-bound token plus the configured Function URL. Send `X-Portfolio-New-Chat: true` to rotate the session cookie and begin a fresh chat/upload quota.

```json
{
  "token": "<short-lived token>",
  "websocketUrl": "https://<function-origin>/"
}
```

- `200`: token issued.
- `403`: missing/mismatched Origin or cross-site request.
- `429`: token-minting rate limit exceeded.
- `503`: chat token or Function configuration is unavailable.

## Neon Function

The Function origin is provided to the app as `CHAT_WEBSOCKET_URL`. It accepts only the configured portfolio origins and verifies the signed token before session-scoped work.

### `GET /health`

Returns `{ "ok": true }` for deployment health checks.

### `POST /upload`

Requires the matching `Origin`, `Authorization: Bearer <token>`, and multipart form data with one to five `files` fields. Supported formats are PDF, TXT, and XLSX; each file is at most 2 MiB and the session may retain five files for 24 hours.

- `201`: encrypted files stored; response contains file metadata (`id`, `name`, `type`, `size`, `expires_at`).
- `204`: CORS preflight accepted.
- `401`: invalid or expired token.
- `403`: origin is not allowed.
- `413`: upload is too large.
- `415`: request is not multipart form data.
- `422`: file validation or session limit failed.
- `405`: method is not allowed.
- `503`: storage is unavailable.

### `POST /transcribe`

Requires the matching `Origin`, `Authorization: Bearer <token>`, and a short audio body. Supported MIME types are `audio/webm`, `audio/mp4`, and `audio/ogg`; audio is limited to 2 MiB and six requests per session per minute. The Function sends audio to Gemini for transcription, returns `{ "transcript": "..." }`, and does not store or log the audio.

- `200`: transcript returned.
- `204`: CORS preflight accepted.
- `401`: invalid or expired token.
- `403`: origin is not allowed.
- `413`: audio is over 2 MiB.
- `415`: audio format is unsupported.
- `422`: no usable audio or transcript.
- `429`: transcription rate limit exceeded.
- `503`: transcription service is unavailable.

### `GET /ws?token=<short-lived token>`

Upgrade to WebSocket with an allowed `Origin`. The client sends text frames only:

```json
{
  "type": "chat",
  "name": "Visitor name",
  "message": "Question about the portfolio",
  "fileIds": []
}
```

The server sends `ready`, `ping`, `typing`, `assistant`, or `error` frames. Messages are limited to 500 characters, names to 2-60 characters, and each connection to 8 messages per minute. Conversation history is loaded server-side for the same session; browser-supplied history is not accepted. The UI separately stores the visitor name and up to 12 recent text-only messages in local storage, capped at 12,000 characters with a sliding 24-hour TTL. Attachments and unsent drafts are not stored there; starting a new chat clears the local transcript. Server-side chat audit records retain their existing 90-day expiry. Upgrade failures return `401` for an invalid token, `403` for an unapproved origin, and `426` when the request is not a WebSocket upgrade.
