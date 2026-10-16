import { useEffect, useRef, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { formatBytes } from '@/core/limits';
import { BusyLine, Checkbox, DownloadButton, ErrorBox, FileDrop, FileList, OptionsBar, PaneTitle, Select, TextInput, useWorker } from '@/ui';
import { directionFor, type CsvDelimiter } from './parse';

type Direction = 'csv-to-xlsx' | 'xlsx-to-csv';
type OutDelimiter = ',' | ';' | '\t' | '|';

interface Output {
  blob: Blob;
  filename: string;
  summary: string;
  preview: string[][];
}

const PREVIEW_ROWS = 20; // matches PREVIEW_ROWS in logic.ts
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function baseName(name: string) {
  return name.replace(/\.[^.]+$/, '') || 'data';
}

export default function CsvXlsx({ initialFiles }: ToolProps) {
  const api = useWorker<typeof import('./worker').api>(() => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }));
  const [file, setFile] = useState<File | null>(initialFiles?.[0] ?? null);
  const [direction, setDirection] = useState<Direction | null>(null);
  const [inDelimiter, setInDelimiter] = useState<CsvDelimiter>('auto');
  const [outDelimiter, setOutDelimiter] = useState<OutDelimiter>(',');
  const [numbers, setNumbers] = useState(true);
  const [header, setHeader] = useState(true);
  const [bom, setBom] = useState(false);
  const [sheetName, setSheetName] = useState('Sheet1');
  const [sheet, setSheet] = useState<string | undefined>(undefined);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [output, setOutput] = useState<Output | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const run = useRef(0);

  useEffect(() => {
    setSheet(undefined);
    setSheetNames([]);
    if (!file) return setDirection(null);
    let cancelled = false;
    file.slice(0, 4).arrayBuffer().then((b) => !cancelled && setDirection(directionFor(file.name, new Uint8Array(b))));
    return () => {
      cancelled = true;
    };
  }, [file]);

  useEffect(() => {
    if (!file || !direction) return;
    const id = ++run.current;
    setBusy(true);
    setError(null);
    (async () => {
      try {
        if (direction === 'csv-to-xlsx') {
          const text = await file.text();
          const { bytes, rows, preview } = await api().csvToXlsx(text, { delimiter: inDelimiter, sheetName, numbers, header });
          if (id !== run.current) return;
          setOutput({
            blob: new Blob([bytes as BlobPart], { type: XLSX_MIME }),
            filename: `${baseName(file.name)}.xlsx`,
            summary: `${rows.toLocaleString()} rows · ${formatBytes(bytes.byteLength)} .xlsx`,
            preview,
          });
        } else {
          const result = await api().xlsxToCsv(await file.arrayBuffer(), { sheet, delimiter: outDelimiter, bom });
          if (id !== run.current) return;
          setSheetNames(result.sheetNames);
          setOutput({
            blob: new Blob([result.csv], { type: 'text/csv;charset=utf-8' }),
            filename: `${baseName(file.name)}${result.sheetNames.length > 1 ? `-${result.sheetName}` : ''}.csv`,
            summary: `Sheet "${result.sheetName}" · ${result.rows.toLocaleString()} rows · ${formatBytes(new Blob([result.csv]).size)} CSV`,
            preview: result.preview,
          });
        }
      } catch (e) {
        if (id !== run.current) return;
        setOutput(null);
        // Errors thrown in the worker lose their class but keep their name.
        setError(e instanceof Error && e.name === 'ToolError' ? e.message : 'The file could not be converted.');
      } finally {
        if (id === run.current) setBusy(false);
      }
    })();
  }, [file, direction, inDelimiter, outDelimiter, numbers, header, bom, sheetName, sheet, api]);

  const reset = () => {
    run.current++;
    setFile(null);
    setOutput(null);
    setError(null);
    setBusy(false);
  };

  return (
    <div className="flex flex-col gap-3">
      {!file ? (
        <FileDrop kind="binary" accept=".csv,.tsv,.txt,.xlsx,text/csv" onFiles={(f) => setFile(f[0] ?? null)} label="Drop a .csv file to make an .xlsx, or an .xlsx file to export CSV" />
      ) : (
        <FileList files={[file]} onRemove={reset} />
      )}
      {file && direction && (
        <>
          <OptionsBar>
            <Select
              label="Direction"
              value={direction}
              onChange={(d) => {
                setOutput(null);
                setDirection(d);
              }}
              options={[
                { value: 'csv-to-xlsx', label: 'CSV → XLSX' },
                { value: 'xlsx-to-csv', label: 'XLSX → CSV' },
              ]}
            />
            {direction === 'csv-to-xlsx' ? (
              <>
                <Select
                  label="CSV delimiter"
                  value={inDelimiter}
                  onChange={setInDelimiter}
                  options={[
                    { value: 'auto', label: 'Detect' },
                    { value: ',', label: 'Comma' },
                    { value: ';', label: 'Semicolon' },
                    { value: '\t', label: 'Tab' },
                    { value: '|', label: 'Pipe' },
                  ]}
                />
                <TextInput label="Sheet name" value={sheetName} onChange={setSheetName} />
                <Checkbox label="Store numbers as numbers" checked={numbers} onChange={setNumbers} />
                <Checkbox label="First row is a header" checked={header} onChange={setHeader} />
              </>
            ) : (
              <>
                {sheetNames.length > 1 && (
                  <Select label="Sheet" value={sheet ?? sheetNames[0]!} onChange={setSheet} options={sheetNames.map((n) => ({ value: n, label: n }))} />
                )}
                <Select
                  label="CSV delimiter"
                  value={outDelimiter}
                  onChange={setOutDelimiter}
                  options={[
                    { value: ',', label: 'Comma' },
                    { value: ';', label: 'Semicolon' },
                    { value: '\t', label: 'Tab' },
                    { value: '|', label: 'Pipe' },
                  ]}
                />
                <Checkbox label="Add UTF-8 BOM (for Excel)" checked={bom} onChange={setBom} />
              </>
            )}
          </OptionsBar>
          <ErrorBox error={error} />
          <BusyLine busy={busy && !output} label="Converting…" />
          {output && (
            <section className="flex min-w-0 flex-col gap-2">
              <div className="flex min-h-8 items-center gap-2">
                <PaneTitle>Result</PaneTitle>
                <span className="text-sm text-muted-foreground">{output.summary}</span>
                <span className="flex-1" />
                <DownloadButton data={output.blob} filename={output.filename} type={output.blob.type} label={`Download ${output.filename}`} />
              </div>
              <div className="max-h-96 overflow-auto rounded-lg border bg-card" data-testid="tool-output">
                <table className="w-full text-sm">
                  <tbody>
                    {output.preview.map((row, r) => (
                      <tr key={r} className="border-b last:border-0">
                        {row.map((cell, c) => (
                          <td key={c} className={r === 0 ? 'px-3 py-1.5 font-medium whitespace-nowrap' : 'px-3 py-1.5 whitespace-nowrap'}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {output.preview.length === PREVIEW_ROWS && <p className="text-xs text-muted-foreground">Showing the first {PREVIEW_ROWS} rows; the download has everything.</p>}
            </section>
          )}
        </>
      )}
    </div>
  );
}
