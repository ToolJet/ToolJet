import { FONT_STACKS, fontStack, typeClasses } from '../typeLook';
import { lookVars } from '../shadcnLook';

describe('fontStack', () => {
  it('leaves the theme font alone when unset or "theme"', () => {
    expect(fontStack(undefined)).toBe('');
    expect(fontStack('')).toBe('');
    expect(fontStack('theme')).toBe('');
  });

  it('maps the presets to stacks that need no download', () => {
    expect(fontStack('serif')).toBe(FONT_STACKS.serif);
    expect(fontStack('Mono')).toBe(FONT_STACKS.mono);
    expect(fontStack(' display ')).toBe(FONT_STACKS.display);
    expect(FONT_STACKS.serif).toMatch(/serif$/);
    expect(FONT_STACKS.mono).toMatch(/monospace$/);
  });

  it('keeps a named family, with a generic fallback', () => {
    expect(fontStack('Georgia')).toBe('Georgia, sans-serif');
    expect(fontStack("'Playfair Display', serif")).toBe("'Playfair Display', serif");
  });

  it('strips characters that could break out of the declaration', () => {
    expect(fontStack('Georgia; color: red')).toBe('Georgia color red, sans-serif');
    expect(fontStack('a}b{c')).toBe('abc, sans-serif');
    expect(fontStack('();')).toBe('');
  });

  it('never throws on junk', () => {
    [null, 42, NaN, {}, [], true].forEach((v) => expect(() => fontStack(v)).not.toThrow());
  });
});

describe('typeClasses', () => {
  it('adds a class only for the typeface styles the author set', () => {
    expect(typeClasses({})).toEqual([]);
    expect(typeClasses({ fontFamily: 'theme', fontWeight: '' })).toEqual([]);
    expect(typeClasses({ fontFamily: 'serif', letterSpacing: '0.12em', textTransform: 'uppercase' })).toEqual([
      'lk-font',
      'lk-tracking',
      'lk-case',
    ]);
    expect(typeClasses({ fontWeight: '600', fontSize: 11 })).toEqual(['lk-weight', 'lk-size']);
  });

  it('ignores a casing of "none" and unknown casings', () => {
    expect(typeClasses({ textTransform: 'none' })).toEqual([]);
    expect(typeClasses({ textTransform: 'shout' })).toEqual([]);
  });
});

describe('lookVars for typeface styles', () => {
  it('writes the CSS variables the classes read', () => {
    expect(
      lookVars('ShadHeading', { fontFamily: 'serif', fontWeight: 500, letterSpacing: 1, textTransform: 'uppercase' })
    ).toEqual({
      '--lk-font': FONT_STACKS.serif,
      '--lk-weight': '500',
      '--lk-tracking': '1px',
      '--lk-case': 'uppercase',
    });
    expect(lookVars('ShadText', { fontSize: '11', letterSpacing: '0.14em' })).toEqual({
      '--lk-size': '11px',
      '--lk-tracking': '0.14em',
    });
  });

  it('gives the Stat its own label and value typefaces', () => {
    expect(
      lookVars('ShadStat', { valueFontFamily: 'serif', labelTextTransform: 'uppercase', labelLetterSpacing: '0.1em' })
    ).toEqual({
      '--lk-value-font': FONT_STACKS.serif,
      '--lk-label-case': 'uppercase',
      '--lk-label-tracking': '0.1em',
    });
  });

  it('writes nothing for the theme font', () => {
    expect(lookVars('ShadHeading', { fontFamily: 'theme' })).toEqual({});
  });
});
