import type { Worker as TesseractWorker } from 'tesseract.js';
import { ToolError } from '@/core/types';
import { wordsFromBlocks, type OcrPageResult } from './logic';

/**
 * Tesseract, with its worker, WebAssembly core and English model all served from our own origin
 * (apps/web/public/engines/ocr). Nothing is downloaded from a CDN and nothing is cached in IndexedDB.
 */
const BASE = '/engines/ocr/';

export interface Engine {
  recognize(image: HTMLCanvasElement | Blob): Promise<OcrPageResult>;
  terminate(): Promise<void>;
}

/** `onStatus` receives Tesseract's own status text ("loading language traineddata") and 0–1 progress. */
export async function startEngine(onStatus: (status: string, progress: number) => void): Promise<Engine> {
  const { createWorker } = await import('tesseract.js');
  let worker: TesseractWorker;
  try {
    worker = await createWorker('eng', 1, {
      workerPath: `${BASE}worker.min.js`,
      corePath: BASE,
      langPath: BASE,
      gzip: true,
      workerBlobURL: false,
      cacheMethod: 'none',
      logger: (m) => onStatus(m.status, m.progress),
    });
  } catch (e) {
    throw new ToolError(`The text recognition engine could not be started: ${e instanceof Error ? e.message : String(e)}`);
  }
  return {
    async recognize(image) {
      const { data } = await worker.recognize(image, {}, { text: true, blocks: true });
      return { text: data.text, words: wordsFromBlocks(data.blocks), confidence: data.confidence };
    },
    async terminate() {
      await worker.terminate();
    },
  };
}
