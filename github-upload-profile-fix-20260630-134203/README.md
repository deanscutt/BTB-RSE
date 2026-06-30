# Peppermint Crew Planner

Minimal crew, rota, availability, event, document, and cover-management app for BTB/RSE.

Source event files can be kept in `BTB-RSE event documents/`.

## Run Locally

Requires Node.js 18 or newer.

```bash
cp .env.example .env
npm test
npm start
```

Open:

```text
http://127.0.0.1:4173/
```

## Install On Phones

The app includes a web app manifest, phone icons, and a service worker. On iPhone, open it in Safari and use Share > Add to Home Screen. On Android, open it in Chrome and use Install app or Add to Home screen.

## Email Setup

Copy `.env.example` into your deployment environment and set:

```text
RESEND_API_KEY
EMAIL_FROM
PRODUCTION_EMAIL
```

Without these, email features safely fall back to drafts where the app supports that. WhatsApp actions open WhatsApp with the message prepared.

## Publish

### Vercel

This repo includes `vercel.json` and serverless API files under `api/`, so Vercel can serve the static app and keep the email notification endpoint working.

In Vercel, use the repository root as the project root. The build command can be left as:

```bash
npm run build
```

Set the environment variables from `.env.example` in the Vercel project settings:

```text
RESEND_API_KEY
EMAIL_FROM
PRODUCTION_EMAIL
```

### Node Web Service

Use a Node hosting service such as Render, Railway, Fly.io, or a small VPS. The app must run as a web service, not a static site, because email notifications use `server.js`.

Build command:

```bash
npm test
```

Start command:

```bash
npm start
```

For the hosted environment, set the environment variables from `.env.example`. Use the host platform's `PORT`; do not hard-code it. Set `HOST` to `0.0.0.0` or leave it unset.

The server exposes:

```text
/health
```

for uptime checks.

## Current Prototype Limits

This version is ready for live testing, but it is still a lightweight prototype:

- Event/profile changes are held in the running browser session.
- Uploaded document files are browser-local.
- Passcodes are stored in the current browser.
- Real multi-user production use will need a database, file storage, and proper account authentication.
