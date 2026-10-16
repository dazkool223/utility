import { defineTool } from '@/core/types';

export default defineTool({
  id: 'password-strength',
  path: 'crypto/password-strength',
  name: 'Password Strength Estimator',
  description: 'Estimate how hard a password is to guess, with crack-time estimates and tips (zxcvbn)',
  category: 'crypto',
  audience: 'general',
  priority: 'P2',
  aliases: ['zxcvbn', 'password checker', 'password entropy', 'how strong is my password'],
  related: ['password-generate', 'bcrypt-hash'],
  inputKind: 'text',
  restrictions: [{ message: 'This is an estimate based on common passwords, words and patterns. It runs entirely in your browser; nothing is sent anywhere.' }],
  example: { input: 'password123', expect: 'Very weak' },
  load: () => import('./Tool'),
});
