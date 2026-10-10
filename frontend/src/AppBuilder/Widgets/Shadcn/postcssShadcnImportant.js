/**
 * PostCSS step for the shadcn/ui pack (experiment): marks the pack's Tailwind utilities `!important`.
 *
 * ToolJet loads Bootstrap/Tabler utility classes globally, and many of them share Tailwind's names with different
 * values and `!important` (`.py-5` is 3rem there, 1.25rem in Tailwind; also p-*, m-*, border, rounded, shadow-sm).
 * Scoping the pack's utilities to `.tj-shadcn` cannot beat `!important`, so the pack's own utilities take it too.
 * Only rules compiled from Widgets/Shadcn/shadcn.scss and scoped under `.tj-shadcn ` are touched; the token block
 * on `.tj-shadcn` itself and every other stylesheet are left as they are.
 */
const plugin = () => ({
  postcssPlugin: 'tj-shadcn-important',
  Rule(rule) {
    const file = rule.source?.input?.file || '';
    if (!file.includes('Widgets/Shadcn/shadcn.scss')) return;
    if (!rule.selectors?.some((selector) => selector.startsWith('.tj-shadcn '))) return;
    rule.walkDecls((decl) => {
      if (!decl.prop.startsWith('--')) decl.important = true;
    });
  },
});
plugin.postcss = true;

module.exports = plugin;
