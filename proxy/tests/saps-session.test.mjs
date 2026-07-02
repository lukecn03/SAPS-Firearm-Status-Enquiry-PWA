import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCookieHeader, extractCsrfToken } from '../dist/saps-session.js';

test('extractCsrfToken parses a hidden input token from HTML', () => {
  const html = '<form><input type="hidden" name="csrf_token" value="abc123" /></form>';
  assert.equal(extractCsrfToken(html), 'abc123');
});

test('buildCookieHeader keeps a fallback csrf cookie and any upstream set-cookie values', () => {
  const header = buildCookieHeader('sessionid=xyz; Path=/; HttpOnly', 'csrf_token=abc123');
  assert.match(header, /csrf_token=abc123/);
  assert.match(header, /sessionid=xyz/);
});
