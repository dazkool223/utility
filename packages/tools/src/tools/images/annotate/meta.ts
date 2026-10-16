import { defineTool } from '@/core/types';

export default defineTool({
  id: 'image-annotate',
  path: 'images/annotate',
  name: 'Image Text, Watermark & Blur',
  description: 'Add text or a repeating watermark to a picture, and pixelate or cover parts of it, such as faces or private details',
  category: 'images',
  priority: 'P1',
  aliases: ['add text to image', 'watermark image', 'pixelate image', 'blur face', 'redact image', 'censor image', 'hide part of image', 'caption image', 'mosaic'],
  related: ['image-crop-rotate', 'image-resize', 'image-compress'],
  inputKind: 'image',
  accepts: ['image'],
  restrictions: [
    { message: 'Pixelate and Cover replace the original pixels in the saved file, so the hidden detail cannot be recovered from it. A light pixelate on small text can still be guessed; use Cover for anything sensitive.' },
    { message: 'Metadata (EXIF, GPS, colour profiles) is not kept in the saved file.' },
  ],
  load: () => import('./Tool'),
});
