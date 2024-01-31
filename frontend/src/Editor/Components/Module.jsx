import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Viewer } from '../Viewer';
import { ModuleContext } from '../../_contexts/ModuleContext';
import { useSuperStore } from '../../_stores/superStore';
import { v4 as uuidv4 } from 'uuid';

export const Module = function Module({ component, width, id, parentId, removeComponent, containerProps }) {
  const parentRef = useRef(null);

  const [created, setCreated] = useState(false);
  const [createModule, destroyModule] = useSuperStore((state) => [state.createModule, state.destroyModule]);

  const moduleId = useMemo(() => `Module${uuidv4()}`, []);

  useEffect(() => {
    const status = createModule(moduleId);
    console.log({ status });
    setCreated(status);

    return () => {
      destroyModule(moduleId);
      setCreated(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={parentRef}>
      {created && (
        <ModuleContext.Provider value={moduleId}>
          <Viewer
            moduleMode={true}
            id={'f596caec-7f00-4c37-9d98-846813d61691'}
            slug={'f596caec-7f00-4c37-9d98-846813d61691'}
            versionId={'f68508aa-fdf5-4be2-b13e-4bf2e12f9413'}
            environmentId={'fcc709b7-e91b-47cd-ba68-e5af4f0331ab'}
          />
        </ModuleContext.Provider>
      )}
    </div>
  );
};
