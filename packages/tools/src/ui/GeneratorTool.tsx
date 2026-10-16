import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { CodeEditor, type EditorLanguage } from './CodeEditor';
import { RefreshCw } from 'lucide-react';
import { Button, CopyButton, DownloadButton, ErrorBox, PaneTitle, useRunShortcut } from './controls';
import { SendTo } from './SendTo';

export interface GeneratorToolProps {
  /** Produce a fresh Tool Output. Re-run whenever `generate` changes identity (i.e. options change). */
  generate: () => string | Promise<string>;
  options?: ReactNode;
  language?: EditorLanguage;
  filename?: string;
}

/** Standard generator Tool (UUIDs, passwords, lorem ipsum…): options, Generate button, output. */
export function GeneratorTool({ generate, options, language = 'text', filename = 'output.txt' }: GeneratorToolProps) {
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    try {
      setOutput(await generate());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [generate]);

  useEffect(() => {
    void run();
  }, [run]);
  useRunShortcut(run);

  return (
    <div className="flex flex-col gap-3">
      {options}
      <section className="flex min-w-0 flex-col gap-2">
        <div className="flex min-h-8 flex-wrap items-center gap-2">
          <PaneTitle>Output</PaneTitle>
          <span className="flex-1" />
          <Button variant="primary" onClick={() => void run()} title="Generate (Ctrl/⌘ Enter)" testId="run">
            <RefreshCw />
            Generate
          </Button>
          <SendTo text={output} />
          <DownloadButton data={output || null} filename={filename} />
          <CopyButton text={output} primary />
        </div>
        <ErrorBox error={error} />
        <CodeEditor value={output} language={language} readOnly label="Tool output" testId="tool-output" />
      </section>
    </div>
  );
}
