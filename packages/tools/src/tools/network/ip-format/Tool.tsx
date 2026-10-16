import type { ToolProps } from '@/core/types';
import { DecoderTool } from '../../crypto/_lib/DecoderTool';
import { describeIp } from './logic';

export default function IpFormatTool({ initialInput }: ToolProps) {
  return <DecoderTool initialInput={initialInput} placeholder="192.168.1.1, 3232235777, 0xC0A80101, 2001:db8::1…" decode={(s) => describeIp(s)} />;
}
