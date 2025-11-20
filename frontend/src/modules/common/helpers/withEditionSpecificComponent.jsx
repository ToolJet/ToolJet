import React, { Suspense, lazy, useMemo } from 'react';
import config from 'config';
import { fetchEdition } from './utils';

/**
 * HOC that wraps a component to provide edition-specific functionality.
 * Uses dynamic imports to load only the specific component file needed,
 * avoiding bundling entire edition modules.
 *
 * @param {React.Component} BaseComponent - The CE (community edition) component
 * @param {string} moduleName - The module name (e.g., 'Appbuilder', 'Dashboard')
 * @param {Object} options - Configuration options
 * @param {React.Component} options.fallback - Optional loading fallback component
 * @returns {React.Component} - Edition-specific component wrapper
 */
export function withEditionSpecificComponent(BaseComponent, moduleName, options = {}) {
  const componentName = BaseComponent.name;
  const { fallback = null } = options;

  return function EditionSpecificComponent(props) {
    let edition = fetchEdition(config);
    if (edition === 'cloud') {
      edition = 'ee'; // Treat cloud as enterprise edition for component loading
    }

    // For CE, always return base component immediately
    if (edition === 'ce') {
      return <BaseComponent {...props} />;
    }

    // Dynamically import only the specific component needed
    // This creates a separate chunk that's loaded on-demand
    const LazyEditionComponent = useMemo(() => {
      const editionPath = edition === 'ee' ? '@ee' : '@cloud';

      return lazy(() =>
        import(
          /* webpackChunkName: "[request]" */
          /* webpackMode: "lazy" */
          `${editionPath}/modules/${moduleName}/components/${componentName}`
        )
          .then((module) => {
            // Handle both default and named exports
            const Component = module.default || module[componentName];
            if (!Component) {
              console.warn(
                `Component ${componentName} not found in ${moduleName} for ${edition} edition. Using base component.`
              );
              return { default: BaseComponent };
            }
            return { default: Component };
          })
          .catch((error) => {
            // If the edition-specific component doesn't exist, fall back to base
            console.warn(
              `Failed to load edition component ${componentName} from ${moduleName}:`,
              error.message,
              'Using base component.'
            );
            return { default: BaseComponent };
          })
      );
    }, [edition]);

    return (
      <Suspense fallback={fallback}>
        <LazyEditionComponent {...props} />
      </Suspense>
    );
  };
}
