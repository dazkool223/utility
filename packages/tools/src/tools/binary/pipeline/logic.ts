import type { PipelineStep, ToolMeta } from '@/core/types';

export interface StepResult {
  stepId: string;
  output?: string;
  error?: string;
}

/** Load every Tool's Pipeline steps (each Tool's logic is fetched lazily, in parallel). */
export async function loadSteps(tools: readonly ToolMeta[]): Promise<PipelineStep[]> {
  const lists = await Promise.all(tools.filter((t) => t.steps).map((t) => t.steps!().catch(() => [] as PipelineStep[])));
  return lists.flat().sort((a, b) => a.label.localeCompare(b.label));
}

/** Run `steps` in order, feeding each output into the next. Stops at the first failing step. */
export async function runPipeline(input: string, steps: readonly PipelineStep[]): Promise<StepResult[]> {
  const results: StepResult[] = [];
  let current = input;
  for (const step of steps) {
    try {
      current = await step.run(current);
      results.push({ stepId: step.id, output: current });
    } catch (e) {
      results.push({ stepId: step.id, error: e instanceof Error ? e.message : String(e) });
      break;
    }
  }
  return results;
}
