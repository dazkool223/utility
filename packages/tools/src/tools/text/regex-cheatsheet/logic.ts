export interface CheatEntry {
  token: string;
  meaning: string;
  example?: string;
}

export interface CheatSection {
  title: string;
  entries: CheatEntry[];
}

export const SECTIONS: CheatSection[] = [
  {
    title: 'Character classes',
    entries: [
      { token: '.', meaning: 'Any character except a line break (with the s flag, including line breaks)', example: 'a.c matches abc, a-c' },
      { token: '\\d  \\D', meaning: 'A digit 0-9 / anything that is not a digit', example: '\\d+ matches 2024' },
      { token: '\\w  \\W', meaning: 'A word character (letter, digit, underscore) / anything else', example: '\\w+ matches hello_1' },
      { token: '\\s  \\S', meaning: 'Whitespace (space, tab, line break) / non-whitespace' },
      { token: '[abc]', meaning: 'Any one of a, b or c', example: 'gr[ae]y matches gray, grey' },
      { token: '[^abc]', meaning: 'Any character except a, b or c' },
      { token: '[a-z]', meaning: 'Any character in the range a to z', example: '[A-Za-z0-9] matches one letter or digit' },
      { token: '\\p{L}  \\p{Lu}  \\p{N}', meaning: 'Unicode letter / uppercase letter / number (needs the u flag)', example: '\\p{L}+ matches héllo' },
      { token: '\\p{Emoji}', meaning: 'Emoji characters (needs the u flag)' },
    ],
  },
  {
    title: 'Anchors and boundaries',
    entries: [
      { token: '^  $', meaning: 'Start / end of the text (of each line with the m flag)', example: '^\\d+$ matches a whole number' },
      { token: '\\b  \\B', meaning: 'A word boundary / not a word boundary', example: '\\bcat\\b matches cat, not concat' },
    ],
  },
  {
    title: 'Quantifiers',
    entries: [
      { token: '*', meaning: 'Zero or more', example: 'ab*c matches ac, abc, abbc' },
      { token: '+', meaning: 'One or more', example: 'ab+c matches abc, abbc' },
      { token: '?', meaning: 'Zero or one (optional)', example: 'colou?r matches color, colour' },
      { token: '{n}  {n,}  {n,m}', meaning: 'Exactly n / at least n / between n and m times', example: '\\d{3,5} matches 123, 12345' },
      { token: '*?  +?  ??  {n,m}?', meaning: 'Lazy versions: match as little as possible', example: '<.+?> matches one tag at a time' },
    ],
  },
  {
    title: 'Groups and references',
    entries: [
      { token: '(abc)', meaning: 'Capturing group, available as $1, $2 in replacements', example: '(\\d+)-(\\d+) captures both numbers' },
      { token: '(?:abc)', meaning: 'Non-capturing group' },
      { token: '(?<name>abc)', meaning: 'Named capturing group, available as $<name>', example: '(?<year>\\d{4}) -> $<year>' },
      { token: '\\1  \\k<name>', meaning: 'Match the same text as an earlier group', example: '(\\w)\\1 matches aa, bb' },
      { token: 'a|b', meaning: 'Alternation: a or b', example: 'cat|dog' },
    ],
  },
  {
    title: 'Lookaround',
    entries: [
      { token: '(?=abc)', meaning: 'Lookahead: followed by abc (not consumed)', example: '\\d+(?= dollars)' },
      { token: '(?!abc)', meaning: 'Negative lookahead: not followed by abc' },
      { token: '(?<=abc)', meaning: 'Lookbehind: preceded by abc', example: '(?<=\\$)\\d+ matches 5 in $5' },
      { token: '(?<!abc)', meaning: 'Negative lookbehind: not preceded by abc' },
    ],
  },
  {
    title: 'Escapes',
    entries: [
      { token: '\\n  \\r  \\t', meaning: 'Line feed, carriage return, tab' },
      { token: '\\.  \\*  \\+  \\?  \\(  \\[  \\{  \\\\  \\/', meaning: 'A literal special character' },
      { token: '\\xHH  \\uHHHH  \\u{H}', meaning: 'A character by code (\\u{...} needs the u flag)', example: '\\u00e9 matches é' },
    ],
  },
  {
    title: 'Flags',
    entries: [
      { token: 'g', meaning: 'Global: find every match, not just the first' },
      { token: 'i', meaning: 'Ignore case' },
      { token: 'm', meaning: 'Multiline: ^ and $ match at each line' },
      { token: 's', meaning: 'Dot also matches line breaks' },
      { token: 'u', meaning: 'Unicode: treat the pattern as code points, enables \\p{...}' },
      { token: 'y', meaning: 'Sticky: match only at the current position' },
      { token: 'd', meaning: 'Also report the start and end index of each group' },
    ],
  },
  {
    title: 'Replacement patterns',
    entries: [
      { token: '$1  $2', meaning: 'Text matched by group 1, 2…' },
      { token: '$<name>', meaning: 'Text matched by a named group' },
      { token: '$&', meaning: 'The whole match' },
      { token: '$`  $\'', meaning: 'The text before / after the match' },
      { token: '$$', meaning: 'A literal dollar sign' },
    ],
  },
  {
    title: 'Common patterns',
    entries: [
      { token: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$', meaning: 'A simple email address check' },
      { token: '^https?://[^\\s/$.?#].[^\\s]*$', meaning: 'A web URL' },
      { token: '^\\d{4}-\\d{2}-\\d{2}$', meaning: 'A date like 2024-05-31' },
      { token: '^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$', meaning: 'A hex colour' },
      { token: '^(?:\\d{1,3}\\.){3}\\d{1,3}$', meaning: 'An IPv4 address (does not check the 0-255 range)' },
      { token: '\\s+$', meaning: 'Trailing whitespace' },
    ],
  },
];

/** Keep only entries matching every word of the query (in the token, meaning or example). */
export function filterSections(query: string, sections: CheatSection[] = SECTIONS): CheatSection[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return sections;
  return sections
    .map((s) => ({
      title: s.title,
      entries: s.entries.filter((e) => {
        const hay = `${s.title} ${e.token} ${e.meaning} ${e.example ?? ''}`.toLowerCase();
        return words.every((w) => hay.includes(w));
      }),
    }))
    .filter((s) => s.entries.length > 0);
}
