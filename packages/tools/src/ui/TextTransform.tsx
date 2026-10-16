import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ToolError } from '../core/types';
import { sizeRestriction } from '../core/limits';
import { CodeEditor, type EditorLanguage } from './CodeEditor';
import { ArrowLeftRight, Play } from 'lucide-react';
import { Button, CopyButton, DownloadButton, ErrorBox, PaneTitle, RestrictionNotice, Segmented, useRunShortcut } from './controls';
import { SendTo } from './SendTo';
import { useToolMeta } from './context';

export interface TransformMode {
  id: string;
  label: string;
  run: (input: string) => string | Promise<string>;
  inputLanguage?: EditorLanguage;
  outputLanguage?: EditorLanguage;
  /** Download file name for this mode's output. */
  filename?: string;
}

export interface TextTransformProps {
  /** One mode = plain transform. Two or more = mode switch with a Swap button (e.g. Encode / Decode). */
  modes: TransformMode[];
  initialInput?: string;
  /** Options UI rendered between the toolbar and the panes. The modes' `run` closures should read the option state. */
  options?: ReactNode;
  /** Re-run on every change (default). When false, the user presses Run or Ctrl/⌘ Enter. */
  live?: boolean;
  inputPlaceholder?: string;
}

function messageOf(e: unknown): string {
  if (e instanceof ToolError) return e.message;
  if (e instanceof Error) return e.message;
  return String(e);
}

/**
 * Standard text → text Tool: Tool Input editor, options, Tool Output editor, copy / download / Send to….
 * `run` functions throw ToolError (or any Error) for invalid input; the message is shown to the user.
 */
export function TextTransform({ modes, initialInput = '', options, live = true, inputPlaceholder }: TextTransformProps) {
  const meta = useToolMeta();
  const [modeId, setModeId] = useState(modes[0]!.id);
  const mode = modes.find((m) => m.id === modeId) ?? modes[0]!;
  const [input, setInput] = useState(initialInput);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const requestId = useRef(0);

  const execute = useCallback(async () => {
    const id = ++requestId.current;
    if (!input) {
      setOutput('');
      setError(null);
      return;
    }
    setBusy(true);
    try {
      const result = await mode.run(input);
      if (id !== requestId.current) return;
      setOutput(result);
      setError(null);
    } catch (e) {
      if (id !== requestId.current) return;
      setOutput('');
      setError(messageOf(e));
    } finally {
      if (id === requestId.current) setBusy(false);
    }
  }, [input, mode]);

  useEffect(() => {
    if (!live) return;
    // Debounce only large inputs (spec §4) so small edits feel instant.
    const delay = input.length > 1_000_000 ? 400 : input.length > 50_000 ? 120 : 0;
    const t = setTimeout(() => void execute(), delay);
    return () => clearTimeout(t);
  }, [execute, live, input.length]);

  useRunShortcut(useCallback(() => void execute(), [execute]));

  const swap = () => {
    const other = modes.find((m) => m.id !== modeId);
    if (!other) return;
    setModeId(other.id);
    if (output) setInput(output);
  };

  const sizeWarning = sizeRestriction('text', input.length);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {modes.length > 1 && (
          <>
            <Segmented label="Mode" value={modeId} onChange={setModeId} options={modes.map((m) => ({ value: m.id, label: m.label }))} />
            <Button variant="ghost" onClick={swap} title="Use the output as input and switch mode">
              <ArrowLeftRight />
              Swap
            </Button>
          </>
        )}
        <span className="flex-1" />
        {meta?.example && (
          <Button variant="ghost" onClick={() => setInput(meta.example!.input)}>
            Sample
          </Button>
        )}
        <Button variant="ghost" onClick={() => setInput('')} disabled={!input}>
          Clear
        </Button>
        {!live && (
          <Button variant="primary" onClick={() => void execute()} title="Run (Ctrl/⌘ Enter)" testId="run">
            <Play />
            Run
          </Button>
        )}
      </div>
      {options}
      {sizeWarning && <RestrictionNotice>{sizeWarning}</RestrictionNotice>}
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-2">
          <div className="flex min-h-8 items-center">
            <PaneTitle>Input</PaneTitle>
          </div>
          <CodeEditor value={input} onChange={setInput} language={mode.inputLanguage} label="Tool input" testId="tool-input" placeholder={inputPlaceholder ?? 'Paste or type here…'} />
        </section>
        <section className="flex min-w-0 flex-col gap-2" aria-busy={busy}>
          <div className="flex min-h-8 flex-wrap items-center gap-2">
            <PaneTitle>Output</PaneTitle>
            <span className="flex-1" />
            <SendTo text={output} />
            <DownloadButton data={output || null} filename={mode.filename ?? 'output.txt'} />
            <CopyButton text={output} primary />
          </div>
          <ErrorBox error={error} />
          <CodeEditor value={output} language={mode.outputLanguage ?? mode.inputLanguage} readOnly label="Tool output" testId="tool-output" />
        </section>
      </div>
    </div>
  );
}
