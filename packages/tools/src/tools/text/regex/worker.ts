import { runRegex, type RegexRequest, type RegexResult } from './logic';

export interface WorkerRequest extends RegexRequest {
  id: number;
}

export type WorkerResponse = { id: number; ok: true; result: RegexResult } | { id: number; ok: false; message: string };

// Matching runs here so a pattern with catastrophic backtracking can be killed by terminating the worker.
self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { id, ...req } = e.data;
  try {
    const res: WorkerResponse = { id, ok: true, result: runRegex(req) };
    self.postMessage(res);
  } catch (err) {
    const res: WorkerResponse = { id, ok: false, message: err instanceof Error ? err.message : String(err) };
    self.postMessage(res);
  }
};
