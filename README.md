# APG-AI Prompt Generator

A minimal 3-step prompt generator UI hosted on Vercel with a serverless function proxying requests to Google Gemini using a single server-side API key.

## Project Structure

- `index.html` — Frontend UI (no build step required)
- `api/generate.js` — Vercel Serverless Function calling Gemini with your server-side key
- `vercel.json` — Configures Node.js runtime for serverless functions
- `package.json` — Project metadata

## Requirements

- A Google AI Studio / Gemini API key
- A Vercel project (connected repo or Vercel CLI)

## Environment Variables

Set this in your Vercel project:

- `GEMINI_API_KEY` — Your Gemini API key

You can also create a local `.env` (not committed) and set `GEMINI_API_KEY` when using `vercel dev`.

## Deployment (Vercel Dashboard)

1. Create a new Vercel project and import this repository.
2. In Project Settings → Environment Variables, add:
   - `GEMINI_API_KEY` = `your-real-api-key`
   - Scope: Production, Preview (and Development if needed)
3. Deploy.

## Local Development (Vercel CLI)

```bash
npm i -g vercel
vercel login
vercel link
vercel env add GEMINI_API_KEY development
vercel dev
```

Open http://localhost:3000 and test.

## How It Works

- The browser posts `{ prompt, systemInstruction }` to `/api/generate`.
- The serverless function reads `GEMINI_API_KEY` from the environment and calls Gemini:
  - `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
  - Headers: `Content-Type: application/json`, `X-goog-api-key: <server-key>`
- The function returns `{ text }` back to the frontend.

## Notes

- No OAuth and no user-supplied keys; the server is the sole middleman.
- To restrict CORS to your domain, update headers in `api/generate.js` (currently `*`).
- To change models or add safety settings, edit the payload/URL in `api/generate.js`.
