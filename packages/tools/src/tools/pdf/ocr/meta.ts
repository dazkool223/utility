import { defineTool } from '@/core/types';

export default defineTool({
  id: 'pdf-ocr',
  path: 'pdf/ocr',
  name: 'PDF OCR',
  description: 'Read the text in a scanned PDF or in pictures, copy it out, and make a searchable PDF',
  category: 'pdf',
  priority: 'P2',
  aliases: ['ocr', 'scanned pdf to text', 'searchable pdf', 'image to text', 'extract text from image', 'tesseract', 'read scanned document', 'make pdf searchable'],
  related: ['pdf-to-images', 'images-to-pdf', 'pdf-split'],
  heavy: true,
  inputKind: 'pdf',
  accepts: ['pdf'],
  restrictions: [
    { message: 'English only. Recognition is slow: expect several seconds per page, and clean scans of printed text work best. Handwriting and tables are not read well.' },
    { message: 'The searchable PDF rebuilds each page from a picture of it, so the original text, links and form fields are replaced by the scan plus recognised text. Password-protected PDFs must be unlocked first.' },
  ],
  load: () => import('./Tool'),
});
