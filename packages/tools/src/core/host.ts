/**
 * Communication between the host app (Website / Extension) and the Tool currently on screen.
 * Kept in memory only: Tool Input handed over here is never persisted.
 */

export interface PendingInput {
  input?: string;
  files?: File[];
}

let pending: (PendingInput & { toolId: string }) | null = null;

/** Hand Tool Input (text or files) to `toolId`; the host then navigates to it. */
export function setPendingInput(toolId: string, value: PendingInput) {
  pending = { toolId, ...value };
}

/** Read by the host when mounting a Tool. Safe to call repeatedly (React may render twice). */
export function peekPendingInput(toolId: string): PendingInput | undefined {
  if (pending?.toolId !== toolId) return undefined;
  return { input: pending.input, files: pending.files };
}

/** Called by the host when the Tool unmounts, so revisiting it starts empty. */
export function clearPendingInput(toolId: string) {
  if (pending?.toolId === toolId) pending = null;
}

type Navigate = (toolId: string) => void;
let navigateImpl: Navigate = () => {};

/** The host registers how to open a Tool. */
export function registerNavigate(fn: Navigate) {
  navigateImpl = fn;
}

/** Send to…: open `toolId` with `input` as its Tool Input. */
export function sendTo(toolId: string, input: string) {
  setPendingInput(toolId, { input });
  navigateImpl(toolId);
}

/** Global shortcut events dispatched by the host and handled by the active Tool's components. */
export const TOOL_EVENTS = {
  run: 'utility:run',
  copyOutput: 'utility:copy-output',
} as const;
