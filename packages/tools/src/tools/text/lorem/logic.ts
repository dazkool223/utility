import { randomInt } from '../_lib/random';

export type LoremUnit = 'paragraphs' | 'sentences' | 'words';

export interface LoremOptions {
  unit: LoremUnit;
  count: number;
  startWithLorem: boolean;
  html: boolean;
}

export const MAX_COUNT: Record<LoremUnit, number> = { paragraphs: 500, sentences: 5000, words: 100_000 };

const OPENING = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit'];

const WORDS = (
  'a ad adipisci aliquam aliquid amet animi aperiam architecto asperiores aspernatur assumenda at atque aut autem beatae blanditiis ' +
  'commodi consectetur consequatur consequuntur corporis corrupti culpa cum cumque cupiditate debitis delectus deleniti deserunt dicta ' +
  'dignissimos distinctio dolor dolore dolorem doloremque dolores doloribus dolorum ducimus ea eaque earum eius eligendi enim eos error ' +
  'esse est et eum eveniet ex excepturi exercitationem expedita explicabo facere facilis fuga fugiat fugit harum hic id illo illum impedit ' +
  'in incidunt inventore ipsa ipsam ipsum iste itaque iure iusto labore laboriosam laborum laudantium libero magnam magni maiores maxime ' +
  'minima minus modi molestiae molestias mollitia nam natus necessitatibus nemo neque nesciunt nihil nisi nobis non nostrum nulla numquam ' +
  'obcaecati odio odit officia officiis omnis optio pariatur perferendis perspiciatis placeat porro possimus praesentium provident quae ' +
  'quaerat quam quas quasi qui quia quibusdam quidem quis quisquam quo quod quos ratione recusandae reiciendis rem repellat repellendus ' +
  'reprehenderit repudiandae rerum saepe sapiente sed sequi similique sint sit soluta sunt suscipit tempora tempore temporibus tenetur ' +
  'totam ullam unde ut vel velit veniam veritatis vero vitae voluptas voluptate voluptatem voluptates voluptatibus voluptatum'
).split(' ');

type Rand = (max: number) => number;

function sentence(rand: Rand, opening: boolean): string {
  const n = 8 + rand(9);
  const words: string[] = opening ? [...OPENING] : [];
  while (words.length < n) words.push(WORDS[rand(WORDS.length)]!);
  // One comma in longer sentences, never after the first or last word.
  if (opening) words[4] = 'amet,';
  else if (words.length > 9 && rand(2) === 0) {
    const at = 3 + rand(words.length - 5);
    words[at] = words[at] + ',';
  }
  const text = words.join(' ');
  return text.charAt(0).toUpperCase() + text.slice(1) + '.';
}

function paragraph(rand: Rand, opening: boolean): string {
  const n = 3 + rand(4);
  return Array.from({ length: n }, (_, i) => sentence(rand, opening && i === 0)).join(' ');
}

export function generateLorem(o: LoremOptions, rand: Rand = randomInt): string {
  const count = Math.max(1, Math.min(MAX_COUNT[o.unit], Math.floor(o.count) || 1));
  if (o.unit === 'words') {
    const words: string[] = o.startWithLorem ? OPENING.slice(0, count) : [];
    while (words.length < count) words.push(WORDS[rand(WORDS.length)]!);
    return words.join(' ');
  }
  if (o.unit === 'sentences') {
    const list = Array.from({ length: count }, (_, i) => sentence(rand, o.startWithLorem && i === 0));
    return o.html ? list.map((s) => `<p>${s}</p>`).join('\n') : list.join(' ');
  }
  const list = Array.from({ length: count }, (_, i) => paragraph(rand, o.startWithLorem && i === 0));
  return o.html ? list.map((p) => `<p>${p}</p>`).join('\n') : list.join('\n\n');
}
