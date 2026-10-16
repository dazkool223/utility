import { ToolError } from '@/core/types';

export interface StrengthReport {
  score: number;
  scoreLabel: string;
  guessesLog10: number;
  entropyBits: number;
  crackTimes: Array<[string, string]>;
  warning: string;
  suggestions: string[];
  patterns: string[];
}

const LABELS = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
let factory: import('@zxcvbn-ts/core').ZxcvbnFactory | null = null;

async function init() {
  if (factory) return factory;
  const [core, common, en] = await Promise.all([import('@zxcvbn-ts/core'), import('@zxcvbn-ts/language-common'), import('@zxcvbn-ts/language-en')]);
  factory = new core.ZxcvbnFactory({
    translations: en.translations,
    graphs: common.adjacencyGraphs,
    dictionary: { ...common.dictionary, ...en.dictionary },
  });
  return factory;
}

export async function estimateStrength(password: string): Promise<StrengthReport> {
  if (!password) throw new ToolError('Type or paste a password.');
  if (password.length > 256) throw new ToolError('Passwords over 256 characters are not analysed.');
  const r = (await init()).check(password);
  const t = r.crackTimes;
  const n = (x: number | null) => (x ?? 0).toLocaleString('en');
  return {
    score: r.score,
    scoreLabel: LABELS[r.score]!,
    guessesLog10: r.guessesLog10,
    entropyBits: r.guessesLog10 * Math.log2(10),
    crackTimes: [
      [`Online, throttled (${n(t.onlineThrottlingXPerHour.base)} guesses/hour)`, t.onlineThrottlingXPerHour.display],
      [`Online, unthrottled (${n(t.onlineNoThrottlingXPerSecond.base)} guesses/second)`, t.onlineNoThrottlingXPerSecond.display],
      [`Offline, slow hash (${n(t.offlineSlowHashingXPerSecond.base)} guesses/second)`, t.offlineSlowHashingXPerSecond.display],
      [`Offline, fast hash (${n(t.offlineFastHashingXPerSecond.base)} guesses/second)`, t.offlineFastHashingXPerSecond.display],
    ],
    warning: r.feedback.warning ?? '',
    suggestions: r.feedback.suggestions,
    patterns: r.sequence.map((s: { pattern: string; token: string }) => `${s.pattern}: ${s.token}`),
  };
}
