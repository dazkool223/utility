import { useEffect, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { Button, CodeEditor, CopyButton, ErrorBox, NumberInput, OptionsBar, PaneTitle, Select, TextInput, downloadBlob } from '@/ui';
import { DEFAULT_QR, dataUrlToBlob, qrPngDataUrl, qrSvg, type EcLevel } from './logic';

export default function QrTool({ initialInput }: ToolProps) {
  const [text, setText] = useState(initialInput ?? '');
  const [ec, setEc] = useState<EcLevel>(DEFAULT_QR.ec);
  const [size, setSize] = useState(DEFAULT_QR.size);
  const [margin, setMargin] = useState(DEFAULT_QR.margin);
  const [dark, setDark] = useState(DEFAULT_QR.dark);
  const [light, setLight] = useState(DEFAULT_QR.light);
  const [svg, setSvg] = useState('');
  const [png, setPng] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!text) {
      setSvg('');
      setPng('');
      setError(null);
      return;
    }
    let live = true;
    const o = { ec, size, margin, dark, light };
    (async () => {
      try {
        const [s, p] = await Promise.all([qrSvg(text, o), qrPngDataUrl(text, o)]);
        if (!live) return;
        setSvg(s);
        setPng(p);
        setError(null);
      } catch (e) {
        if (!live) return;
        setSvg('');
        setPng('');
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      live = false;
    };
  }, [text, ec, size, margin, dark, light]);

  return (
    <div className="flex flex-col gap-3">
      <OptionsBar>
        <Select label="Error correction" value={ec} onChange={setEc} options={[{ value: 'L', label: 'L (7%)' }, { value: 'M', label: 'M (15%)' }, { value: 'Q', label: 'Q (25%)' }, { value: 'H', label: 'H (30%)' }]} />
        <NumberInput label="Size (px)" value={size} onChange={setSize} min={64} max={4096} step={32} />
        <NumberInput label="Margin (modules)" value={margin} onChange={setMargin} min={0} max={20} />
        <TextInput label="Dark colour" value={dark} onChange={setDark} monospace className="w-28" />
        <TextInput label="Light colour" value={light} onChange={setLight} monospace className="w-28" />
      </OptionsBar>
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-2">
          <div className="flex min-h-8 items-center">
            <PaneTitle>Text or link</PaneTitle>
          </div>
          <CodeEditor value={text} onChange={setText} label="Tool input" testId="tool-input" placeholder="https://example.com" className="!h-40 !min-h-0" />
          {png && <img src={png} alt="Generated QR code" className="max-h-80 w-fit max-w-full rounded-lg border bg-white p-1" />}
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" disabled={!png} onClick={() => downloadBlob(dataUrlToBlob(png), 'qrcode.png')}>
              Download PNG
            </Button>
            <Button disabled={!svg} onClick={() => downloadBlob(svg, 'qrcode.svg', 'image/svg+xml')}>
              Download SVG
            </Button>
          </div>
        </section>
        <section className="flex min-w-0 flex-col gap-2">
          <div className="flex min-h-8 items-center gap-2">
            <PaneTitle>SVG source</PaneTitle>
            <span className="flex-1" />
            <CopyButton primary text={svg} label="Copy SVG" />
          </div>
          <ErrorBox error={error} />
          <CodeEditor value={svg} language="xml" readOnly label="Tool output" testId="tool-output" />
        </section>
      </div>
    </div>
  );
}
