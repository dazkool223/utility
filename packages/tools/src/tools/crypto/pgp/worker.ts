import { expose } from 'comlink';
import { decryptMessage, encryptMessage, generateKeyPair, signMessage, verifyMessage } from './logic';

export const api = {
  generate: generateKeyPair,
  encrypt: encryptMessage,
  decrypt: decryptMessage,
  sign: signMessage,
  verify: verifyMessage,
};

expose(api);
