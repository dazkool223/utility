import { useMemo, useRef, useState } from 'react';
import { ToolError, type ToolProps } from '@/core/types';
import { Button, Checkbox, CodeEditor, DownloadButton, ErrorBox, NumberInput, OptionsBar, PaneTitle, Segmented, Select } from '@/ui';
import {
  DEFAULT_PRINT_OPTIONS,
  PAGE_HEIGHT_MM,
  PAGE_WIDTH_MM,
  buildPrintDocument,
  documentTitle,
  fileNameFor,
  renderBody,
  wordCount,
  type FontFamily,
  type Orientation,
  type PageSize,
  type SourceKind,
  type PrintOptions,
} from './logic';
import { createSanitiser } from './sanitise';

const MM_TO_PX = 96 / 25.4;

export default function MarkdownPdf({ initialInput = '' }: ToolProps) {
  const [kind, setKind] = useState<SourceKind>(() => (/^\s*<(!doctype|html|body|div|p|h[1-6]|table|section|article)\b/i.test(initialInput) ? 'html' : 'markdown'));
  const [source, setSource] = useState(initialInput);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PRINT_OPTIONS.pageSize);
  const [orientation, setOrientation] = useState<Orientation>(DEFAULT_PRINT_OPTIONS.orientation);
  const [marginMm, setMarginMm] = useState(DEFAULT_PRINT_OPTIONS.marginMm);
  const [fontPt, setFontPt] = useState(DEFAULT_PRINT_OPTIONS.fontPt);
  const [font, setFont] = useState<FontFamily>(DEFAULT_PRINT_OPTIONS.font);
  const [breakBeforeH1, setBreakBeforeH1] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const sanitise = useMemo(() => createSanitiser(window), []);

  const built = useMemo(() => {
    try {
      const body = renderBody(source, kind, sanitise);
      if (!body) return { doc: null, title: '', words: 0, error: null as string | null };
      const title = documentTitle(body);
      const options: PrintOptions = { pageSize, orientation, marginMm, fontPt, font, breakBeforeH1 };
      return { doc: buildPrintDocument(body, title, options), title, words: wordCount(body), error: null };
    } catch (e) {
      return { doc: null, title: '', words: 0, error: e instanceof ToolError ? e.message : 'The document could not be prepared.' };
    }
  }, [source, kind, sanitise, pageSize, orientation, marginMm, fontPt, font, breakBeforeH1]);

  const landscape = orientation === 'landscape';
  const widthPx = Math.round((landscape ? PAGE_HEIGHT_MM[pageSize] : PAGE_WIDTH_MM[pageSize]) * MM_TO_PX);
  const heightPx = Math.round((landscape ? PAGE_WIDTH_MM[pageSize] : PAGE_HEIGHT_MM[pageSize]) * MM_TO_PX);

  const print = () => {
    const win = frame.current?.contentWindow;
    if (!win) return;
    win.focus();
    win.print();
  };

  return (
    <div className="flex flex-col gap-3">
      <OptionsBar>
        <Segmented
          label="Source"
          value={kind}
          onChange={setKind}
          options={[
            { value: 'markdown', label: 'Markdown' },
            { value: 'html', label: 'HTML' },
          ]}
        />
        <Select
          label="Page size"
          value={pageSize}
          onChange={setPageSize}
          options={[
            { value: 'a4', label: 'A4' },
            { value: 'letter', label: 'US Letter' },
            { value: 'legal', label: 'US Legal' },
            { value: 'a3', label: 'A3' },
            { value: 'a5', label: 'A5' },
          ]}
        />
        <Select
          label="Orientation"
          value={orientation}
          onChange={setOrientation}
          options={[
            { value: 'portrait', label: 'Portrait' },
            { value: 'landscape', label: 'Landscape' },
          ]}
        />
        <NumberInput label="Margin (mm)" value={marginMm} onChange={setMarginMm} min={0} max={60} step={1} />
        <NumberInput label="Font size (pt)" value={fontPt} onChange={setFontPt} min={6} max={36} step={0.5} />
        <Select
          label="Font"
          value={font}
          onChange={setFont}
          options={[
            { value: 'sans', label: 'Sans-serif' },
            { value: 'serif', label: 'Serif' },
            { value: 'mono', label: 'Monospace' },
          ]}
        />
        <Checkbox label="New page for each H1" checked={breakBeforeH1} onChange={setBreakBeforeH1} />
      </OptionsBar>
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-2">
          <PaneTitle>{kind === 'markdown' ? 'Markdown' : 'HTML'}</PaneTitle>
          <CodeEditor
            value={source}
            onChange={setSource}
            language={kind === 'markdown' ? 'markdown' : 'html'}
            label={kind === 'markdown' ? 'Markdown input' : 'HTML input'}
            testId="tool-input"
            className="min-h-96"
            placeholder={kind === 'markdown' ? '# My document\n\nWrite or paste Markdown here…' : '<h1>My document</h1>\n<p>Write or paste HTML here…</p>'}
          />
        </section>
        <section className="flex min-w-0 flex-col gap-2">
          <div className="flex min-h-8 items-center gap-2">
            <PaneTitle>Print preview</PaneTitle>
            <span className="flex-1" />
            <DownloadButton data={built.doc} filename={`${fileNameFor(built.title)}.html`} type="text/html;charset=utf-8" label="Download HTML" />
            <Button variant="primary" onClick={print} disabled={!built.doc} testId="print">
              Print / Save as PDF
            </Button>
          </div>
          <ErrorBox error={built.error} />
          <div className="flex min-w-0 flex-col gap-2 rounded-lg border bg-card p-2" data-testid="tool-output">
            {built.doc ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Title: <span className="font-medium text-foreground">{built.title}</span> · {built.words.toLocaleString()} words · choose &quot;Save as PDF&quot; in the print dialog
                </p>
                <div className="overflow-auto rounded border bg-white" style={{ maxHeight: '36rem' }}>
                  <iframe
                    ref={frame}
                    title="Print preview"
                    srcDoc={built.doc}
                    sandbox="allow-same-origin allow-modals"
                    className="block border-0 bg-white"
                    style={{ width: widthPx, height: heightPx, maxWidth: 'none' }}
                  />
                </div>
              </>
            ) : (
              <p className="px-1 py-6 text-center text-sm text-muted-foreground">Nothing to print yet. Type or paste a document on the left.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
