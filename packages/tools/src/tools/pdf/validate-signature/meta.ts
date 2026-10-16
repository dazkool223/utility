import { defineTool } from '@/core/types';

export default defineTool({
  id: 'pdf-validate-signature',
  path: 'pdf/validate-signature',
  name: 'PDF Signature Validator',
  description: 'Check whether a PDF’s digital signatures are intact, who signed it, and whether it was changed afterwards',
  category: 'pdf',
  priority: 'P1',
  aliases: ['verify pdf signature', 'pdf digital signature', 'check signed pdf', 'pdf signed', 'pades', 'pkcs7'],
  related: ['pdf-protect', 'pdf-unlock', 'pdf-to-images'],
  inputKind: 'pdf',
  accepts: ['pdf'],
  restrictions: [
    { message: 'Checks that the signature matches the file and the certificate stored in it. It cannot confirm the certificate is trusted or not revoked, because that needs the network.' },
  ],
  load: () => import('./Tool'),
});
