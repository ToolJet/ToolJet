import * as React from 'react';
import PropTypes from 'prop-types';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { AppsPageViewHeader } from './AppsPageViewHeader';
import { AppsTable } from './AppsTable';
import { AppsGrid } from './AppsGrid';

export function AppsTabs({
  table,
  appsEmpty = false,
  modulesEmpty = false,
  emptyAppsSlot = null,
  emptyModulesSlot = null,
  // Folder selection props
  folders = [],
  currentFolder = null,
  onFolderChange,
  foldersLoading = false,
  activeTab = 'apps',
  onTabChange,
  // Action handlers
  onPlay,
  onEdit,
  onClone,
  onDelete,
  onExport,
  perms,
  canDelete,
}) {
  const [viewAs, setViewAs] = React.useState('list');

  const hideHeader = (activeTab === 'apps' && appsEmpty) || (activeTab === 'modules' && modulesEmpty);

  // Build breadcrumb items dynamically based on current folder
  const breadcrumbItems = React.useMemo(() => {
    const currentFolderLabel = currentFolder?.name || 'All apps';
    return [
      { label: 'Folders', href: '/folders' },
      { label: currentFolderLabel, href: null },
    ];
  }, [currentFolder]);

  return (
    <Tabs defaultValue="apps" className="tw-w-full tw-flex-col tw-justify-start tw-gap-6">
      {!hideHeader && (
        <div className="tw-flex tw-items-center tw-justify-between">
          <AppsPageViewHeader
            activeTab={activeTab}
            onTabChange={onTabChange}
            breadcrumbItems={breadcrumbItems}
            viewAs={viewAs}
            onViewChange={(view) => setViewAs(view)}
            folders={folders}
            currentFolder={currentFolder}
            onFolderChange={onFolderChange}
            foldersLoading={foldersLoading}
          />
        </div>
      )}
      <TabsContent value="apps" className="tw-relative tw-flex tw-flex-col tw-gap-4 tw-overflow-auto tw-mt-0">
        {appsEmpty ? (
          emptyAppsSlot
        ) : viewAs === 'list' ? (
          <AppsTable table={table} />
        ) : (
          <AppsGrid
            table={table}
            onPlay={onPlay}
            onEdit={onEdit}
            onClone={onClone}
            onDelete={onDelete}
            onExport={onExport}
            perms={perms}
            canDelete={canDelete}
          />
        )}
      </TabsContent>
      <TabsContent value="modules" className="tw-flex tw-flex-col tw-px-4 lg:tw-px-6">
        {modulesEmpty ? (
          emptyModulesSlot
        ) : (
          <div className="tw-aspect-video tw-w-full tw-flex-1 tw-rounded-lg tw-border tw-border-dashed" />
        )}
      </TabsContent>
    </Tabs>
  );
}

AppsTabs.propTypes = {
  table: PropTypes.object,
  appsEmpty: PropTypes.bool,
  modulesEmpty: PropTypes.bool,
  emptyAppsSlot: PropTypes.node,
  emptyModulesSlot: PropTypes.node,
  // Folder selection props
  folders: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      count: PropTypes.number,
    })
  ),
  currentFolder: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    count: PropTypes.number,
  }),
  onFolderChange: PropTypes.func,
  foldersLoading: PropTypes.bool,
  // Action handlers
  onPlay: PropTypes.func,
  onEdit: PropTypes.func,
  onClone: PropTypes.func,
  onDelete: PropTypes.func,
  onExport: PropTypes.func,
  perms: PropTypes.object,
  canDelete: PropTypes.func,
};

AppsTabs.defaultProps = {
  table: null,
  appsEmpty: false,
  modulesEmpty: false,
  emptyAppsSlot: null,
  emptyModulesSlot: null,
  folders: [],
  currentFolder: null,
  onFolderChange: null,
  foldersLoading: false,
};

export default AppsTabs;
