import { useEditorStore } from '@/_stores/editorStore';
import React from 'react';
import { shallow } from 'zustand/shallow';
import { isEmpty } from 'lodash';

const RightSidebarTabManager = ({ inspectorTab, pageSettingTab, widgetManagerTab, allComponents }) => {
  const { selectedComponents, pageSettingSelected } = useEditorStore(
    (state) => ({
      selectedComponents: state?.selectedComponents,
      pageSettingSelected: state?.pageSettingSelected,
    }),
    shallow
  );

  const currentTab = selectedComponents.length === 1 ? 1 : 2;

  const showInspectorTab =
    currentTab === 1 &&
    selectedComponents.length === 1 &&
    !isEmpty(allComponents) &&
    !isEmpty(allComponents[selectedComponents[0]?.id]);

  if (pageSettingSelected && !showInspectorTab) {
    return <>{pageSettingTab}</>;
  }

  return <>{showInspectorTab ? inspectorTab : widgetManagerTab}</>;
};

export default RightSidebarTabManager;
