export function extractCsrfToken(html: string): string | null {
  const patterns = [
    /name=["']csrf_token["'][^>]*value=["']([^"']+)["']/i,
    /<input[^>]+name=["']csrf_token["'][^>]+value=["']([^"']+)["']/i,
    /csrf_token[^>]*value=["']([^"']+)["']/i
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return null;
}

export function buildCookieHeader(setCookieHeader: string | null, fallbackCookie: string): string {
  const cookies = new Set<string>();

  if (fallbackCookie) {
    fallbackCookie.split(';').forEach((part) => {
      const trimmed = part.trim();
      if (trimmed) {
        cookies.add(trimmed);
      }
    });
  }

  if (setCookieHeader) {
    setCookieHeader.split(',').forEach((part) => {
      const trimmed = part.trim();
      if (trimmed) {
        cookies.add(trimmed);
      }
    });
  }

  return Array.from(cookies).join('; ');
}
