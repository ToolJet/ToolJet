import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { fetchEdition } from './utils';
import { MODULE_CONSTANTS } from '../constants';
import { componentRegistry } from './_registry/componentRegistry';

const getEditionModule = (moduleName, edition) => {
  if (edition === 'ce' || !componentRegistry[edition]?.[moduleName]) return null;
  return componentRegistry[edition]?.[moduleName] || componentRegistry.ce[moduleName];
};

const withEditionSpecificModule = (moduleName, options = {}) => {
  const {
    fallbackPath = '/',
    moduleRequiredIn = MODULE_CONSTANTS.MODULE_EDITIONS.ALL,
    LoadingComponent = () => <div>Loading...</div>,
    BaseModuleRouteComponent = null,
  } = options;

  return React.forwardRef((props, ref) => {
    const edition = fetchEdition();
    const [ModuleComponent, setModuleComponent] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
      try {
        if (typeof moduleRequiredIn !== 'string' && moduleRequiredIn !== MODULE_CONSTANTS.MODULE_EDITIONS.ALL) {
          const moduleEditions = Array.isArray(moduleRequiredIn) ? moduleRequiredIn : [];
          if (!moduleEditions.includes(edition)) {
            throw new Error(`Module ${moduleName} is not available in ${edition} edition`);
          }
        }

        const module = getEditionModule(moduleName, edition);
        if (!module && edition !== 'ce') {
          throw new Error(`Module ${moduleName} is not available in ${edition} edition`);
        }

        if (!BaseModuleRouteComponent && !module?.default) {
          throw new Error(`No default export found in ${moduleName} module`);
        }

        const shouldSetBaseModuleRouteComponent =
          BaseModuleRouteComponent && edition === MODULE_CONSTANTS.MODULE_EDITIONS.CE;

        setModuleComponent(() => (shouldSetBaseModuleRouteComponent ? BaseModuleRouteComponent : module.default));
      } catch (err) {
        console.error(`Error loading ${edition} module:`, err);
        setError(err);
      }
    }, []);

    if (!ModuleComponent && !error) return <LoadingComponent />;
    if (error || !ModuleComponent) return <Navigate to={fallbackPath} replace />;

    return <ModuleComponent {...props} ref={ref} />;
  });
};

export default withEditionSpecificModule;
