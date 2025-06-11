import React from 'react';
import config from 'config';
import { fetchEdition } from './utils';
import { editions } from './_registry/moduleRegistry';

export function withEditionSpecificComponent(BaseComponent, moduleName) {
  return function EditionSpecificComponent(props) {
    const edition = fetchEdition(config);
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
