import { describe, expect, it } from 'vitest';
import { TOOLS } from '@/core/registry';
import { loadSteps, runPipeline } from './logic';

describe('Pipeline', () => {
  it('loads steps from every Tool that offers them, with unique ids', async () => {
    const steps = await loadSteps(TOOLS);
    expect(steps.length).toBeGreaterThanOrEqual(4);
    expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
  });

  it('chains steps: Base64 decode → JSON format', async () => {
    const steps = await loadSteps(TOOLS);
    const pick = (id: string) => steps.find((s) => s.id === id)!;
    const encoded = btoa('{"b":1,"a":[true]}');
    const results = await runPipeline(encoded, [pick('base64:decode'), pick('json-format:sorted')]);
    expect(results.every((r) => r.error === undefined)).toBe(true);
    expect(results.at(-1)!.output).toBe('{\n  "a": [\n    true\n  ],\n  "b": 1\n}');
  });

  it('stops at the first failing step and reports it', async () => {
    const steps = await loadSteps(TOOLS);
    const pick = (id: string) => steps.find((s) => s.id === id)!;
    const results = await runPipeline('not base64 !!', [pick('base64:decode'), pick('json-format:pretty')]);
    expect(results).toHaveLength(1);
    expect(results[0]!.error).toMatch(/Base64/);
  });

  it('returns the input untouched with no steps', async () => {
    expect(await runPipeline('x', [])).toEqual([]);
  });
});
