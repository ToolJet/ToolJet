import React from 'react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import JSONTreeViewerV2 from './JSONTreeViewerV2';
import InspectorHeader from './InspectorHeader';
import useInspectorTreeData from './useInspectorTreeData';

import './styles.scss';

const LeftSidebarInspector = ({ darkMode, onClose, moduleId, appType }) => {
  const { treeData: memoizedJSONData, iconsList, searchablePaths } = useInspectorTreeData({ moduleId, appType });

  // Search state from store
  const searchValue = useStore((state) => state.inspectorSearchValue, shallow);
  const setSearchValue = useStore((state) => state.setInspectorSearchValue, shallow);

  // Hide search only when the detail view (JSONViewer) is actually displayed
  const isDetailViewOpen = useStore((state) => state.isInspectorDetailViewOpen(), shallow);

  return (
    <div
      className={`left-sidebar-inspector ${darkMode && 'dark-theme'}`}
      style={{ resize: 'horizontal', minWidth: 288 }}
    >
      <InspectorHeader
        darkMode={darkMode}
        onClose={onClose}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearchClear={() => setSearchValue('')}
        hideSearch={isDetailViewOpen}
      />

      <div className="card-body p-1 pb-5">
        {/* Crashes here are caught by the LeftSidebar panel FallbackBoundary. */}
        <JSONTreeViewerV2
          data={memoizedJSONData}
          iconsList={iconsList}
          darkMode={darkMode}
          searchablePaths={searchablePaths}
        />
      </div>
    </div>
  );
};

export default LeftSidebarInspector;
