import { defineTool } from '@/core/types';

export default defineTool({
  id: 'audio-convert',
  path: 'media/audio-convert',
  name: 'Audio Converter & Trimmer',
  description: 'Convert audio (or the sound of a video) to MP3, WAV, FLAC, Ogg or M4A, and cut out just the part you want',
  category: 'media',
  priority: 'P2',
  aliases: ['mp3 converter', 'wav to mp3', 'flac to mp3', 'trim audio', 'cut audio', 'extract audio', 'audio cutter', 'm4a', 'ogg opus'],
  related: ['media-info', 'video-gif'],
  inputKind: 'media',
  accepts: ['audio', 'video'],
  restrictions: [
    { message: 'Your browser decodes the source audio, so rare codecs may be unreadable. Ogg and M4A output depend on browser support; the list only shows formats this browser can write.' },
  ],
  load: () => import('./Tool'),
});
