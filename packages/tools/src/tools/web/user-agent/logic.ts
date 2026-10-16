import Bowser from 'bowser';
import { ToolError } from '@/core/types';

export interface UaInfo {
  browser: { name: string; version: string };
  engine: { name: string; version: string };
  os: { name: string; version: string };
  device: { type: string; vendor: string; model: string };
  bot: boolean;
}

const BOT = /bot|crawler|spider|crawling|slurp|bingpreview|facebookexternalhit|headlesschrome|curl\/|wget\/|python-requests|httpclient/i;

export function parseUserAgent(ua: string): UaInfo {
  const s = ua.trim().replace(/^user-agent:\s*/i, '').replace(/^["']|["']$/g, '');
  if (!s) throw new ToolError('Paste a User-Agent string, for example Mozilla/5.0 (Windows NT 10.0; Win64; x64) …');
  if (s.includes('\n')) throw new ToolError('Enter one User-Agent string at a time.');
  const r = Bowser.parse(s);
  return {
    browser: { name: r.browser.name || 'Unknown', version: r.browser.version || '' },
    engine: { name: r.engine.name || 'Unknown', version: r.engine.version || '' },
    os: { name: r.os.name || 'Unknown', version: r.os.version || '' },
    device: { type: r.platform.type || 'unknown', vendor: r.platform.vendor || '', model: r.platform.model || '' },
    bot: BOT.test(s),
  };
}

export function uaRows(i: UaInfo): Array<[string, string]> {
  const join = (...p: string[]) => p.filter(Boolean).join(' ') || 'Unknown';
  return [
    ['Browser', join(i.browser.name, i.browser.version)],
    ['Engine', join(i.engine.name, i.engine.version)],
    ['Operating system', join(i.os.name, i.os.version)],
    ['Device type', i.device.type],
    ['Device', join(i.device.vendor, i.device.model)],
    ['Bot or script', i.bot ? 'Looks like one' : 'No'],
  ];
}

export function describeUserAgent(ua: string): string {
  const rows = uaRows(parseUserAgent(ua));
  const width = Math.max(...rows.map(([k]) => k.length));
  return rows.map(([k, v]) => `${k.padEnd(width)}  ${v}`).join('\n');
}

export function userAgentJson(ua: string): string {
  return JSON.stringify(parseUserAgent(ua), null, 2);
}
