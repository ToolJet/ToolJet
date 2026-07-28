import React, { useState } from 'react';
import ToolbarTile from './ToolbarTile';
import ConfigureAddNewRow from './ConfigureAddNewRow';
import ConfigureDownload from './ConfigureDownload';

// Items that moved here from "Additional actions". `configurable` marks which ones expose further set of properties.
const TOOLBAR_ITEMS = [
  { key: 'showAddNewRowButton', label: 'Add new row', configurable: 'addNewRow' },
  { key: 'showDownloadButton', label: 'Download data', configurable: 'download' },
  { key: 'showRefreshButton', label: 'Refresh table' },
  { key: 'showBulkUpdateActions', label: 'Update buttons' },
];

// New tables use the `manageColumns` tile (ON = visible);
// tables that opted into the deprecated toggle keep the legacy inverted `hideColumnSelectorButton` tile.
const MANAGE_COLUMNS_ITEM = { key: 'manageColumns', label: 'Manage columns' };
const HIDE_COLUMN_SELECTOR_ITEM = { key: 'hideColumnSelectorButton', label: 'Hide column selector' };

/**
 * Renders the Table inspector's "Toolbar" section
 */
export const ToolbarSection = ({
  component,
  paramUpdated,
  darkMode,
  columns = [],
  useDynamicColumn = false,
  useHideColumnSelectorButton = false,
}) => {
  const [openConfigPopover, setOpenConfigPopover] = useState(null);

  const items = [...TOOLBAR_ITEMS, useHideColumnSelectorButton ? HIDE_COLUMN_SELECTOR_ITEM : MANAGE_COLUMNS_ITEM];

  const buildConfigContent = (item) => {
    if (item.configurable === 'addNewRow') {
      return (
        <ConfigureAddNewRow
          component={component}
          paramUpdated={paramUpdated}
          columns={columns}
          onClose={() => setOpenConfigPopover(null)}
        />
      );
    }
    if (item.configurable === 'download') {
      return (
        <ConfigureDownload
          component={component}
          paramUpdated={paramUpdated}
          onClose={() => setOpenConfigPopover(null)}
        />
      );
    }
    return null;
  };

  return (
    <div data-cy="table-toolbar-section">
      {items.map((item) => {
        // The Add-new-row column picker needs a static column list; hide the cog for dynamic-column tables.
        const isConfigurable = !!item.configurable && !(item.configurable === 'addNewRow' && useDynamicColumn);
        return (
          <ToolbarTile
            key={item.key}
            label={item.label}
            propertyKey={item.key}
            component={component}
            paramUpdated={paramUpdated}
            darkMode={darkMode}
            dataCy={item.key}
            isConfigurable={isConfigurable}
            configContent={isConfigurable ? buildConfigContent(item) : null}
            configOpen={openConfigPopover === item.key}
            onConfigOpenChange={(open) => setOpenConfigPopover(open ? item.key : null)}
          />
        );
      })}
    </div>
  );
};

export default ToolbarSection;
