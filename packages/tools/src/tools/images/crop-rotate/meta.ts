import { defineTool } from '@/core/types';

export default defineTool({
  id: 'image-crop-rotate',
  path: 'images/crop-rotate',
  name: 'Image Crop, Rotate & Flip',
  description: 'Crop a picture by dragging or typing the area, turn it in quarter steps and mirror it, then save it',
  category: 'images',
  priority: 'P1',
  aliases: ['crop image', 'rotate image', 'flip image', 'mirror image', 'cut image', 'trim image', 'crop photo', 'aspect ratio crop'],
  related: ['image-resize', 'image-compress', 'image-annotate'],
  inputKind: 'image',
  accepts: ['image'],
  restrictions: [{ message: 'Metadata (EXIF, GPS, colour profiles) is not kept in the saved file. Cropping and turning are exact and lose no quality in PNG; lossy formats are re-encoded.' }],
  load: () => import('./Tool'),
});
