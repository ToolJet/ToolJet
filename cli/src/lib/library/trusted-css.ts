import * as fs from 'fs';
import * as path from 'path';

/*
  Server mode's CSS pipeline: this CLI's own PostCSS, Tailwind and Autoprefixer with the app template's Tailwind config
  (src/_templates/library/code-app/tailwind.ejs.t; test/lib/trusted-css.test.ts keeps them the same). Nothing is
  resolved from the project: its node_modules can hold any package its package.json names, and require() runs it.
*/
const color = (token: string) => `color-mix(in srgb, var(--${token}) calc(<alpha-value> * 100%), transparent)`;

export const trustedTailwindConfig = (projectRoot: string) => ({
  darkMode: ['class'],
  content: { files: [path.join(projectRoot, 'src', '**', '*.{ts,tsx}')] },
  theme: {
    container: { center: true, padding: '1.5rem' },
    extend: {
      colors: {
        page: color('page'),
        border: color('border'),
        input: color('input'),
        ring: color('ring'),
        background: color('background'),
        foreground: color('foreground'),
        primary: { DEFAULT: color('primary'), foreground: color('primary-foreground') },
        secondary: { DEFAULT: color('secondary'), foreground: color('secondary-foreground') },
        destructive: { DEFAULT: color('destructive'), foreground: color('destructive-foreground') },
        muted: { DEFAULT: color('muted'), foreground: color('muted-foreground') },
        accent: { DEFAULT: color('accent'), foreground: color('accent-foreground') },
        popover: { DEFAULT: color('popover'), foreground: color('popover-foreground') },
        card: { DEFAULT: color('card'), foreground: color('card-foreground') },
        success: { DEFAULT: color('success'), foreground: color('success-foreground') },
        warning: { DEFAULT: color('warning'), foreground: color('warning-foreground') },
        chart: {
          1: color('chart-1'),
          2: color('chart-2'),
          3: color('chart-3'),
          4: color('chart-4'),
          5: color('chart-5'),
        },
      },
      borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)' },
      fontFamily: { sans: ['var(--font-sans)', 'system-ui', 'sans-serif'] },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  plugins: [require('tailwindcss-animate')],
});

/** @config and @plugin make Tailwind load JavaScript named by the stylesheet, and an @import can name a script. */
const CODE_IN_CSS: [RegExp, string][] = [
  [/@config\b/i, '@config'],
  [/@plugin\b/i, '@plugin'],
  [/@import\s+(?:url\()?\s*["']?[^"');\s]+\.(?:[cm]?js|[cm]?ts|jsx|tsx|json)\b/i, 'an @import of a script'],
];

/** Throws when a stylesheet asks the build to load code. */
export const assertNoCodeInCss = (css: string, file: string) => {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const [pattern, what] of CODE_IN_CSS) {
    if (pattern.test(source))
      throw new Error(`${path.basename(file)} uses ${what}, which this build does not allow: it would load code.`);
  }
};

const TEMPLATES = path.join(__dirname, '..', '..', '_templates', 'library', 'code-app');
const templateBody = (file: string) =>
  fs.readFileSync(path.join(TEMPLATES, file), 'utf8').replace(/^---[\s\S]*?---\n/, '');
const CONFIG_NAMES = ['postcss', 'tailwind'].flatMap((name) =>
  ['js', 'cjs', 'mjs', 'ts'].map((ext) => `${name}.config.${ext}`)
);

/** Project config this build ignores and that says something: a copy of the template's own changes nothing. */
export const ignoredConfigs = (projectRoot: string): string[] =>
  CONFIG_NAMES.filter((file) => {
    const full = path.join(projectRoot, file);
    if (!fs.existsSync(full)) return false;
    const template =
      file === 'postcss.config.cjs' ? 'postcss.ejs.t' : file === 'tailwind.config.cjs' ? 'tailwind.ejs.t' : undefined;
    return !template || fs.readFileSync(full, 'utf8') !== templateBody(template);
  });

export const trustedCssProcessor = (projectRoot: string) => {
  /* eslint-disable @typescript-eslint/no-var-requires */
  const postcss = require('postcss');
  const tailwindcss = require('tailwindcss');
  const autoprefixer = require('autoprefixer');
  /* eslint-enable @typescript-eslint/no-var-requires */
  // overrideBrowserslist: a project's browserslist can `extends` a package, which is loaded with require().
  return postcss([
    tailwindcss(trustedTailwindConfig(projectRoot)),
    autoprefixer({ overrideBrowserslist: ['defaults'] }),
  ]);
};
