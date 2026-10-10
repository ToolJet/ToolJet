/**
 * Tailwind for the shadcn/ui pack (experiment, exp/antd-pack). Compiled only into Widgets/Shadcn/shadcn.scss
 * (`@config`), separate from ToolJet's own Tailwind (prefix `tw-`, no preflight), so the pack's components keep
 * shadcn's unprefixed classes unchanged:
 * - `important: '.tj-shadcn'` scopes every utility to a pack widget (or the pack's portal root), so nothing applies
 *   to the editor or other widgets;
 * - colours are shadcn's token names, read from CSS variables the pack sets from the app theme (see shadcn.scss),
 *   mixed with color-mix() so opacity modifiers such as bg-primary/90 keep working.
 */
const token =
  (name) =>
  ({ opacityValue }) =>
    opacityValue === undefined || Number(opacityValue) === 1
      ? `var(--sc-${name})`
      : `color-mix(in srgb, var(--sc-${name}) calc(${opacityValue} * 100%), transparent)`;

module.exports = {
  content: ['./src/AppBuilder/Widgets/Shadcn/**/*.{js,jsx}'],
  important: '.tj-shadcn',
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        border: token('border'),
        input: token('input'),
        ring: token('ring'),
        background: token('background'),
        foreground: token('foreground'),
        primary: { DEFAULT: token('primary'), foreground: token('primary-foreground') },
        secondary: { DEFAULT: token('secondary'), foreground: token('secondary-foreground') },
        destructive: { DEFAULT: token('destructive'), foreground: token('destructive-foreground') },
        success: { DEFAULT: token('success'), foreground: token('success-foreground') },
        warning: { DEFAULT: token('warning'), foreground: token('warning-foreground') },
        muted: { DEFAULT: token('muted'), foreground: token('muted-foreground') },
        accent: { DEFAULT: token('accent'), foreground: token('accent-foreground') },
        popover: { DEFAULT: token('popover'), foreground: token('popover-foreground') },
        card: { DEFAULT: token('card'), foreground: token('card-foreground') },
        chart: {
          1: token('chart-1'),
          2: token('chart-2'),
          3: token('chart-3'),
          4: token('chart-4'),
          5: token('chart-5'),
        },
      },
      borderRadius: {
        lg: 'var(--sc-radius)',
        md: 'calc(var(--sc-radius) - 2px)',
        sm: 'calc(var(--sc-radius) - 4px)',
        xl: 'calc(var(--sc-radius) + 4px)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
