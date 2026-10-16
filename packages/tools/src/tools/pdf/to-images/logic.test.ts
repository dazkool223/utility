import { describe, expect, it } from 'vitest';
import { dpiToScale, imageFileName, mimeFor } from './logic';

describe('PDF to images helpers', () => {
  it('converts dpi to a pdf.js scale', () => {
    expect(dpiToScale(72)).toBe(1);
    expect(dpiToScale(144)).toBe(2);
    expect(dpiToScale(300)).toBeCloseTo(4.1667, 3);
  });
  it('pads page numbers so files sort', () => {
    expect(imageFileName('report', 3, 12, 'png')).toBe('report-page-03.png');
    expect(imageFileName('report', 3, 5, 'jpg')).toBe('report-page-3.jpg');
    expect(imageFileName('report', 7, 120, 'png')).toBe('report-page-007.png');
  });
  it('maps formats to MIME types', () => {
    expect(mimeFor('png')).toBe('image/png');
    expect(mimeFor('jpg')).toBe('image/jpeg');
  });
});
