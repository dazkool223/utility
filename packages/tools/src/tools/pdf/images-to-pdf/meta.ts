import { defineTool } from '@/core/types';

export default defineTool({
  id: 'images-to-pdf',
  path: 'pdf/images-to-pdf',
  name: 'Images to PDF',
  description: 'Put JPG, PNG, WebP and other images into one PDF, one image per page',
  category: 'pdf',
  priority: 'P0',
  aliases: ['jpg to pdf', 'png to pdf', 'image to pdf', 'photos to pdf', 'scan to pdf', 'webp to pdf'],
  related: ['pdf-merge', 'pdf-to-images', 'pdf-organise'],
  inputKind: 'image',
  accepts: ['image'],
  restrictions: [{ message: 'WebP, GIF, AVIF and BMP images are re-encoded as PNG first, so their file size can grow. Photo orientation tags (EXIF rotation) are ignored.' }],
  load: () => import('./Tool'),
});
