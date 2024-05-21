import { useEditorStore } from '@/_stores/editorStore';
import React, { useState } from 'react';
import { shallow } from 'zustand/shallow';
import { isEmpty } from 'lodash';

const RightSidebarTabManager = ({ inspectorTab, widgetManagerTab, allComponents }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const { selectedComponents } = useEditorStore(
    (state) => ({
      selectedComponents: state?.selectedComponents,
    }),
    shallow
  );

  const currentTab = selectedComponents.length === 1 ? 1 : 2;

  const showInspectorTab =
    currentTab === 1 &&
    selectedComponents.length === 1 &&
    !isEmpty(allComponents) &&
    !isEmpty(allComponents[selectedComponents[0]?.id]);
  return (
    <>
      {showInspectorTab
        ? inspectorTab
        : React.cloneElement(widgetManagerTab, {
            searchQuery,
            setSearchQuery,
          })}
    </>
  );
};

export default RightSidebarTabManager;
