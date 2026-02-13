# SAPS Firearm Status Enquiry PWA

![PWA Icon](./frontend/public/icon.png)

A fast, reliable, mobile-friendly PWA to check your firearm application status with SAPS.

## Quick Start

### Prerequisites
- Node.js 18+

### Local Development

```bash
# Clone repo
git clone https://github.com/icmen/SAPS-Firearm-Status-Enquiry-PWA.git
cd SAPS-Firearm-Status-Enquiry-PWA

# Install dependencies
npm install

# Terminal 1: Start frontend (port 5173)
cd frontend
npm install
npm run dev

# Terminal 2: Start Cloudflare Workers proxy (port 8787)
cd proxy
npm install
npm run dev
```

## Project Structure

- `frontend/` — React + TypeScript + Vite (service worker, offline cache)
- `proxy/` — Cloudflare Workers proxy (CORS, rate limiting, validation)

## Deployment

The app auto-deploys via GitHub Actions:

### Frontend → GitHub Pages
- Automatically deployed on every push to main branch
- Builds with Vite, publishes to `gh-pages` branch
- Accessible at: `https://yourusername.github.io/SAPS-Firearm-Status-Enquiry-PWA/`

### Backend → Cloudflare Workers
- Automatically deployed on every push to main branch
- Deploys to Cloudflare Workers with Wrangler
- Requires: Cloudflare account + `CLOUDFLARE_API_TOKEN` in GitHub Secrets

#### Setup Steps:

**1. Configure Frontend (GitHub Pages)**
- Repo Settings → Pages → Source: Deploy from a branch → `gh-pages`
- The GitHub Actions workflow handles the build and deployment

**2. Configure Backend (Cloudflare Workers)**
- Create a Cloudflare account and Workers application
- Get your Cloudflare API Token: [Cloudflare Dashboard](https://dash.cloudflare.com) → API Tokens
- Add to GitHub Repo Secrets:
  - `CLOUDFLARE_API_TOKEN`: Your API token
  - `CLOUDFLARE_ACCOUNT_ID`: Your Account ID
  - `CLOUDFLARE_ZONE_ID`: Your Zone ID (if using a custom domain)
  - `CSRF_TOKEN`: Your SAPS CSRF token (if applicable)

**3. Environment Variables**
- Update `proxy/wrangler.toml` with your Cloudflare settings
- Set production secrets in Cloudflare Dashboard or via `wrangler secret put`
- Frontend will automatically use the deployed worker URL

**4. (Optional) Custom Domain**
- Add Cloudflare CNAME or configure custom domain in Cloudflare dashboard
- Workers will be accessible at your domain


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

### Proxy/Workers won't start
```bash
# Ensure TypeScript compilation
cd proxy
npm install
npm run build    # Compiles TS to JS
npm run dev      # Starts Wrangler dev server
```

### Worker deployment fails
- Check Cloudflare API Token is valid: `wrangler login` or set `CLOUDFLARE_API_TOKEN`
- Verify `wrangler.toml` has correct `name` and `main` path
- Check GitHub Secrets include `CLOUDFLARE_API_TOKEN`

### CORS errors when calling API
- Verify `ALLOWED_ORIGIN` in `wrangler.toml` matches frontend URL
- For local dev: should be `http://localhost:5173`
- For production: should be `https://yourusername.github.io/SAPS-Firearm-Status-Enquiry-PWA/`

### API returns "SAPS servers offline"
- SAPS servers may be temporarily down
- Rate limit reached (10 req/min per IP)
- Network timeout (30 seconds)
- Worker may be unreachable or misconfigured
- **Debug**: Check Cloudflare Worker logs via `wrangler tail`
- **Solution**: Retry in a moment or check [saps.gov.za](https://www.saps.gov.za) manually

### Service worker not caching
- Check browser DevTools → Application → Service Workers
- Clear cache: App → Clear Cache button
- Verify `sw.js` exists in `dist/` after build
- Check scope in `vite.config.ts` matches deployment base path

### CORS errors in console (dev only)
- Verify `VITE_API_BASE_URL` in frontend `.env.development` is `http://localhost:8787`
- Ensure Cloudflare Workers dev server is running (`npm run dev` in proxy folder)
- Check worker logs: `wrangler tail`

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


**Made with ❤️ for South Africans.**
