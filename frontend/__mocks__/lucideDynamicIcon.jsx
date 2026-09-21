// Stand-in for `lucide-react/dynamic.mjs` (used by src/components/ui/Button).
//
// Why a stub instead of `esmPackages`: adding lucide-react to
// transformIgnorePatterns' allow-list costs ~38s on a cold jest cache — measured,
// and by far the most expensive single entry we tried. dynamic.mjs reaches
// dist/esm (7.5MB, ~1500 icon modules) while the same package already ships an
// equivalent CJS build (840KB) that jest never has to transform at all.
//
// So: resolve icons out of the CJS barrel, synchronously. The real DynamicIcon
// loads the icon node in a useEffect + dynamic import, which under RTL means an
// extra async tick and act() noise for something no test asserts on. Rendering
// immediately is strictly easier to test against and produces the same SVG.
const React = require('react');
// eslint-disable-next-line import/no-unresolved
const lucide = require('lucide-react/dist/cjs/lucide-react.js');

/** 'arrow-right' -> 'ArrowRight' — dynamic names are kebab, barrel keys are Pascal. */
const toPascalCase = (name) =>
  String(name || '')
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

const iconNames = Object.keys(lucide.icons || {});

const DynamicIcon = React.forwardRef(({ name, fallback: Fallback, ...props }, ref) => {
  const iconNode = (lucide.icons || {})[toPascalCase(name)];
  if (!iconNode) return Fallback ? React.createElement(Fallback) : null;
  // Tag the rendered icon so a test can assert on WHICH icon was requested.
  return React.createElement(lucide.Icon, { ref, ...props, 'data-lucide-name': name, iconNode });
});
DynamicIcon.displayName = 'DynamicIcon';

module.exports = { DynamicIcon, default: DynamicIcon, iconNames, dynamicIconImports: {} };
module.exports.__esModule = true;
