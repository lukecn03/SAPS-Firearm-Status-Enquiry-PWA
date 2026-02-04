# Deployment Guide

## Local Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

1. **Install dependencies:**
   ```bash
   cd proxy && npm install
   cd ../frontend && npm install
   ```

2. **Create environment files:**
   - Copy `proxy/.env.example` to `proxy/.env`
   - Copy `frontend/.env.example` to `frontend/.env`

3. **Start the proxy (in one terminal):**
   ```bash
   cd proxy
   npm run dev
   ```
   The proxy will run on `http://localhost:3000` (or the port specified in `proxy/.env`).

4. **Start the frontend (in another terminal):**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:5173` (or the next available port).

## Production Deployment

### Proxy (Backend)

The proxy can be deployed to:
- **Node.js hosting** (Heroku, Railway, Render, etc.)
- **Cloudflare Workers** (requires wrangler setup)
- **Docker** (containerize the app)
- **Any VPS/cloud provider** supporting Node.js

#### Quick Deploy Steps (Node.js Host):

1. Build the proxy:
   ```bash
   cd proxy
   npm run build
   ```

2. Set environment variables on your host:
   ```
   PORT=3000
   NODE_ENV=production
   ```

3. Deploy and start:
   ```bash
   npm start
   ```

#### For Cloudflare Workers:
See `proxy/DEPLOY.md` for detailed instructions.

### Frontend (Web App)

The frontend can be deployed to:
- **GitHub Pages** (free static hosting)
- **Netlify**
- **Vercel**
- **Any static web host**

#### Quick Deploy Steps (GitHub Pages):

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. The build output is in `frontend/dist/`.

3. Deploy to GitHub Pages using GitHub Actions or manually push to `gh-pages` branch.

#### For other static hosts:
1. Run `npm run build` in the `frontend/` directory.
2. Upload the contents of `frontend/dist/` to your static host.

### Environment Variables for Production

**Frontend (`frontend/.env`):**
```
VITE_API_BASE_URL=https://your-proxy-domain.com
```

**Proxy (`proxy/.env`):**
```
PORT=3000
NODE_ENV=production
```

## Logging

- **Development mode** (`NODE_ENV=development`): Logs are printed to the console (debug, info, warn, error).
- **Production mode** (`NODE_ENV=production`): Logging is disabled (minimal overhead).

## Security Notes

- The CSRF token used in requests is hardcoded and may expire. If requests start failing with 403/401 responses, the token may need to be refreshed (visit the SAPS website and extract the new token).
- Always use HTTPS in production.
- Ensure your proxy restricts rate limiting appropriately (default: 30 requests per minute per IP).

## Troubleshooting

### "ERR_CONNECTION_REFUSED"
- Ensure the proxy is running and the frontend's `VITE_API_BASE_URL` points to the correct proxy endpoint.

### "SAPS website down or format changed"
- HTTP 503 from the proxy indicates the upstream SAPS server is down or has changed its HTML format.
- The parser in `frontend/src/lib/parser.ts` may need updates if the SAPS website changes.

### No results found
- Verify the reference and serial numbers are correct.
- Check the proxy logs for any errors (dev mode only).
