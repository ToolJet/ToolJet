import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import DependencyWarningDialog from '@/_components/DependencyWarningDialog/DependencyWarningDialog';

export default function LibraryQueryDependencyWarning({ darkMode }) {
  const warning = useStore((state) => state.dataQuery.dependencyWarning);
  const sessionId = useStore((state) => state.queryLibrary.sessionId);
  const isLibraryMode = useStore((state) => state.queryLibrary.isLibraryMode);
  const close = useStore((state) => state.dataQuery.closeDependencyWarning);
  return (
    <DependencyWarningDialog
      open={!!warning && isLibraryMode && warning.sessionId === sessionId}
      title={warning?.title}
      message={warning?.message}
      darkMode={darkMode}
      onClose={close}
    />
  );
}
