import { AnsiUp } from 'ansi_up';

// CSI sequences (colours, cursor moves), OSC sequences (titles, hyperlinks) and two-character escapes.
const ESCAPES = /\u001b\[[0-9;?]*[ -/]*[@-~]|\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)|\u001b[@-Z\\-_]/g;
// What is left of a colour code when the ESC byte was lost on copy and paste, such as "[0;32m".
const BARE = /\[(?:\d{1,3}(?:;\d{1,3})*)?m/g;

export function stripAnsi(input: string, alsoBare = false): string {
  const s = input.replace(ESCAPES, '');
  return alsoBare ? s.replace(BARE, '') : s;
}

/** Convert ANSI colour and style codes to HTML. Text is HTML-escaped, so the result is safe to embed. */
export function ansiToHtml(input: string, wrapInPre: boolean): string {
  const ansi = new AnsiUp();
  ansi.use_classes = false;
  ansi.escape_html = true;
  const html = ansi.ansi_to_html(input.replace(/\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)/g, ''));
  return wrapInPre ? `<pre style="font-family: monospace; white-space: pre-wrap;">${html}</pre>` : html;
}
