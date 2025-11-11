# APG-AI Prompt Generator

A minimal 3-step prompt generator UI hosted on Vercel with a serverless function proxying requests to the Mistral AI API using a single server-side API key.

## Project Structure

- `index.html` — Frontend UI (no build step required)
- `api/generate.js` — Vercel Serverless Function calling Mistral with your server-side key
- `vercel.json` — Configures Node.js runtime for serverless functions
- `package.json` — Project metadata

## Requirements

- A Mistral API key
- A Vercel project (connected repo or Vercel CLI)

## Environment Variables

Set this in your Vercel project:

- `MISTRAL_API_KEY` — Your Mistral API key

You can also create a local `.env` (not committed) and set `MISTRAL_API_KEY` when using `vercel dev`.

## Deployment (Vercel Dashboard)

1. Create a new Vercel project and import this repository.
2. In Project Settings → Environment Variables, add:
   - `MISTRAL_API_KEY` = `your-real-api-key`
   - Scope: Production, Preview (and Development if needed)
3. Deploy.

## Local Development (Vercel CLI)

```bash
npm i -g vercel
vercel login
vercel link
vercel env add MISTRAL_API_KEY development
<<<<<<< HEAD
vercel dev
=======
vercel dev
>>>>>>> 5ba10e06f863f7db61d914b36765e9ffcfed26f7
