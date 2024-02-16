import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Viewer } from '../Viewer';
import { ModuleContext } from '../../_contexts/ModuleContext';
import { useSuperStore } from '../../_stores/superStore';
import { v4 as uuidv4 } from 'uuid';
import { useEditorStore } from '../../_stores/editorStore';
import { find } from 'lodash';

export const Module = function Module({ component, properties, styles, width, height, setExposedVariables }) {
  const parentRef = useRef(null);

  const [created, setCreated] = useState(false);
  const [createModule, destroyModule] = useSuperStore((state) => [state.createModule, state.destroyModule]);

  const moduleId = useMemo(() => `Module${uuidv4()}`, []);

  useEffect(() => {
    const status = createModule(moduleId);
    setCreated(status);

    return () => {
      destroyModule(moduleId);
      setCreated(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { moduleAppId, moduleVersionId, moduleEnvironmentId } = properties;
  const { backgroundColor, visibility, boxShadow, borderRadius, borderColor } = styles;

  const computedStyles = {
    backgroundColor,
    borderRadius: borderRadius ? parseFloat(borderRadius) : 0,
    border: `1px solid ${borderColor}`,
    height,
    display: visibility ? 'flex' : 'none',
    overflow: 'hidden auto',
    position: 'relative',
    boxShadow,
  };

  const loadedModules = useEditorStore((state) => state.loadedModules);
  const moduleContainer = find(loadedModules, { id: moduleAppId })?.module_container ?? {};
  const inputItems = Object.values(moduleContainer?.component?.definition?.properties?.input_items?.value ?? {});
  const outputItems = Object.values(moduleContainer?.component?.definition?.properties?.output_items?.value ?? {});

  const inputResolvables = inputItems.reduce(
    (resolvables, item) => ({ ...resolvables, [item.name]: properties[item.name] }),
    {}
  );

  const exposeOutputVariables = (outputVariables) => {
    setExposedVariables(Object.fromEntries(outputVariables.map((variable) => [variable.name, variable.value])));
  };

  return (
    <div ref={parentRef} styles={computedStyles}>
      {created && (
        <ModuleContext.Provider value={moduleId}>
          <Viewer
            moduleMode={true}
            id={moduleAppId}
            versionId={moduleVersionId}
            environmentId={moduleEnvironmentId}
            width={width}
            height={height}
            customResolvables={{ input: inputResolvables }}
            exposeOutputVariables={exposeOutputVariables}
            outputVariables={outputItems}
          />
        </ModuleContext.Provider>
      )}
    </div>
  );
};
