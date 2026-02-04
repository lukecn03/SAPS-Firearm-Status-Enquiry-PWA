import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { logger } from './logger';

interface FirearmStatusRequest {
  fsref: string;
  fserial?: string;
}

interface ProxyResponse {
  html: string;
  fetchedAt: string;
  query: {
    fsref: string;
    fserial?: string;
  };
}

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const RATE_LIMIT_REQUESTS = Number(process.env.RATE_LIMIT_REQUESTS) || 30;
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000; // 1 minute
const UPSTREAM_TIMEOUT = Number(process.env.UPSTREAM_TIMEOUT_MS) || 15 * 1000; // 15 seconds
const UPSTREAM_URL = process.env.UPSTREAM_URL || 'https://www.saps.gov.za/services/firearm_status_enquiry.php';
const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

const app = express();

// Middleware
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json());

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, RateLimitStore>();

function validateInput(fsref: string, fserial?: string): string | null {
  if (!fsref || typeof fsref !== 'string') {
    logger.warn('Input validation failed: Reference Number is required');
    return 'Reference Number (fsref) is required';
  }

  if (fsref.trim().length === 0) {
    logger.warn('Input validation failed: Reference Number is empty');
    return 'Reference Number cannot be empty';
  }

  if (fsref.length > 40) {
    logger.warn('Input validation failed: Reference Number exceeds length', { length: fsref.length });
    return 'Reference Number exceeds maximum length of 40';
  }

  if (fserial && fserial.length > 40) {
    logger.warn('Input validation failed: Serial Number exceeds length', { length: fserial.length });
    return 'Serial Number exceeds maximum length of 40';
  }

  logger.debug('Input validation passed', { fsref, fserial: fserial || '' });
  return null;
}

function getClientIP(req: Request): string {
  const forwarded = req.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || 'unknown';
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const current = rateLimitMap.get(ip);

  if (!current || now > current.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (current.count >= RATE_LIMIT_REQUESTS) {
    return false;
  }

  current.count++;
  return true;
}

async function proxyToSAPS(fsref: string, fserial?: string): Promise<string> {
  logger.debug('Proxying request to SAPS', { fsref, fserial: fserial || '' });
  
  const formData = new URLSearchParams();
  // Read CSRF token from environment if provided
  const CSRF_TOKEN = process.env.CSRF_TOKEN || '5117511d3ced47633a16308deb237771f3fceeacf93d7c88dbf67c290fb34b6a';
  formData.append('csrf_token', CSRF_TOKEN);
  formData.append('fsref', fsref.trim());
  // Send empty serial as empty string when missing
  formData.append('fserial', fserial ? fserial.trim() : '');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT);

  try {
    const response = await fetch(UPSTREAM_URL, {
      method: 'POST',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9,hr;q=0.8',
        'Cache-Control': 'max-age=0',
        'Connection': 'keep-alive',
        'Content-Type': 'application/x-www-form-urlencoded',
        // send cookie header with csrf_token and analytics cookie
        'Cookie': '_ga=GA1.1.166994781.1770100878; csrf_token=' + CSRF_TOKEN + '; _ga_Z8DRHW5WJT=GS2.1.s1770100878$o1$g1$t1770103242$j60$l0$h0',
        'Origin': 'https://www.saps.gov.za',
        'Referer': 'https://www.saps.gov.za/services/firearm_status_enquiry.php',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1'
      },
      body: formData.toString(),
      signal: controller.signal as any
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      logger.error('Upstream returned error status', { status: response.status });
      throw new Error(`Upstream returned ${response.status}`);
    }

    const html = await response.text();
    logger.debug('Successfully proxied to SAPS', { htmlLength: html.length });
    return html;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        logger.error('Proxy request timeout');
        throw new Error('Request timeout');
      }
      logger.error('Proxy request error', error);
      throw error;
    }

    logger.error('Unknown error during proxy request');
    throw new Error('Unknown error fetching from SAPS');
  }
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  logger.debug('Health check request received');
  res.json({ status: 'ok' });
});

// Firearm status proxy endpoint
app.post('/api/proxy/firearm-status', async (req: Request, res: Response) => {
  const body: FirearmStatusRequest = req.body;
  const clientIP = getClientIP(req);
  
  logger.debug('Firearm status request received', { clientIP, fsref: body.fsref, fserial: body.fserial || '' });

  // Validate input
  const validationError = validateInput(body.fsref, body.fserial);
  if (validationError) {
    logger.warn('Firearm status request rejected: validation error', { clientIP, error: validationError });
    return res.status(400).json({ error: validationError });
  }

  // Rate limiting
  if (!checkRateLimit(clientIP)) {
    logger.warn('Rate limit exceeded', { clientIP });
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  // Proxy to SAPS
  try {
    const html = await proxyToSAPS(body.fsref, body.fserial);

    const response: ProxyResponse = {
      html,
      fetchedAt: new Date().toISOString(),
      query: {
        fsref: body.fsref,
        fserial: body.fserial
      }
    };

    logger.info('Firearm status request successful', { clientIP, fsref: body.fsref });
    res.set('Cache-Control', 'private, max-age=300');
    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Firearm status request failed', { clientIP, error: message });

    // Do not reveal upstream error details to clients; log for debugging only
    res.status(503).json({
      error: 'Failed to query SAPS service'
    });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  logger.warn('404 Not Found', { method: req.method, path: req.path });
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', err);
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`Proxy endpoint: POST http://localhost:${PORT}/api/proxy/firearm-status`);
});

export default app;

