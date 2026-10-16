/**
 * Selected text from the context menu travels to the Extension tab through chrome.storage.session:
 * in-memory only (never written to disk) and cleared as soon as the tab reads it. Never via the URL.
 */
const KEY = 'pending-input';

export interface Handover {
  toolId: string;
  input: string;
}

export async function putHandover(h: Handover) {
  await chrome.storage.session.set({ [KEY]: h });
}

export async function takeHandover(): Promise<Handover | null> {
  const data = await chrome.storage.session.get(KEY);
  const h = data[KEY] as Handover | undefined;
  if (h) await chrome.storage.session.remove(KEY);
  return h ?? null;
}
