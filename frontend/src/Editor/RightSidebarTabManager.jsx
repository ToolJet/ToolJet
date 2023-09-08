import { useEditorStore } from '@/_stores/editorStore';
import React from 'react';
import { shallow } from 'zustand/shallow';

const RightSidebarTabManager = ({ inspectorTab, widgetManagerTab }) => {
  const { selectedComponents } = useEditorStore(
    (state) => ({
      selectedComponents: state?.selectedComponents,
    }),
    shallow
  );
  const currentTab = selectedComponents.length === 1 ? 1 : 2;
  return (
    <>
      {currentTab === 1 && inspectorTab} {currentTab === 2 && widgetManagerTab}
    </>
  );
};

export default RightSidebarTabManager;
