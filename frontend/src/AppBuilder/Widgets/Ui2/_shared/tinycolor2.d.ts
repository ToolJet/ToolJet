// tinycolor2 ships no types and @types/tinycolor2 is not installed: the part of its API the pack's TypeScript uses.
declare module 'tinycolor2' {
  interface Hsl {
    h: number;
    s: number;
    l: number;
    a?: number;
  }
  interface Instance {
    isValid(): boolean;
    getLuminance(): number;
    toHsl(): Required<Hsl>;
    toHexString(): string;
  }
  function tinycolor(color?: string | Hsl): Instance;
  export default tinycolor;
}
