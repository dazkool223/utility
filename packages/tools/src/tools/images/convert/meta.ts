import { defineTool } from '@/core/types';

export default defineTool({
  id: 'image-convert',
  path: 'images/convert',
  name: 'Image Format Converter',
  description: 'Convert images between PNG, JPEG, WebP, AVIF, JPEG XL and QOI, in your browser',
  category: 'images',
  audience: 'general',
  priority: 'P0',
  aliases: ['png to jpg', 'jpg to png', 'webp converter', 'avif converter', 'jxl', 'jpeg xl', 'qoi', 'image converter', 'convert image', 'png to webp', 'heic'],
  related: ['base64-file', 'image-compress', 'image-resize'],
  heavy: true,
  inputKind: 'image',
  accepts: ['image'],
  restrictions: [
    { message: 'AVIF encoding is slow on large images: expect several seconds per megapixel. The page stays responsive while it works.' },
    { message: 'JPEG XL support is a beta encoder, and only Safari can show JPEG XL images, so other browsers cannot preview the result (you can still download it).' },
    { message: 'Metadata (EXIF, GPS, colour profiles) is not copied to the converted file. Animated GIFs convert their first frame only. HEIC/HEIF is not supported.' },
  ],
  load: () => import('./Tool'),
});
