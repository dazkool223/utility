import { defineTool } from '@/core/types';

export default defineTool({
  id: 'image-background-remover',
  path: 'images/background-remover',
  name: 'Background Remover',
  description: 'Cut the subject out of a photo and get a transparent PNG, or put it on a solid colour',
  category: 'images',
  audience: 'general',
  priority: 'P2',
  aliases: ['remove background', 'remove bg', 'background eraser', 'transparent background', 'cutout', 'cut out', 'png cutout', 'erase background', 'isolate subject', 'removebg'],
  related: ['image-convert', 'image-resize', 'image-crop-rotate', 'image-compress', 'image-annotate'],
  heavy: true,
  inputKind: 'image',
  accepts: ['image'],
  restrictions: [
    { message: 'The first run downloads a 176 MB model and 12–25 MB of engine files from this site, then keeps them for offline use. Nothing about your picture is uploaded.' },
    { message: 'Works best on a clear subject such as a person, product or animal. Fine hair, glass and busy backgrounds can leave rough edges. The result is always a PNG.' },
    { message: 'This browser does not support OffscreenCanvas, which the Background Remover needs. Use a current Chrome, Edge, Firefox or Safari.', applies: () => typeof OffscreenCanvas === 'undefined' },
  ],
  load: () => import('./Tool'),
});
