# SAPS Firearm Status Enquiry PWA

> **A fast, mobile-friendly, production-ready Progressive Web App to check your SAPS firearm application status.**

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5%2B-blue)
![PWA](https://img.shields.io/badge/PWA-Ready-brightgreen)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Deployment](#deployment)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [SEO & PWA](#seo--pwa)
- [Privacy & Security](#privacy--security)
- [Troubleshooting](#troubleshooting)
- [Disclaimer](#disclaimer)
- [License](#license)

---

## Overview

This is a **production-ready React PWA** for checking South African firearm application status with SAPS. It includes:

- **Frontend**: Mobile-first React SPA with service worker caching
- **Proxy Backend**: Node.js/Express server with rate limiting & validation
- **PWA Features**: Installable, works offline, 5-minute client-side cache
- **SEO**: Structured data, Open Graph, sitemap, robots.txt
- **Privacy**: POPIA-compliant, zero server-side data storage

---

## Features

### Frontend (React + TypeScript + Vite)
- ✅ Mobile-first responsive design
- ✅ Fast & lightweight
- ✅ Service worker with offline support
- ✅ 5-minute client-side caching
- ✅ Vertical card layout for results
- ✅ No console logs in production
- ✅ Accessible (WCAG)
- ✅ SEO-optimized (structured data, meta tags, sitemap)

### Backend (Express.js)
- ✅ Input validation (fsref, fserial)
- ✅ Rate limiting (30 req/min per IP)
- ✅ 15-second upstream timeout
- ✅ CORS support
- ✅ Health check endpoint
- ✅ Error handling (no raw status codes to client)
- ✅ Environment-based configuration

---

## Quick Start

### Prerequisites
- Node.js 18+
- Git

### Local Development

```bash
# Clone repo
git clone https://github.com/icmen/SAPS-Firearm-Status-Enquiry-PWA.git
cd SAPS-Firearm-Status-Enquiry-PWA

# Install dependencies
npm install

# Terminal 1: Start proxy (port 3000)
cd proxy
npm install
npm run dev

# Terminal 2: Start frontend (port 5173)
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:3000`

### PWA Installation (After Deployment)

- **Android (Chrome/Edge)**: Menu (⋮) → "Add to Home screen" or address bar install icon
- **iOS (Safari)**: Share → "Add to Home Screen"
- **Desktop (Chromium)**: Address bar install icon or Menu → "Install app"

---

## Architecture

```
SAPS-Firearm-Status-Enquiry-PWA/
├── frontend/                    # React + Vite + PWA
│   ├── src/
│   │   ├── components/          # React components (SearchForm, ResultsTable, etc.)
│   │   ├── lib/
│   │   │   ├── api.ts           # API calls to proxy
│   │   │   ├── cache.ts         # localStorage caching (5 min)
│   │   │   ├── logger.ts        # Production-safe logging
│   │   │   └── parser.ts        # HTML parsing (regex-based)
│   │   ├── sw.ts                # Service worker (Workbox)
│   │   └── main.tsx
│   ├── public/
│   │   ├── manifest.json        # PWA manifest
│   │   ├── icon-*.svg           # App icons
│   │   ├── robots.txt           # SEO: search engine directives
│   │   └── sitemap.xml          # SEO: page listing
│   ├── .env.development         # Dev env vars
│   ├── .env.production          # Prod env vars
│   ├── vite.config.ts
│   └── package.json
├── proxy/                       # Express.js backend
│   ├── src/
│   │   ├── index.ts             # Main server
│   │   └── logger.ts            # Server-side logging
│   ├── .env.development         # Dev env vars
│   ├── .env.production          # Prod env vars
│   ├── package.json
│   └── tsconfig.json
├── DEPLOYMENT.md                # Extended deployment guide
├── SEO.md                       # SEO optimization checklist
├── ProjectOutlinePrompt.md      # Project context
└── README.md                    # This file
```

**Tech Stack**: React 18 • TypeScript • Vite • CSS Modules • Express.js • Workbox • Cloudflare Pages/GitHub Pages

---

## Deployment

### Option 1: Cloudflare Pages (Frontend) + Render (Proxy)

**Frontend on Cloudflare Pages** (Free tier available):
1. Push repo to GitHub
2. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → Pages → Create project
3. Select repository, build command: `cd frontend && npm install && npm run build`, output: `frontend/dist`
4. Set environment variable: `VITE_API_BASE_URL=https://your-proxy-url.com`
5. Deploy

**Backend on Render.com** (Free tier available):
1. Go to [render.com](https://render.com) → New Web Service
2. Select repo, build command: `cd proxy && npm install && npm run build`, start command: `npm start`
3. Set environment variables:
   ```
   NODE_ENV=production
   PORT=3000
   ALLOWED_ORIGIN=https://your-frontend.pages.dev
   ```
4. Deploy and get URL (e.g., `https://your-proxy.onrender.com`)
5. Update frontend `VITE_API_BASE_URL` to proxy URL

### Option 2: GitHub Pages (Frontend) + Heroku/Railway (Proxy)

Similar setup, but use GitHub Pages for frontend (Settings → Pages → GitHub Actions).

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed steps.

---

## Configuration

### Frontend Environment Variables

Create `frontend/.env.production`:
```env
VITE_API_BASE_URL=https://your-proxy-url.com
VITE_BASE_PATH=/
```

### Proxy Environment Variables

Create `proxy/.env.production`:
```env
NODE_ENV=production
PORT=3000
ALLOWED_ORIGIN=https://your-frontend-domain.com
UPSTREAM_URL=https://www.saps.gov.za/services/firearm_status_enquiry.php
CSRF_TOKEN=                                    # Leave empty to use default
RATE_LIMIT_REQUESTS=30
RATE_LIMIT_WINDOW_MS=60000
UPSTREAM_TIMEOUT_MS=15000
```

---

## API Reference

### Proxy Health Check
```http
GET /health
```

**Response:**
```json
{ "status": "ok" }
```

### Firearm Status Query
```http
POST /api/proxy/firearm-status
Content-Type: application/json

{
  "fsref": "ABC123",
  "fserial": "optional-serial-number"
}
```

**Success Response (200):**
```json
{
  "html": "...",
  "fetchedAt": "2026-02-04T12:00:00.000Z",
  "query": {
    "fsref": "ABC123",
    "fserial": "optional-serial"
  }
}
```

**Error Response (503/400/429):**
```json
{ "error": "SAPS servers appear to be offline or not responding. Please try again later." }
```

### Rate Limiting
- **Limit**: 30 requests per minute per client IP
- **Response**: 429 Too Many Requests
- **Window**: Sliding 60-second window

---

## SEO & PWA

This app includes comprehensive SEO optimization:

✅ **Meta Tags**: Title, description, keywords, robots directives  
✅ **Open Graph / Twitter Card**: Rich sharing previews  
✅ **Structured Data**: JSON-LD schema for web apps  
✅ **Sitemap**: `sitemap.xml` for search engine indexing  
✅ **Robots.txt**: Crawling directives  
✅ **PWA Manifest**: Icons, categories, screenshots  
✅ **Mobile Meta Tags**: Apple touch icon, install prompts  

See [SEO.md](./SEO.md) for optimization checklist and before-deployment updates.

---

## Privacy & Security

### Data Handling
- **No server-side storage** of personal data
- **Client-side cache only**: 5-minute localStorage expiry
- **No logging** of reference numbers or serials in production
- **POPIA-compliant**: Minimal data collection, user control

### Error Handling
- **Production**: No raw HTTP status codes or upstream error details shown to users
- **Logs**: Technical details logged server-side only (development mode)
- **Fallback**: Generic "SAPS servers offline" message to prevent information leakage

### CORS & HTTPS
- CORS origin restricted to frontend domain in production
- **HTTPS required** for PWA (service worker, installability)
- All requests to SAPS use HTTPS

---

## Troubleshooting

### Frontend won't start
```bash
rm -rf frontend/node_modules frontend/package-lock.json
cd frontend && npm install && npm run dev
```

### Proxy won't start
```bash
rm -rf proxy/node_modules proxy/package-lock.json
cd proxy && npm install && npm run dev
```

### API returns "SAPS servers offline"
- SAPS servers may be temporarily down
- Rate limit reached (30 req/min per IP)
- Network timeout (15 seconds)
- **Solution**: Retry in a moment or check [saps.gov.za](https://www.saps.gov.za) manually

### Service worker not caching
- Check browser DevTools → Application → Service Workers
- Clear cache: App → Clear Cache button
- Verify `sw.js` exists in `dist/` after build
- Check scope in `vite.config.ts` matches deployment base path

### CORS errors in console (dev only)
- Verify `VITE_API_BASE_URL` in frontend `.env.development`
- Ensure proxy is running on port 3000
- Check proxy has `ALLOWED_ORIGIN=http://localhost:5173` (dev)

### PWA not installing
- Ensure HTTPS on production
- Check `manifest.json` is valid (use DevTools)
- Verify app icons exist and are accessible
- Icons should be in `frontend/public/`

### HTML parser fails
- SAPS website format may have changed
- Check browser console for parser errors
- Open GitHub issue with error details

---

## Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/my-feature`
3. Code with linting: `npm run lint`
4. Format: `npm run format` (Prettier)
5. Test locally
6. Push and open PR

---

## Disclaimer

⚠️ **Important:**

- **NOT affiliated with SAPS** — This is a third-party convenience tool
- Results displayed as-is from official SAPS servers
- **No guarantee** of accuracy, completeness, or uptime
- **Verify critical information** through official SAPS channels
- Use at your own risk

---

## License

MIT License. See [LICENSE](./LICENSE) for details.

---

## Support

- **Issues**: [GitHub Issues](https://github.com/icmen/SAPS-Firearm-Status-Enquiry-PWA/issues)
- **Discussions**: [GitHub Discussions](https://github.com/icmen/SAPS-Firearm-Status-Enquiry-PWA/discussions)
- **Privacy Policy**: [frontend/public/privacy.html](./frontend/public/privacy.html)

---

**Made with ❤️ for South Africa.**
