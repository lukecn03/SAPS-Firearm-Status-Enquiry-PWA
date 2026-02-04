# Deploy to Render.com

## Quick Start

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Convert proxy to Node.js Express"
   git push origin main
   ```

2. **Connect to Render**:
   - Go to [render.com](https://render.com)
   - Sign up/Login with GitHub
   - Click "New +" → "Web Service"
   - Select your repository
   - Render will auto-detect Node.js

3. **Configure Build & Deploy Settings**:
   - **Name**: `saps-firearm-proxy` (or your preference)
   - **Environment**: `Node`
   - **Build Command**: `cd proxy && npm install && npm run build`
   - **Start Command**: `cd proxy && npm start`
   - **Branch**: `main`

4. **Optional - Environment Variables**:
   - No special env vars needed for basic setup
   - If you want to customize the port (Render sets it automatically), you can add `PORT=3000`

5. **Deploy**:
   - Click "Create Web Service"
   - Render will build and deploy automatically
   - You'll get a URL like `https://saps-firearm-proxy.onrender.com`

## Testing the Deployment

Once deployed, test with:

```bash
# Health check
curl https://saps-firearm-proxy.onrender.com/health

# Proxy endpoint
curl -X POST https://saps-firearm-proxy.onrender.com/api/proxy/firearm-status \
  -H "Content-Type: application/json" \
  -d '{"fsref":"ABC123"}'
```

## Update Frontend URL

In `frontend/src/lib/api.ts`, update the API base URL:

```typescript
const API_BASE = 'https://saps-firearm-proxy.onrender.com';
```

## Notes

- **Free Tier**: Spins down after 15 minutes of inactivity (wakes up on first request)
- **Rate Limiting**: 30 requests per minute per IP
- **Timeout**: 15 seconds for upstream SAPS requests
- **CORS**: Enabled for all origins

## Troubleshooting

If deployment fails, check the Render logs in the dashboard. Common issues:
- Missing dependencies: Run `npm install` before `npm run build`
- Wrong working directory: Ensure paths are correct (the proxy folder structure)
- Node version: Requires Node 18+
