import { describe, expect, it } from 'vitest';
import { curlToCode, parseCurl, tokenize } from './logic';

describe('tokenize', () => {
  it('handles quotes, escapes and continuations', () => {
    expect(tokenize(`curl 'a b' "c \\"d\\"" e\\ f`)).toEqual(['curl', 'a b', 'c "d"', 'e f']);
    expect(tokenize('curl \\\n  -X POST')).toEqual(['curl', '-X', 'POST']);
    expect(tokenize(`curl $'a\\nb'`)).toEqual(['curl', 'a\nb']);
    expect(tokenize(`curl ''`)).toEqual(['curl', '']);
  });
  it('rejects unclosed quotes', () => {
    expect(() => tokenize(`curl 'abc`)).toThrow('never closed');
    expect(() => tokenize('curl "abc')).toThrow('never closed');
  });
});

describe('parseCurl', () => {
  it('reads a simple GET', () => {
    expect(parseCurl('curl https://example.com')).toMatchObject({ url: 'https://example.com', method: 'GET', headers: [] });
  });
  it('defaults to POST with data and adds a content type', () => {
    const r = parseCurl(`curl https://x.test/api -d 'a=1' -d 'b=2'`);
    expect(r.method).toBe('POST');
    expect(r.body).toBe('a=1&b=2');
    expect(r.headers).toEqual([['Content-Type', 'application/x-www-form-urlencoded']]);
  });
  it('supports combined short flags and attached values', () => {
    const r = parseCurl(`curl -sSL -XPUT https://x.test -H 'A: b'`);
    expect(r.method).toBe('PUT');
    expect(r.headers).toEqual([['A', 'b']]);
    expect(r.ignored).toEqual([]);
  });
  it('moves data into the query with -G', () => {
    expect(parseCurl('curl -G https://x.test/s -d q=1').url).toBe('https://x.test/s?q=1');
  });
  it('maps -u, -A, -e, -b, -I, -k', () => {
    const r = parseCurl(`curl -I -k -u me:pw -A agent -e http://r.test -b 'a=1' https://x.test`);
    expect(r.method).toBe('HEAD');
    expect(r.insecure).toBe(true);
    expect(r.basicAuth).toEqual(['me', 'pw']);
    expect(r.headers.map(([k]) => k)).toEqual(['User-Agent', 'Referer', 'Cookie']);
  });
  it('adds a scheme when missing', () => {
    expect(parseCurl('curl example.com/x').url).toBe('https://example.com/x');
    expect(parseCurl('curl localhost:3000').url).toBe('http://localhost:3000');
  });
  it('reports unsupported options', () => {
    expect(parseCurl('curl --limit-rate 1k https://x.test').ignored).toEqual(['--limit-rate 1k']);
  });
  it('errors clearly', () => {
    expect(() => parseCurl('')).toThrow('Paste a curl command');
    expect(() => parseCurl('wget https://x')).toThrow('start with curl');
    expect(() => parseCurl('curl -X POST')).toThrow('No URL');
    expect(() => parseCurl('curl https://a https://b')).toThrow('second URL');
    expect(() => parseCurl('curl https://a -d @file.json')).toThrow('cannot open');
    expect(() => parseCurl('curl https://a -F file=@x.png')).toThrow('cannot read');
    expect(() => parseCurl('curl https://a -H')).toThrow('needs a value');
  });
  it('stops at a pipe', () => {
    expect(parseCurl('curl https://a | jq .').url).toBe('https://a');
  });
  it('handles --json', () => {
    const r = parseCurl(`curl https://a --json '{"x":1}'`);
    expect(r.method).toBe('POST');
    expect(r.headers).toContainEqual(['Content-Type', 'application/json']);
  });
});

const POST = `curl -X POST 'https://api.test/v1/items' -H 'Content-Type: application/json' -H 'Authorization: Bearer abc' -d '{"name":"x","tags":["a"],"n":1,"ok":true,"z":null}'`;

describe('curlToCode javascript', () => {
  it('converts a JSON POST', () => {
    const out = curlToCode(POST, 'javascript');
    expect(out).toContain('await fetch("https://api.test/v1/items", {');
    expect(out).toContain('method: "POST"');
    expect(out).toContain('"Authorization": "Bearer abc"');
    expect(out).toContain('body: JSON.stringify({');
    expect(out).toContain('"name": "x"');
  });
  it('converts a bare GET', () => {
    expect(curlToCode('curl https://x.test', 'javascript')).toBe('const response = await fetch("https://x.test");\nconst body = await response.text();\nconsole.log(response.status, body);');
  });
  it('keeps non-JSON bodies as strings and encodes basic auth', () => {
    const out = curlToCode(`curl -u a:b -d 'x=1' https://x.test`, 'javascript');
    expect(out).toContain('body: "x=1"');
    expect(out).toContain('"Authorization": "Basic YTpi"');
  });
  it('uses FormData for -F', () => {
    const out = curlToCode(`curl -F a=1 -F 'b=two words' https://x.test`, 'javascript');
    expect(out).toContain('form.append("b", "two words");');
    expect(out).toContain('body: form,');
  });
  it('mentions ignored options and unicode', () => {
    expect(curlToCode(`curl --limit-rate 1k -d 'é' https://x.test`, 'javascript')).toContain('// Not converted: --limit-rate 1k');
    expect(curlToCode(`curl -d 'é€' https://x.test`, 'javascript')).toContain('"é€"');
  });
});

describe('curlToCode python', () => {
  it('converts a JSON POST with python literals', () => {
    const out = curlToCode(POST, 'python');
    expect(out).toContain('import requests');
    expect(out).toContain('requests.post(');
    expect(out).toContain('json={');
    expect(out).toContain('"ok": True');
    expect(out).toContain('"z": None');
    expect(out).toContain('print(response.status_code, response.text)');
  });
  it('handles auth, verify and forms', () => {
    const out = curlToCode(`curl -k -u me:pw -F a=1 https://x.test`, 'python');
    expect(out).toContain('auth=("me", "pw"),');
    expect(out).toContain('verify=False,');
    expect(out).toContain('"a": (None, "1"),');
  });
  it('uses requests.request for unusual methods', () => {
    expect(curlToCode('curl -X PURGE https://x.test', 'python')).toContain('requests.request(\n    "PURGE",');
  });
});

describe('curlToCode shell', () => {
  it('normalises the command', () => {
    expect(curlToCode(`curl -sL -H "Accept: text/plain" 'https://x.test/a b'`, 'shell')).toBe(`curl 'https://x.test/a b' \\\n  -H 'Accept: text/plain'`);
  });
  it('quotes single quotes safely', () => {
    expect(curlToCode(`curl -d "it's" https://x.test`, 'shell')).toContain(`--data-raw 'it'\\''s'`);
  });
});
