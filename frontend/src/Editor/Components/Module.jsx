import React, { useRef, useEffect, useState } from 'react';
import { Viewer } from '../Viewer';
import { ModuleContext } from '../../_contexts/ModuleContext';
import { useSuperStore } from '../../_stores/superStore';

export const Module = function Module({ component, width, id, removeComponent, containerProps }) {
  const parentRef = useRef(null);

  const [created, setCreated] = useState(false);
  const [createModule, destroyModule] = useSuperStore((state) => [state.createModule, state.destroyModule]);

  useEffect(() => {
    const status = createModule(`Module${id}`);
    console.log({ status });
    setCreated(status);

    return () => {
      destroyModule(`Module${id}`);
      setCreated(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={parentRef}>
      {created && (
        <ModuleContext.Provider value={`Module${id}`}>
          <Viewer
            moduleMode={true}
            id={'aa0d725c-5ab3-4d7a-b277-397111ad0f0b'}
            slug={'aa0d725c-5ab3-4d7a-b277-397111ad0f0b'}
            versionId={'0063c7b6-a72f-490e-a147-ee5c84235f8b'}
          />
        </ModuleContext.Provider>
      )}
    </div>
  );
};
