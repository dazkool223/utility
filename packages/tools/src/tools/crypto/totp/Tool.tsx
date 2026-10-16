import { useEffect, useRef, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { Button, CodeEditor, CopyButton, ErrorBox, KeyValueTable, NumberInput, OptionsBar, PaneTitle, Select, TextInput } from '@/ui';
import { DEFAULT_PARAMS, generateOtp, parseOtpUri, randomSecret, validateOtp, type OtpAlgorithm, type OtpParams, type OtpResult, type OtpType } from './logic';

export default function TotpTool({ initialInput }: ToolProps) {
  const [input, setInput] = useState(initialInput ?? '');
  const [type, setType] = useState<OtpType>('totp');
  const [algorithm, setAlgorithm] = useState<OtpAlgorithm>('SHA1');
  const [digits, setDigits] = useState(6);
  const [period, setPeriod] = useState(30);
  const [counter, setCounter] = useState(0);
  const [issuer, setIssuer] = useState('');
  const [label, setLabel] = useState('account');
  const [token, setToken] = useState('');
  const [window, setWindow] = useState(1);
  const [tick, setTick] = useState(() => Date.now());
  const [result, setResult] = useState<OtpResult | null>(null);
  const [check, setCheck] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qr, setQr] = useState('');
  const req = useRef(0);

  useEffect(() => {
    if (type !== 'totp') return;
    const t = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, [type]);

  // A pasted otpauth:// link fills in every option.
  useEffect(() => {
    if (!input.trim().startsWith('otpauth://')) return;
    parseOtpUri(input).then((p) => {
      setType(p.type);
      setAlgorithm(p.algorithm);
      setDigits(p.digits);
      setPeriod(p.period);
      setCounter(p.counter);
      setIssuer(p.issuer);
      setLabel(p.label);
      setInput(p.secret);
    }).catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [input]);

  useEffect(() => {
    const id = ++req.current;
    if (!input.trim() || input.trim().startsWith('otpauth://')) {
      setResult(null);
      setCheck(null);
      if (!input.trim()) setError(null);
      return;
    }
    const params: OtpParams = { ...DEFAULT_PARAMS, type, secret: input, algorithm, digits, period, counter, issuer, label };
    (async () => {
      try {
        const r = await generateOtp(params, tick);
        let c: string | null = null;
        if (token.trim()) {
          const d = await validateOtp(params, token, tick, window);
          c = d === null ? 'Not valid' : d === 0 ? 'Valid (current)' : `Valid (${type === 'totp' ? `${d > 0 ? '+' : ''}${d} step${Math.abs(d) === 1 ? '' : 's'} from now` : `counter + ${d}`})`;
        }
        if (id !== req.current) return;
        setResult(r);
        setCheck(c);
        setError(null);
      } catch (e) {
        if (id !== req.current) return;
        setResult(null);
        setCheck(null);
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, type, algorithm, digits, period, counter, issuer, label, token, window, tick]);

  const uri = result?.uri;
  useEffect(() => {
    if (!uri) {
      setQr('');
      return;
    }
    let live = true;
    void import('qrcode').then((QR) => QR.toDataURL(uri, { margin: 1, width: 192 })).then((url) => live && setQr(url));
    return () => {
      live = false;
    };
  }, [uri]);

  const rows: Array<[string, string]> = result
    ? [
        ['Code', result.code],
        ...(result.secondsLeft !== undefined ? ([['Valid for', `${result.secondsLeft} s`]] as Array<[string, string]>) : []),
        ...(result.previous ? ([['Previous code', result.previous]] as Array<[string, string]>) : []),
        ['Next code', result.next ?? ''],
        ...(check ? ([['Check', check]] as Array<[string, string]>) : []),
        ['otpauth:// link', result.uri],
      ]
    : [];

  return (
    <div className="flex flex-col gap-3">
      <OptionsBar>
        <Select label="Type" value={type} onChange={setType} options={[{ value: 'totp', label: 'TOTP (time-based)' }, { value: 'hotp', label: 'HOTP (counter)' }]} />
        <Select label="Algorithm" value={algorithm} onChange={setAlgorithm} options={[{ value: 'SHA1', label: 'SHA-1' }, { value: 'SHA256', label: 'SHA-256' }, { value: 'SHA512', label: 'SHA-512' }]} />
        <NumberInput label="Digits" value={digits} onChange={setDigits} min={6} max={8} />
        {type === 'totp' ? <NumberInput label="Period (s)" value={period} onChange={setPeriod} min={1} max={3600} /> : <NumberInput label="Counter" value={counter} onChange={setCounter} min={0} />}
        <TextInput label="Issuer" value={issuer} onChange={setIssuer} className="w-36" />
        <TextInput label="Account" value={label} onChange={setLabel} className="w-40" />
        <TextInput label="Check a code" value={token} onChange={setToken} monospace className="w-28" testId="otp-token" />
        <NumberInput label="Window (+/- steps)" value={window} onChange={setWindow} min={0} max={10} />
      </OptionsBar>
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="flex min-w-0 flex-col gap-2">
          <div className="flex min-h-8 items-center gap-2">
            <PaneTitle>Secret (Base32) or otpauth:// link</PaneTitle>
            <span className="flex-1" />
            <Button variant="ghost" onClick={() => void randomSecret().then(setInput)}>
              Random secret
            </Button>
          </div>
          <CodeEditor value={input} onChange={setInput} label="Tool input" testId="tool-input" placeholder="JBSWY3DPEHPK3PXP" className="!h-32 !min-h-0" />
        </section>
        <section className="flex min-w-0 flex-col gap-2">
          <div className="flex min-h-8 items-center gap-2">
            <PaneTitle>Result</PaneTitle>
            <span className="flex-1" />
            <CopyButton primary text={result?.code ?? ''} />
          </div>
          <ErrorBox error={error} />
          {rows.length > 0 && <KeyValueTable rows={rows} />}
          {result && qr && <img src={qr} alt="QR code of the otpauth link" width={192} height={192} className="rounded-lg border bg-white p-1" />}
        </section>
      </div>
    </div>
  );
}
