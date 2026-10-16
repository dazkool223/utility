import { defineTool } from '@/core/types';

export default defineTool({
  id: 'video-gif',
  path: 'media/video-gif',
  name: 'Video to GIF',
  description: 'Turn a clip from a video into an animated GIF, choosing the size, frame rate and the part to keep',
  category: 'media',
  priority: 'P2',
  aliases: ['mp4 to gif', 'webm to gif', 'mov to gif', 'gif maker', 'video to gif converter', 'animated gif'],
  related: ['media-info', 'audio-convert', 'image-convert'],
  inputKind: 'media',
  accepts: ['video'],
  restrictions: [
    { message: 'GIFs get large quickly. Keep clips short and the width small; a clip is limited to 600 frames. Your browser has to be able to play the video codec.' },
  ],
  load: () => import('./Tool'),
});
