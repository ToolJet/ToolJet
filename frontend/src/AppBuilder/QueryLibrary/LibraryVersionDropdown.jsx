import React from 'react';
import { VersionLifecycleProvider } from '@/AppBuilder/Header/VersionManager/VersionLifecycleContext';
import { VersionManagerDropdownContent } from '@/AppBuilder/Header/VersionManager/VersionManagerDropdown';
import useLibraryVersionLifecycle from './useLibraryVersionLifecycle';

const LibraryVersionDropdownContent = ({ queryId, darkMode }) => {
  const value = useLibraryVersionLifecycle({ queryId, darkMode });
  return (
    <VersionLifecycleProvider value={value}>
      <VersionManagerDropdownContent darkMode={darkMode} />
    </VersionLifecycleProvider>
  );
};

export default function LibraryVersionDropdown({ queryId, darkMode = false }) {
  return <LibraryVersionDropdownContent key={queryId} queryId={queryId} darkMode={darkMode} />;
}
