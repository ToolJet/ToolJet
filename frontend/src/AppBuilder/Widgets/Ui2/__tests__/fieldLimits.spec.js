import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * An inspector field and its widget must agree on limits. The OTP placeholder used only its first character and a
 * File upload took at most 100 files while the inspector took anything, so a user typed values the widget silently
 * cut (round 6). Both directions are checked here, from the widget sources and the configs:
 *  - every cap a widget puts on a property (a clamp with literal bounds, a model helper that clamps, a `.slice(0, n)`
 *    of the text) is declared on that field in the config (minValue/maxValue, or maxLength), so the inspector flags a
 *    value past it;
 *  - every limit a config declares is one the widget's code applies;
 *  - every choice a select or switch field offers is a value the pack's code reads.
 */
import fs from 'fs';
import path from 'path';
import { CONFIGS } from './packWidgets';
import { limitCheck } from '@/AppBuilder/RightSideBar/Inspector/Elements/maxValueCheck';

const UI2 = path.join(__dirname, '..');
const sources = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' || e.name === '__contracts__' ? [] : sources(p);
    return /\.tsx?$/.test(e.name) ? [p] : [];
  });
const FILES = sources(UI2).map((file) => ({ file, src: fs.readFileSync(file, 'utf8') }));
const typeOf = (file) => `Shad${path.relative(UI2, file).split(path.sep)[0]}`;

const NUM = '(-?\\d+(?:\\.\\d+)?)';
const PROP = '(?:props\\.properties|properties|p)\\.([a-zA-Z]+)';
const CLAMPS = [
  // clamp(p.x, lo, hi, fallback), clampCoerce, clampUnwrapped, M.clampInt
  new RegExp(
    `\\b(?:\\w+\\.)?clamp(?:Coerce|Unwrapped|Int|Number)?\\(\\s*(?:Number\\()?${PROP}\\)?\\s*,\\s*${NUM}\\s*,\\s*${NUM}`,
    'g'
  ),
  // Math.max(lo, Math.min(hi, ...p.x...))
  new RegExp(`Math\\.max\\(\\s*${NUM}\\s*,\\s*Math\\.min\\(\\s*${NUM}\\s*,[^;]*?${PROP}`, 'g'),
  // Math.min(hi, Math.max(lo, ...p.x...))
  new RegExp(`Math\\.min\\(\\s*${NUM}\\s*,\\s*Math\\.max\\(\\s*${NUM}\\s*,[^;]*?${PROP}`, 'g'),
];
// Model helpers that clamp one of their parameters with literal bounds: `export const clampFiles = (v: unknown): number =>
// clampInt(v, 1, 100,` or `... Math.max(1, Math.min(10, n))` (the first parameter), and `currencyDecimals = (currency:
// unknown, decimalPlaces: unknown) => ... clampInt(decimalPlaces, 0, 10, 2)` (another one): { name: { index, min, max } }.
const HELPERS = Object.fromEntries(
  FILES.flatMap(({ src }) =>
    [...src.matchAll(/export const (\w+) = \(([^)]*)\)[^=]*=>\s*\{?([\s\S]*?)\n(?:\};|export|\/\*\*|\n)/g)].flatMap(
      ([, name, params, body]) => {
        const names = params.split(',').map((param) => param.split(':')[0].trim());
        const clamped = body.match(new RegExp(`clampInt\\((\\w+),\\s*${NUM},\\s*${NUM}`));
        if (clamped && names.includes(clamped[1])) {
          return [[name, { index: names.indexOf(clamped[1]), min: Number(clamped[2]), max: Number(clamped[3]) }]];
        }
        const minMax = names.length === 1 && body.match(new RegExp(`Math\\.max\\(${NUM},\\s*Math\\.min\\(${NUM},`));
        return minMax ? [[name, { index: 0, min: Number(minMax[1]), max: Number(minMax[2]) }]] : [];
      }
    )
  )
);

/** [type, key, { min, max } | { maxLength }, where] for every cap a widget's code puts on one of its properties. */
const caps = () => {
  const out = [];
  for (const { file, src } of FILES) {
    const type = typeOf(file);
    if (!CONFIGS[type]) continue;
    const where = path.relative(UI2, file);
    CLAMPS.forEach((re, i) => {
      for (const m of src.matchAll(re)) {
        const [a, b, c] = m.slice(1);
        const [key, lo, hi] = i === 0 ? [a, b, c] : i === 1 ? [c, a, b] : [c, b, a];
        out.push([type, key, { min: Number(lo), max: Number(hi) }, where]);
      }
    });
    // A helper call with a property in the place the helper clamps (`M.currencyDecimals(code, properties.decimalPlaces)`).
    for (const [, helper, args] of src.matchAll(/\b(?:\w+\.)?(\w+)\(([^()]*)\)/g)) {
      const h = HELPERS[helper];
      if (!h) continue;
      const arg = args.split(',')[h.index]?.trim() ?? '';
      const prop = arg.match(new RegExp(`^${PROP}$`));
      if (prop) out.push([type, prop[1], { min: h.min, max: h.max }, where]);
    }
    for (const [, key, n] of src.matchAll(new RegExp(`toText\\(${PROP}\\)\\.slice\\(0,\\s*(\\d+)\\)`, 'g'))) {
      out.push([type, key, { maxLength: Number(n) }, where]);
    }
  }
  return out;
};
const CAPS = caps();
const metaOf = (type, key) => CONFIGS[type].properties?.[key] || CONFIGS[type].styles?.[key];

describe('[UI2-FIELD-LIMITS] inspector fields and widgets agree on limits', () => {
  it('finds the caps the widgets apply', () => {
    expect(CAPS.map(([type, key]) => `${type}.${key}`)).toEqual(
      expect.arrayContaining([
        'ShadOtpInput.placeholder',
        'ShadFileUpload.maxFiles',
        'ShadRating.max',
        'ShadCurrencyInput.decimalPlaces',
      ])
    );
  });

  it.each(CAPS)('%s.%s: the config declares the cap %j the widget applies (%s)', (type, key, cap) => {
    const meta = metaOf(type, key);
    expect(meta).toBeDefined();
    if ('maxLength' in cap) expect(meta.maxLength).toBe(cap.maxLength);
    else expect({ min: meta.minValue, max: meta.maxValue }).toEqual(cap);
  });

  it('the inspector flags a number outside a declared range, saying what the widget takes', () => {
    const check = limitCheck({ minValue: 0.5, maxValue: 12 });
    expect(check('20')).toEqual([false, '0.5 to 12; a larger number is taken as 12.']);
    expect(check('0')).toEqual([false, '0.5 to 12; a smaller number is taken as 0.5.']);
    expect(check('2')).toEqual([true, null]);
    expect(check('{{x}}')).toEqual([true, null]);
    expect(limitCheck({})).toBeUndefined();
  });

  const DECLARED = Object.entries(CONFIGS).flatMap(([type, c]) =>
    ['properties', 'styles'].flatMap((section) =>
      Object.entries(c[section] || {})
        .filter(([, meta]) => meta && ['minValue', 'maxValue', 'maxLength'].some((k) => k in meta))
        .map(([key]) => [type, key])
    )
  );
  it.each(DECLARED)('%s.%s: the widget applies the limit its config declares', (type, key) => {
    expect(CAPS.filter(([t, k]) => t === type && k === key)).not.toHaveLength(0);
  });

  // The app builder's code, without the widget configs (a tooltip's format is read by ToolJet's own wrapper): where a
  // choice's value must be read for the choice to do anything. The field's default needs no reading: it is what the
  // code does when no other choice matches.
  const APP_BUILDER = path.join(UI2, '../..');
  const builderSources = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) return ['__tests__', 'node_modules', 'widgets'].includes(e.name) ? [] : builderSources(p);
      return /\.(jsx?|tsx?)$/.test(e.name) ? [p] : [];
    });
  const CODE = builderSources(APP_BUILDER)
    .map((file) => fs.readFileSync(file, 'utf8'))
    .join('\n');
  const defaultOf = (type, key) => {
    const raw = CONFIGS[type].definition?.properties?.[key]?.value ?? CONFIGS[type].definition?.styles?.[key]?.value;
    return String(raw ?? '').replace(/^\{\{\s*['"`]?|['"`]?\s*\}\}$/g, '');
  };
  const CHOICES = Object.entries(CONFIGS).flatMap(([type, c]) =>
    ['properties', 'styles'].flatMap((section) =>
      Object.entries(c[section] || {})
        .filter(([, meta]) => ['select', 'switch'].includes(meta?.type) && Array.isArray(meta.options))
        .flatMap(([key, meta]) => meta.options.map((o) => [type, key, o.value]))
    )
  );
  // Choices handed on as they are, read by the browser or a library rather than by name.
  const PASSED_ON = {
    'ShadDialog.size': "react-bootstrap's Modal size (the modal-xl class)",
    'ShadDialog.triggerButtonFontWeight': 'a CSS font-weight keyword on the trigger',
  };
  it.each(CHOICES)('%s.%s offers %j, which the pack reads', (type, key, value) => {
    if (typeof value !== 'string' || value === defaultOf(type, key)) return; // used as they are, or the fallback
    if (/^\d+$/.test(value) || PASSED_ON[`${type}.${key}`]) return; // a CSS weight (typeLook.fontWeight), or handed on
    const esc = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const read =
      new RegExp(`['"\`]${esc}['"\`]`).test(CODE) || // compared or switched on
      new RegExp(`[{,\\s]${esc}\\s*:`).test(CODE) || // a key of a lookup table
      (/[^\w]/.test(value) && CODE.includes(value)); // part of a longer value (a MIME type)
    expect(read).toBe(true);
  });
});
