import React from 'react';
import PropTypes from 'prop-types';
import { HeaderSection } from '@/_ui/LeftSidebar';
import JSONTreeViewer from '@/_ui/JSONTreeViewer';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

export const LeftSidebarInspector = ({
  darkMode,
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

LeftSidebarInspector.propTypes = {
  darkMode: PropTypes.bool.isRequired,
  setPinned: PropTypes.func.isRequired,
  pinned: PropTypes.bool.isRequired,
  jsonData: PropTypes.object.isRequired,
  iconsList: PropTypes.array.isRequired,
  actionsList: PropTypes.array.isRequired,
  selectedComponent: PropTypes.object,
};
