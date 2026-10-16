import { expose } from 'comlink';
import { decodeQrPixels, type QrRead } from './logic';

export const api = {
  async decode(buffer: ArrayBuffer, width: number, height: number): Promise<QrRead | null> {
    return decodeQrPixels(new Uint8ClampedArray(buffer), width, height);
  },
};

expose(api);
