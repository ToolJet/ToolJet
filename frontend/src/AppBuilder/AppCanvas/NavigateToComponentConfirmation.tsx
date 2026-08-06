import React from 'react';
import { ConfirmDialog } from '@/_components/ConfirmDialog';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

export const NavigateToComponentConfirmation = () => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const pendingComponentNavigation = useStore((state) => state.pendingComponentNavigation, shallow);
  const clearPendingComponentNavigation = useStore((state) => state.clearPendingComponentNavigation, shallow);
  const confirmNavigateToComponent = useStore((state) => state.confirmNavigateToComponent, shallow);

  if (!pendingComponentNavigation) return null;

  const { componentName, pageName } = pendingComponentNavigation;

  return (
    <ConfirmDialog
      show={!!pendingComponentNavigation}
      title="Navigate to another page?"
      message={`The component "${componentName}" is on the page "${pageName}". Do you want to switch to that page?`}
      onConfirm={confirmNavigateToComponent}
      onCancel={clearPendingComponentNavigation}
      confirmButtonText="Switch page"
      confirmButtonType="primary"
      darkMode={darkMode}
    />
  );
};
