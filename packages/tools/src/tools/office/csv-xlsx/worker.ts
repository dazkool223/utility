import { expose } from 'comlink';
import { csvToXlsxDetailed, xlsxToCsv, type CsvToXlsxOptions, type CsvToXlsxResult, type XlsxToCsvOptions, type XlsxToCsvResult } from './logic';

export const api = {
  async csvToXlsx(csv: string, options: CsvToXlsxOptions): Promise<CsvToXlsxResult> {
    return csvToXlsxDetailed(csv, options);
  },
  async xlsxToCsv(bytes: ArrayBuffer, options: XlsxToCsvOptions): Promise<XlsxToCsvResult> {
    return xlsxToCsv(bytes, options);
  },
};

expose(api);
