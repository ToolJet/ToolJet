import React, { useState, useEffect } from 'react';
import config from 'config';
import { fetchEdition } from './utils';
import { EE_MODULE_LOADERS } from './_registry/moduleRegistry';

export function withEditionSpecificComponent(BaseComponent, moduleName) {
  return function EditionSpecificComponent(props) {
    let edition = fetchEdition(config);
    if (edition === 'cloud') {
      edition = 'ee'; // Treat cloud as enterprise edition for component loading
    }

    const [EEComponent, setEEComponent] = useState(null);

    useEffect(() => {
      if (edition === 'ce') return;

      const loader = EE_MODULE_LOADERS[moduleName];
      if (!loader) return;

      loader().then((module) => {
        const componentName = BaseComponent.name;
        const found =
          module.components?.[componentName]?.default ??
          module.components?.[componentName] ??
          module.widgets?.[componentName]?.default ??
          module.widgets?.[componentName];

        if (found) {
          setEEComponent(() => found);
        } else {
          console.warn(`Component ${componentName} not found in ${moduleName} for ${edition} edition`);
        }
      });
    }, []);

    // CE always renders the base component directly.
    // EE/Cloud: renders BaseComponent as fallback until the async chunk loads,
    // then swaps to the edition-specific component — same behaviour as before
    // since the old registry returned BaseComponent on lookup miss too.
    if (edition === 'ce' || !EEComponent) return <BaseComponent {...props} />;
    return <EEComponent {...props} />;
  };
}
