import React from 'react';
import config from 'config';
import { fetchEdition } from './utils';
import { editions } from './_registry/moduleRegistry';

export function withEditionSpecificComponent(BaseComponent, moduleName) {
  return function EditionSpecificComponent(props) {
    let edition = fetchEdition(config);
    if (edition === 'cloud') {
      edition = 'ee'; // Treat cloud as enterprise edition for component loading
    }

    const componentName = BaseComponent.name;

    if (edition === 'ce') {
      return <BaseComponent {...props} />;
    }

    // Use the editions registry instead of dynamic imports
    const Component = editions[edition]?.[moduleName]?.components?.[componentName];
    const EditionComponent = Component?.default ?? Component;

    if (!EditionComponent) {
      console.warn(`Component ${componentName} not found in ${moduleName} for ${edition} edition`);
      return <BaseComponent {...props} />;
    }
    return <EditionComponent {...props} />;
  };
}
