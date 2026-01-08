/**
 * Dynamic Icon Loader for Tabler Icons
 *
 * This module provides dynamic loading of Tabler icons instead of importing all 5000+ icons upfront.
 *
 * Before: import * as Icons from '@tabler/icons-react' // Loads all icons (~14MB)
 * After:  const Icon = await loadIcon('IconHome2')      // Loads only specific icon (~10KB)
 *
 * Usage:
 *
 * // In React components:
 * const [IconComponent, setIconComponent] = useState(null);
 *
 * useEffect(() => {
 *   loadIcon(iconName).then(setIconComponent);
 * }, [iconName]);
 *
 * if (!IconComponent) return <Loader />;
 * return <IconComponent {...props} />;
 */

import React from 'react';

// Cache loaded icons to avoid reloading
const iconCache = new Map();

// Track loading promises to prevent duplicate requests
const loadingPromises = new Map();

/**
 * Dynamically load a Tabler icon by name
 * @param {string} iconName - The name of the icon (e.g., 'IconHome2', 'IconCheck')
 * @returns {Promise<React.Component>} The icon component
 */
export const loadIcon = async (iconName) => {
  // Return from cache if already loaded
  if (iconCache.has(iconName)) {
    return iconCache.get(iconName);
  }

  // Return existing promise if already loading
  if (loadingPromises.has(iconName)) {
    return loadingPromises.get(iconName);
  }

  // Create new loading promise
  const loadPromise = (async () => {
    try {
      // Try to load the icon dynamically
      // Webpack will create separate chunks for each icon
      const module = await import(
        /* webpackChunkName: "icon-[request]" */
        /* webpackMode: "lazy" */
        `@tabler/icons-react/dist/esm/icons/${iconName}.mjs`
      );

      const IconComponent = module.default;

      // Cache the loaded icon
      iconCache.set(iconName, IconComponent);
      loadingPromises.delete(iconName);

      return IconComponent;
    } catch (error) {
      console.warn(`[IconLoader] Failed to load icon: ${iconName}`, error);

      // Fallback to a default icon (IconAlertCircle is commonly available)
      try {
        const { IconAlertCircle } = await import('@tabler/icons-react');
        iconCache.set(iconName, IconAlertCircle);
        loadingPromises.delete(iconName);
        return IconAlertCircle;
      } catch (fallbackError) {
        console.error('[IconLoader] Failed to load fallback icon', fallbackError);
        loadingPromises.delete(iconName);
        // Return a simple div as last resort
        return () => <div style={{ width: 24, height: 24, display: 'inline-block' }} />;
      }
    }
  })();

  loadingPromises.set(iconName, loadPromise);
  return loadPromise;
};

/**
 * Preload commonly used icons
 * Call this on app initialization to preload icons that are used frequently
 * @param {string[]} iconNames - Array of icon names to preload
 * @returns {Promise<void>}
 */
export const preloadIcons = async (iconNames = []) => {
  const defaultIcons = [
    'IconHome2',
    'IconChevronDown',
    'IconChevronUp',
    'IconChevronLeft',
    'IconChevronRight',
    'IconX',
    'IconCheck',
    'IconPlus',
    'IconMinus',
    'IconEdit',
    'IconTrash',
    'IconSettings',
    'IconSearch',
    'IconFilter',
    'IconDownload',
    'IconUpload',
    'IconCopy',
    'IconExternalLink',
    'IconRefresh',
    'IconAlertCircle',
  ];

  const iconsToLoad = iconNames.length > 0 ? iconNames : defaultIcons;

  try {
    await Promise.all(iconsToLoad.map(iconName => loadIcon(iconName)));
    console.log(`[IconLoader] Preloaded ${iconsToLoad.length} icons`);
  } catch (error) {
    console.error('[IconLoader] Error preloading icons', error);
  }
};

/**
 * Clear the icon cache
 * Useful for testing or memory management
 */
export const clearIconCache = () => {
  iconCache.clear();
  loadingPromises.clear();
};

/**
 * Get cache statistics
 * @returns {object} Cache stats
 */
export const getCacheStats = () => {
  return {
    cachedIcons: iconCache.size,
    loadingIcons: loadingPromises.size,
    cacheKeys: Array.from(iconCache.keys()),
  };
};

/**
 * React Hook for loading icons
 * @param {string} iconName - The name of the icon to load
 * @returns {[React.Component|null, boolean, Error|null]} [IconComponent, isLoading, error]
 */
export const useIcon = (iconName) => {
  const [iconComponent, setIconComponent] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!iconName) {
      setIconComponent(null);
      setIsLoading(false);
      return;
    }

    let mounted = true;
    setIsLoading(true);
    setError(null);

    loadIcon(iconName)
      .then(IconComponent => {
        if (mounted) {
          setIconComponent(() => IconComponent);
          setIsLoading(false);
        }
      })
      .catch(err => {
        if (mounted) {
          setError(err);
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [iconName]);

  return [iconComponent, isLoading, error];
};

// Note: React import is added via webpack ProvidePlugin or needs to be imported where useIcon is used
