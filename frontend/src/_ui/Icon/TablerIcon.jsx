import React, { useState, useEffect, memo, useMemo } from 'react';

// Cache for loaded icons to avoid re-importing
const iconCache = new Map();

// Inject keyframes for fade-in animation once
const ANIMATION_NAME = 'tablerIconFadeIn';
if (typeof document !== 'undefined' && !document.getElementById('tabler-icon-styles')) {
  const style = document.createElement('style');
  style.id = 'tabler-icon-styles';
  style.textContent = `@keyframes ${ANIMATION_NAME} { from { opacity: 0; } to { opacity: 1; } }`;
  document.head.appendChild(style);
}

// Promise cache to avoid multiple imports
let importPromise = null;

/**
 * Dynamically loads and renders a Tabler icon only when needed.
 * This prevents the entire @tabler/icons-react library (~2MB) from being bundled.
 *
 * @param {string} iconName - The name of the icon (e.g., 'IconHome2', 'IconFile')
 * @param {string} fallbackIcon - Fallback icon name if the requested icon is not found
 * @param {object} props - Props to pass to the icon component (style, stroke, etc.)
 */
const TablerIcon = memo(({ iconName, fallbackIcon = 'IconHome2', ...props }) => {
  const [IconComponent, setIconComponent] = useState(() => iconCache.get(iconName) || null);

  useEffect(() => {
    if (!iconName) return;

    // If already cached, use it immediately
    if (iconCache.has(iconName)) {
      setIconComponent(() => iconCache.get(iconName));
      return;
    }

    let mounted = true;

    // Reuse the same import promise to avoid multiple imports
    if (!importPromise) {
      importPromise = import('@tabler/icons-react');
    }

    importPromise
      .then((module) => {
        if (!mounted) return;

        const Icon = module[iconName] || module[fallbackIcon];
        if (Icon) {
          iconCache.set(iconName, Icon);
          // Also cache fallback if it was used
          if (!module[iconName] && module[fallbackIcon]) {
            iconCache.set(fallbackIcon, module[fallbackIcon]);
          }
          setIconComponent(() => Icon);
        }
      })
      .catch((err) => {
        console.warn(`Failed to load tabler icon: ${iconName}`, err);
      });

    return () => {
      mounted = false;
    };
  }, [iconName, fallbackIcon]);

  // Extract dimensions from props for placeholder sizing
  const width = props.style?.width || props.width || 16;
  const height = props.style?.height || props.height || 16;

  // Memoize icon style - must be called before any conditional returns (Rules of Hooks)
  const iconStyle = useMemo(
    () => ({
      ...props.style,
      animation: `${ANIMATION_NAME} 0.15s ease-in`,
    }),
    [props.style]
  );

  // Return placeholder while loading to prevent layout shift
  if (!IconComponent) {
    return (
      <span
        style={{
          display: 'inline-block',
          width,
          height,
        }}
      />
    );
  }

  return <IconComponent {...props} style={iconStyle} />;
});

TablerIcon.displayName = 'TablerIcon';

export default TablerIcon;
