// jsdom ships no types and @types/jsdom is not installed; only a test uses it, and only `new JSDOM(html).window`.
declare module 'jsdom' {
  export class JSDOM {
    constructor(html?: string);
    readonly window: unknown;
  }
}
