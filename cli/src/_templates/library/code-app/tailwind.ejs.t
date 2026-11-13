---
to: <%= name %>/tailwind.config.cjs
---
// The theme tokens are whole CSS colours (styles/theme.css maps them to the ToolJet theme's --tj-* variables), so a
// utility reads var(--primary) as is, and an opacity modifier (bg-primary/10) mixes it with transparent.
const color = (token) => `color-mix(in srgb, var(--${token}) calc(<alpha-value> * 100%), transparent)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  // The component renders inside ToolJet's shadow root, so dark mode and the theme variables hang off the app root
  // element, not <html>.
  darkMode: ['class'],
  // Relative to this file, so the build finds the sources from any working directory.
  content: { relative: true, files: ['./src/**/*.{ts,tsx}'] },
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
        chart: { 1: color('chart-1'), 2: color('chart-2'), 3: color('chart-3'), 4: color('chart-4'), 5: color('chart-5') },
      },
      borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)' },
      fontFamily: { sans: ['var(--font-sans)', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
