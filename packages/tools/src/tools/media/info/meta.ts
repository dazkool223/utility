import { defineTool } from '@/core/types';

export default defineTool({
  id: 'media-info',
  path: 'media/info',
  name: 'Media Info',
  description: 'Show the format, codecs, duration, bitrate, tracks and tags (ID3, MP4) of an audio or video file',
  category: 'media',
  audience: 'general',
  priority: 'P2',
  aliases: ['mediainfo', 'ffprobe', 'codec', 'id3', 'audio metadata', 'video metadata', 'bitrate', 'duration'],
  related: ['audio-convert', 'video-gif'],
  inputKind: 'media',
  accepts: ['audio', 'video'],
  load: () => import('./Tool'),
});
