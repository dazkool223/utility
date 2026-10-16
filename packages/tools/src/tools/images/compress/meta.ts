import { defineTool } from '@/core/types';

export default defineTool({
  id: 'image-compress',
  path: 'images/compress',
  name: 'Image Compressor',
  description: 'Make photos and graphics smaller with MozJPEG, WebP, AVIF or lossless PNG recompression, and compare before and after',
  category: 'images',
  priority: 'P0',
  aliases: ['compress image', 'reduce image size', 'optimize image', 'optimise image', 'shrink jpg', 'compress png', 'mozjpeg', 'oxipng', 'squoosh', 'tinypng'],
  related: ['image-convert', 'image-resize', 'image-crop-rotate'],
  heavy: true,
  inputKind: 'image',
  accepts: ['image'],
  restrictions: [
    { message: 'PNG files are recompressed without changing a single pixel. The lossy palette-reduction mode (like TinyPNG) is not included; for smaller PNGs, save as WebP or AVIF instead.' },
    { message: 'Metadata (EXIF, GPS, colour profiles) is not kept in the compressed file. AVIF is slow on large images.' },
  ],
  load: () => import('./Tool'),
});
