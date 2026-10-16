import { useMemo, useState } from 'react';
import type { ToolProps } from '@/core/types';
import { OptionsBar, Select, TextTransform } from '@/ui';
import { FONTS, renderBanner, type BannerFont, type Layout } from './logic';

export default function AsciiBanner({ initialInput }: ToolProps) {
  const [font, setFont] = useState<BannerFont>('Standard');
  const [layout, setLayout] = useState<Layout>('default');
  const modes = useMemo(() => [{ id: 'banner', label: 'Banner', run: (s: string) => renderBanner(s, font, layout), filename: 'banner.txt' }], [font, layout]);
  return (
    <TextTransform
      modes={modes}
      initialInput={initialInput}
      inputPlaceholder="Type a short text…"
      options={
        <OptionsBar>
          <Select label="Font" value={font} onChange={setFont} options={FONTS.map((f) => ({ value: f, label: f }))} />
          <Select
            label="Letter spacing"
            value={layout}
            onChange={setLayout}
            options={[
              { value: 'default', label: 'Font default' },
              { value: 'full', label: 'Full width' },
              { value: 'fitted', label: 'Fitted' },
              { value: 'controlled smushing', label: 'Smushed' },
              { value: 'universal smushing', label: 'Universal smush' },
            ]}
          />
        </OptionsBar>
      }
    />
  );
}
