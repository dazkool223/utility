import { defineTool } from '@/core/types';

export default defineTool({
  id: 'base64-file',
  path: 'encoders/base64-file',
  name: 'Base64 File & Image ↔ Data URI',
  description: 'Turn a file or image into Base64 or a data URI, or turn Base64 back into a file with a preview',
  category: 'encoders',
  priority: 'P0',
  aliases: ['image to base64', 'base64 to image', 'data uri', 'data url', 'file to base64', 'base64 to file', 'img base64', 'base64 image'],
  related: ['base64-text'],
  inputKind: 'binary',
  accepts: ['image', 'file', 'base64'],
  load: () => import('./Tool'),
});
