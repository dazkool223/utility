import { expose } from 'comlink';
import { computeDiff, diffStats, unifiedPatch, type DiffOptions } from './logic';

export const api = {
  diff(a: string, b: string, o: DiffOptions) {
    const parts = computeDiff(a, b, o);
    return { parts, stats: diffStats(parts, o.granularity), patch: o.granularity === 'lines' ? unifiedPatch(a, b) : '' };
  },
};

expose(api);
