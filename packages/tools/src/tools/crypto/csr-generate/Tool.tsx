import { useCallback, useState } from 'react';
import { GeneratorTool, NumberInput, OptionsBar, Select, TextInput, useWorker } from '@/ui';
import type { CsrOptions, KeyType } from './logic';

export default function CsrGenerateTool() {
  const api = useWorker<typeof import('./worker').api>(() => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' }));
  const [mode, setMode] = useState<CsrOptions['mode']>('csr');
  const [keyType, setKeyType] = useState<KeyType>('ec-p256');
  const [commonName, setCommonName] = useState('www.example.com');
  const [organization, setOrganization] = useState('');
  const [unit, setUnit] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [locality, setLocality] = useState('');
  const [altNames, setAltNames] = useState('example.com, www.example.com');
  const [days, setDays] = useState(365);
  const generate = useCallback(
    () => api().generate({ mode, keyType, commonName, organization, unit, country, state, locality, altNames, days }),
    [api, mode, keyType, commonName, organization, unit, country, state, locality, altNames, days],
  );
  return (
    <GeneratorTool
      generate={generate}
      filename={mode === 'csr' ? 'request-and-key.pem' : 'certificate-and-key.pem'}
      options={
        <div className="flex flex-col gap-3">
          <OptionsBar>
            <Select label="Create" value={mode} onChange={setMode} options={[{ value: 'csr', label: 'Certificate signing request' }, { value: 'self-signed', label: 'Self-signed certificate' }]} />
            <Select
              label="Key"
              value={keyType}
              onChange={setKeyType}
              options={[
                { value: 'ec-p256', label: 'ECDSA P-256 (fast)' },
                { value: 'ec-p384', label: 'ECDSA P-384' },
                { value: 'rsa-2048', label: 'RSA 2048' },
                { value: 'rsa-3072', label: 'RSA 3072' },
              ]}
            />
            {mode === 'self-signed' && <NumberInput label="Valid for (days)" value={days} onChange={setDays} min={1} max={36500} />}
          </OptionsBar>
          <OptionsBar>
            <TextInput label="Common name (CN)" value={commonName} onChange={setCommonName} className="w-56" testId="csr-cn" />
            <TextInput label="Alt names (comma separated)" value={altNames} onChange={setAltNames} className="w-80" />
            <TextInput label="Organisation (O)" value={organization} onChange={setOrganization} className="w-44" />
            <TextInput label="Unit (OU)" value={unit} onChange={setUnit} className="w-36" />
            <TextInput label="Country (C)" value={country} onChange={setCountry} className="w-20" />
            <TextInput label="State (ST)" value={state} onChange={setState} className="w-36" />
            <TextInput label="City (L)" value={locality} onChange={setLocality} className="w-36" />
          </OptionsBar>
        </div>
      }
    />
  );
}
