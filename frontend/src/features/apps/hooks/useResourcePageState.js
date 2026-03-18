import { useState, useMemo } from 'react';

export function useResourcePageState({ initialTab, initialViewMode, loadingStates = {} } = {}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'apps');
  const [viewMode, setViewMode] = useState(initialViewMode || 'list');

  const isLoading = useMemo(() => {
    return Object.values(loadingStates).some((loading) => loading);
  }, [loadingStates]);

  return {
    activeTab,
    setActiveTab,
    viewMode,
    setViewMode,
    isLoading,
    loadingStates,
  };
}
