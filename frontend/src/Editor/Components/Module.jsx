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
            id={'e87652b4-478f-4622-a893-733bfd433799'}
            slug={'e87652b4-478f-4622-a893-733bfd433799'}
            versionId={'98a4044a-6667-43d3-bdb3-1cdbac6e1998'}
          />
        </ModuleContext.Provider>
      )}
    </div>
  );
};
