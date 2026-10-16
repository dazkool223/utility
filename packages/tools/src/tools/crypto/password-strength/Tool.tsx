import type { ToolProps } from '@/core/types';
import { useWorker } from '@/ui';
import { DecoderTool, type Row } from '../_lib/DecoderTool';

export default function PasswordStrengthTool({ initialInput }: ToolProps) {
  const api = useWorker<typeof import('./worker').api>(() => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }));
  return (
    <DecoderTool
      initialInput={initialInput}
      placeholder="Type or paste a password to test…"
      decode={async (pw) => {
        const r = await api().estimate(pw);
        const rows: Row[] = [
          ['Score', `${r.scoreLabel} (${r.score} of 4)`],
          ['Guesses needed', `about 10^${r.guessesLog10.toFixed(1)} (${Math.round(r.entropyBits)} bits)`],
          ...r.crackTimes,
        ];
        if (r.warning) rows.push(['Warning', r.warning]);
        if (r.suggestions.length) rows.push(['Suggestions', <span className="whitespace-pre-wrap">{r.suggestions.join('\n')}</span>]);
        if (r.patterns.length) rows.push(['Patterns found', <span className="whitespace-pre-wrap">{r.patterns.join('\n')}</span>]);
        return rows;
      }}
    />
  );
}
