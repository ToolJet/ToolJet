/**
 * The UI 2.0 widgets' Tailwind theme keys, merged into ToolJet's Tailwind config (tailwind.config.js). Everything is
 * under a `ui2` name, so no class the builder uses changes:
 * - colours (`tw-bg-ui2-primary`, `tw-border-ui2-input`, `tw-bg-ui2-chart-1`): shadcn's token names, read from the
 *   `--sc-*` variables a widget's root sets from the app theme (shadcn.scss), mixed with color-mix() so opacity
 *   modifiers such as `tw-bg-ui2-primary/90` keep working;
 * - radius (`tw-rounded-ui2-md`): the app theme's radius scale;
 * - text sizes (`tw-text-ui2-sm`): Tailwind's own scale, which ToolJet's config redefines for the builder (11px `sm`).
 */
const token =
  (name) =>
  ({ opacityValue }) =>
    opacityValue === undefined || Number(opacityValue) === 1
      ? `var(--sc-${name})`
      : `color-mix(in srgb, var(--sc-${name}) calc(${opacityValue} * 100%), transparent)`;

const pair = (name) => ({ DEFAULT: token(name), foreground: token(`${name}-foreground`) });

module.exports = {
  colors: {
    ui2: {
      border: token('border'),
      input: token('input'),
      ring: token('ring'),
      background: token('background'),
      foreground: token('foreground'),
      primary: pair('primary'),
      secondary: pair('secondary'),
      destructive: pair('destructive'),
      success: pair('success'),
      warning: pair('warning'),
      muted: pair('muted'),
      accent: pair('accent'),
      popover: pair('popover'),
      card: pair('card'),
      chart: {
        1: token('chart-1'),
        2: token('chart-2'),
        3: token('chart-3'),
        4: token('chart-4'),
        5: token('chart-5'),
      },
    },
  },
  // Text in the primary colour uses its ink: the primary darkened (or, in a dark theme, lightened) just enough to read
  // on the background, so a light brand primary (a bright green, a gold) still gives readable links.
  textColor: {
    ui2: { primary: { DEFAULT: token('primary-ink'), foreground: token('primary-foreground') } },
  },
  borderRadius: {
    'ui2-sm': 'calc(var(--sc-radius) - 4px)',
    'ui2-md': 'calc(var(--sc-radius) - 2px)',
    'ui2-lg': 'var(--sc-radius)',
    'ui2-xl': 'calc(var(--sc-radius) + 4px)',
  },
  fontSize: {
    'ui2-sm': ['0.875rem', { lineHeight: '1.25rem' }],
    'ui2-base': ['1rem', { lineHeight: '1.5rem' }],
    'ui2-lg': ['1.125rem', { lineHeight: '1.75rem' }],
    'ui2-xl': ['1.25rem', { lineHeight: '1.75rem' }],
  },
  keyframes: {
    'ui2-accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
    'ui2-accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
  },
  animation: {
    'ui2-accordion-down': 'ui2-accordion-down 0.2s ease-out',
    'ui2-accordion-up': 'ui2-accordion-up 0.2s ease-out',
  },
};
