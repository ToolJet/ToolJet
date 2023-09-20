import { useEditorStore } from '@/_stores/editorStore';
import React from 'react';
import { shallow } from 'zustand/shallow';
import { isEmpty } from 'lodash';
import { useTranslation } from 'react-i18next';

const RightSidebarTabManager = ({ inspectorTab, widgetManagerTab, allComponents }) => {
  const { selectedComponents } = useEditorStore(
    (state) => ({
      selectedComponents: state?.selectedComponents,
    }),
    shallow
  );
  const { t } = useTranslation();

  const currentTab = selectedComponents.length === 1 ? 1 : 2;

  const showInspectorTab =
    selectedComponents.length === 1 && !isEmpty(allComponents) && !isEmpty(allComponents[selectedComponents[0]?.id]);

  const _renderIfNoSelectedComponent = (
    <center className="mt-5 p-2">{t('editor.inspectComponent', 'Please select a component to inspect')}</center>
  );

  return (
    <>
      {currentTab === 1 && (showInspectorTab ? inspectorTab : _renderIfNoSelectedComponent)}
      {currentTab === 2 && widgetManagerTab}
    </>
  );
};

export default RightSidebarTabManager;
