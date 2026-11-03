---
to: <%= name %>/src/styles/globals.css
---
@tailwind base;
@tailwind components;
@tailwind utilities;

/*
  shadcn theme, mapped to ToolJet's theme tokens. The component lives in a shadow root, so the variables are set on
  the app root (not :root). Where the host hands over a --tj-* token (the app has a theme), it wins; otherwise the
  stock neutral palette after it applies, so the app looks right in a plain workspace and follows the app theme when
  one is set. Values are whole CSS colours: tailwind.config reads var(--primary) directly.
*/
@layer base {
  .app-root {
    --font-sans: var(--tj-font, 'Inter', ui-sans-serif, system-ui, sans-serif);
    --page: var(--tj-page, #f8f9fa);
    --background: var(--tj-surface, #ffffff);
    --foreground: var(--tj-text, #030712);
    --card: var(--tj-surface, #ffffff);
    --card-foreground: var(--tj-text, #030712);
    --popover: var(--tj-surface, #ffffff);
    --popover-foreground: var(--tj-text, #030712);
    --primary: var(--tj-brand, #4368e3);
    --primary-foreground: var(--tj-on-brand, #ffffff);
    --secondary: var(--tj-surface-alt, #f3f4f6);
    --secondary-foreground: var(--tj-text, #111827);
    --muted: var(--tj-surface-alt, #f3f4f6);
    --muted-foreground: var(--tj-text-muted, #6b7280);
    --accent: var(--tj-surface-alt, #f3f4f6);
    --accent-foreground: var(--tj-text, #111827);
    --destructive: var(--tj-danger, #dc2626);
    --destructive-foreground: #ffffff;
    --success: var(--tj-success, #15803d);
    --success-foreground: #ffffff;
    --warning: var(--tj-warning, #d97706);
    --warning-foreground: #ffffff;
    --border: var(--tj-border-weak, #e5e7eb);
    --input: var(--tj-border, #e5e7eb);
    --ring: var(--tj-brand, #4368e3);
    --chart-1: var(--tj-brand, #2563eb);
    --chart-2: var(--tj-warning, #d97706);
    --chart-3: var(--tj-success, #15803d);
    --chart-4: var(--tj-danger, #dc2626);
    --chart-5: #7c3aed;
    --radius: var(--tj-radius, 0.5rem);
  }
  .app-root.dark {
    --page: var(--tj-page, #020617);
    --background: var(--tj-surface, #030712);
    --foreground: var(--tj-text, #f9fafb);
    --card: var(--tj-surface, #030712);
    --card-foreground: var(--tj-text, #f9fafb);
    --popover: var(--tj-surface, #030712);
    --popover-foreground: var(--tj-text, #f9fafb);
    --primary: var(--tj-brand, #4368e3);
    --primary-foreground: var(--tj-on-brand, #ffffff);
    --secondary: var(--tj-surface-alt, #1f2937);
    --secondary-foreground: var(--tj-text, #f9fafb);
    --muted: var(--tj-surface-alt, #1f2937);
    --muted-foreground: var(--tj-text-muted, #9ca3af);
    --accent: var(--tj-surface-alt, #1f2937);
    --accent-foreground: var(--tj-text, #f9fafb);
    --destructive: var(--tj-danger, #7f1d1d);
    --border: var(--tj-border-weak, #1f2937);
    --input: var(--tj-border, #1f2937);
    --ring: var(--tj-brand, #4368e3);
  }
  .app-root {
    @apply bg-background text-foreground font-sans text-sm antialiased;
    font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
  }
  .app-root * {
    @apply border-border;
  }
}

/* Radix portals land in the host's popup layer, which shares this stylesheet; the layer needs the same variables. */
.app-popups {
  @apply font-sans text-sm text-foreground;
}

/* Reduced motion, on by default: tailwindcss-animate and every transition stop for people who ask their system for less. */
@media (prefers-reduced-motion: reduce) {
  *,
  ::before,
  ::after {
    animation-duration: 0.01ms !important;
    animation-delay: 0ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    transition-delay: 0ms !important;
    scroll-behavior: auto !important;
  }
}
