import React, { useMemo } from 'react';
import { HeaderSection } from '@/_ui/LeftSidebar';
import JSONTreeViewer from '@/_ui/JSONTreeViewer';
import _ from 'lodash';
import { toast } from 'react-hot-toast';
import Icon from '@/_ui/Icon/solidIcons/index';
import { useGlobalDataSources } from '@/_stores/dataSourcesStore';
import { useDataQueries } from '@/_stores/dataQueriesStore';
import { useCurrentState } from '@/_stores/currentStateStore';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { useEditorStore } from '@/_stores/editorStore';
import DataSourceIcon from '@/Editor/QueryManager/Components/DataSourceIcon';

export const LeftSidebarInspector = ({
  darkMode,
  appDefinition,
  setSelectedComponent,
  removeComponent,
  runQuery,
  setPinned,
  pinned,
  jsonData,
  iconsList,
  actionsList,
  selectedComponent,
}) => {
  return (
    <div
      className={`left-sidebar-inspector ${darkMode && 'dark-theme'}`}
      style={{ resize: 'horizontal', minWidth: 288 }}
    >
      <HeaderSection darkMode={darkMode}>
        <HeaderSection.PanelHeader title="Inspector">
          <div className="d-flex justify-content-end">
            <ButtonSolid
              title={`${pinned ? 'Unpin' : 'Pin'}`}
              onClick={() => setPinned(!pinned)}
              darkMode={darkMode}
              styles={{ width: '28px', padding: 0 }}
              data-cy={`left-sidebar-inspector`}
              variant="tertiary"
              className="left-sidebar-header-btn"
              leftIcon={pinned ? 'unpin' : 'pin'}
              iconWidth="14"
              fill={`var(--slate12)`}
            ></ButtonSolid>
          </div>
        </HeaderSection.PanelHeader>
      </HeaderSection>
      <div className="card-body p-1 pb-5">
        <JSONTreeViewer
          data={jsonData}
          useIcons={true}
          iconsList={iconsList}
          useIndentedBlock={true}
          enableCopyToClipboard={true}
          useActions={true}
          actionsList={actionsList}
          actionIdentifier="id"
          expandWithLabels={true}
          selectedComponent={selectedComponent}
          treeType="inspector"
          darkMode={darkMode}
        />
      </div>
    </div>
  );
};
