import { logger } from './logger';

// Rate limiting constants
const RATE_LIMIT_WINDOW = 60_000; // 60 seconds (existing rate limit window)
const RATE_LIMIT_MAX = 10; // Existing per-IP limit: 10 req/60s
const DAILY_LIMIT_THRESHOLD = 98_000; // Start returning 429 at this count

// Rate limit tracking maps
const ipRateMap = new Map<string, { count: number; firstSeen: number }>();
let dailyRequestCount = 0;
let currentDayUtc = getUtcDateString();

// Helper function to get current UTC date as YYYY-MM-DD
function getUtcDateString(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const commonHeaders = {
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'max-age=0',
  'Connection': 'keep-alive',
  'Origin': 'https://www.saps.gov.za',
  'Referer': 'https://www.saps.gov.za/services/firearm_status_enquiry.php',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'same-origin',
  'Upgrade-Insecure-Requests': '1',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const CSRF_TOKEN = env.CSRF_TOKEN || '';
    const SAPS_URL = env.SAPS_URL || 'https://www.saps.gov.za/services/firearm_status_enquiry.php';
    
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    const url = new URL(request.url);

    if (url.pathname === '/api/firearm-status' && request.method === 'POST') {
      const clientIp = (request.headers.get('cf-connecting-ip') || 'unknown').split(',')[0].trim();
      logger.info('Request received', { clientIp });

      // Reset daily counter if date changed
      const todayUtc = getUtcDateString();
      if (todayUtc !== currentDayUtc) {
        logger.info('Daily counter reset', { previousDay: currentDayUtc, newDay: todayUtc, count: dailyRequestCount });
        currentDayUtc = todayUtc;
        dailyRequestCount = 0;
      }

      // Check global daily limit - block ALL requests from ANY IP when reached
      if (dailyRequestCount >= DAILY_LIMIT_THRESHOLD) {
        logger.warn('Daily limit threshold reached', { count: dailyRequestCount });
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      // Check existing per-IP per-minute rate limit (10 req/60s)
      const now = Date.now();
      const entry = ipRateMap.get(clientIp);
      if (!entry || now - entry.firstSeen > RATE_LIMIT_WINDOW) {
        ipRateMap.set(clientIp, { count: 1, firstSeen: now });
      } else {
        entry.count += 1;
        if (entry.count > RATE_LIMIT_MAX) {
          logger.warn('Rate limit exceeded', { clientIp, count: entry.count, limit: RATE_LIMIT_MAX });
          return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
            status: 429,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }
        ipRateMap.set(clientIp, entry);
      }

      // Increment daily counter
      dailyRequestCount += 1;
      if (dailyRequestCount % 10_000 === 0) {
        logger.info('Daily request count milestone', { count: dailyRequestCount, threshold: DAILY_LIMIT_THRESHOLD, percentUsed: Math.round((dailyRequestCount / DAILY_LIMIT_THRESHOLD) * 100) });
      }

      try {
        const contentType = request.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          return new Response(JSON.stringify({ error: 'Expected JSON' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
        }

        const body = await request.json() as { fsref?: unknown; fserial?: unknown };
        const fsref = typeof body.fsref === 'string' ? body.fsref.trim() : '';
        const fserial = typeof body.fserial === 'string' ? body.fserial.trim() : '';

        if (!fsref || fsref.length > 40 || fserial.length > 40) {
          return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
        }

        const maskedFsref = `${fsref.slice(0, 4)}...`;
        logger.info('Proxying', { maskedFsref, hasFserial: !!fserial });

        const formBody = new URLSearchParams();
        formBody.append('csrf_token', CSRF_TOKEN);
        formBody.append('fsref', fsref);
        formBody.append('fserial', fserial || '');

        const controller = new AbortController();
        // SAPS endpoint can be slow; allow up to 30 seconds for a response
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const outboundHeaders = {
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'accept-language': 'en-US,en;q=0.9,hr;q=0.8',
          'cache-control': 'max-age=0',
          'content-type': 'application/x-www-form-urlencoded',
          'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'document',
          'sec-fetch-mode': 'navigate',
          'sec-fetch-site': 'same-origin',
          'sec-fetch-user': '?1',
          'upgrade-insecure-requests': '1',
          'cookie': `csrf_token=${CSRF_TOKEN}; _ga=GA1.1.000000000.0000000000`,
          'Referer': 'https://www.saps.gov.za/services/firearm_status_enquiry.php'
        };

        logger.info('Outbound fetch prepared', { url: SAPS_URL, headerKeys: Object.keys(outboundHeaders), bodyPreview: formBody.toString().slice(0, 200) });

        let response: Response;
        try {
          try {
            response = await fetch(SAPS_URL, {
              method: 'POST',
              headers: outboundHeaders,
              body: formBody.toString(),
              signal: controller.signal,
              cf: { cacheEverything: false, cacheTtl: 0 }
            });
          } catch (fetchErr) {
            const fmsg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
            logger.error('Fetch to upstream failed', { message: fmsg, name: (fetchErr as any)?.name, stack: (fetchErr as any)?.stack, url: SAPS_URL });
            console.error('Fetch error details:', fetchErr);
            // Re-throw so outer catch handles the response
            throw fetchErr;
          }
        } finally {
          clearTimeout(timeoutId);
        }

        if (!response.ok) {
          logger.warn('SAPS returned error', { status: response.status });
          return new Response(JSON.stringify({ error: 'Upstream error' }), { status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
        }

        const html = await response.text();
        logger.info('Success');

        return new Response(JSON.stringify({ html, fetchedAt: new Date().toISOString() }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        const stack = (error as any)?.stack;
        logger.error('Error', { message: msg, stack });
        console.error('Worker caught error:', error);
        // Include details in response for local debugging
        return new Response(JSON.stringify({ error: 'Server error', details: msg, stack }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }
};

