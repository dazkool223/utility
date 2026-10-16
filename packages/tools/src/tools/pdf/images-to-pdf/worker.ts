import { expose, transfer } from 'comlink';
import { imagesToPdf, type ImageInput, type ImagesOptions } from './logic';

export const api = {
  async build(images: ImageInput[], options: ImagesOptions) {
    const out = await imagesToPdf(images, options);
    return transfer(out, [out.bytes.buffer]);
  },
};

expose(api);
