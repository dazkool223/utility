import { defineTool } from '@/core/types';

export default defineTool({
  id: 'image-resize',
  path: 'images/resize',
  name: 'Image Resizer',
  description: 'Change the pixel size of a picture by width and height or by percentage, with high-quality resampling',
  category: 'images',
  priority: 'P0',
  aliases: ['resize image', 'scale image', 'change image size', 'shrink image', 'enlarge image', 'image dimensions', 'thumbnail'],
  related: ['image-convert', 'image-compress', 'image-crop-rotate'],
  inputKind: 'image',
  accepts: ['image'],
  restrictions: [{ message: 'Metadata (EXIF, GPS, colour profiles) is not kept in the resized file. Enlarging cannot add detail that is not in the original.' }],
  load: () => import('./Tool'),
});
