import { defineTool } from '@/core/types';

export default defineTool({
  id: 'password-generate',
  path: 'crypto/password',
  name: 'Password Generator',
  description: 'Strong random passwords and passphrases from your browser\'s secure random source, with an entropy readout',
  category: 'crypto',
  priority: 'P0',
  aliases: ['passphrase', 'random password', 'diceware', 'pwgen'],
  related: ['password-strength', 'nanoid-generate', 'bcrypt-hash'],
  inputKind: 'none',
  quickLauncher: true,
  example: { input: '', expect: '' },
  load: () => import('./Tool'),
});
