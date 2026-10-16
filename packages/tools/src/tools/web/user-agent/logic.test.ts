import { describe, expect, it } from 'vitest';
import { describeUserAgent, parseUserAgent, userAgentJson } from './logic';

const CHROME_WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1';
const FIREFOX_LINUX = 'Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0';
const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

describe('parseUserAgent', () => {
  it('reads Chrome on Windows', () => {
    const r = parseUserAgent(CHROME_WIN);
    expect(r.browser).toEqual({ name: 'Chrome', version: '120.0.0.0' });
    expect(r.os.name).toBe('Windows');
    expect(r.engine.name).toBe('Blink');
    expect(r.device.type).toBe('desktop');
    expect(r.bot).toBe(false);
  });
  it('reads Safari on iPhone', () => {
    const r = parseUserAgent(IPHONE);
    expect(r.browser.name).toBe('Safari');
    expect(r.os.name).toBe('iOS');
    expect(r.device.type).toBe('mobile');
    expect(r.device.vendor).toBe('Apple');
  });
  it('reads Firefox on Linux', () => {
    const r = parseUserAgent(FIREFOX_LINUX);
    expect(r.browser.name).toBe('Firefox');
    expect(r.os.name).toBe('Linux');
  });
  it('flags bots', () => {
    expect(parseUserAgent(GOOGLEBOT).bot).toBe(true);
    expect(parseUserAgent('curl/8.4.0').bot).toBe(true);
  });
  it('strips a header prefix and quotes', () => {
    expect(parseUserAgent(`User-Agent: ${FIREFOX_LINUX}`).browser.name).toBe('Firefox');
    expect(parseUserAgent(`"${FIREFOX_LINUX}"`).browser.name).toBe('Firefox');
  });
  it('copes with nonsense', () => {
    expect(parseUserAgent('hello').browser.name).toBe('Unknown');
    expect(parseUserAgent('héllo ünicode 日本語').os.name).toBe('Unknown');
  });
  it('rejects empty and multi-line input', () => {
    expect(() => parseUserAgent('  ')).toThrow('Paste a User-Agent');
    expect(() => parseUserAgent('a\nb')).toThrow('one User-Agent');
  });
});

describe('reports', () => {
  it('prints a summary and JSON', () => {
    expect(describeUserAgent(CHROME_WIN)).toMatch(/Browser\s+Chrome 120\.0\.0\.0/);
    expect(JSON.parse(userAgentJson(CHROME_WIN)).os.name).toBe('Windows');
  });
});
