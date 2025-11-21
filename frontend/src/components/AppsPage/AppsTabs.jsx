import * as React from 'react';
import PropTypes from 'prop-types';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { AppsPageViewHeader } from './AppsPageViewHeader';
import { AppsTable } from './AppsTable';
import { AppsGrid } from './AppsGrid';

export function AppsTabs({
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
  // Table props
  appsTable,
  modulesTable,
  // Loading and error states
  appsLoading = false,
  modulesLoading = false,
  appsError = null,
  modulesError = null,
  // Count props for badges
  appsCount = 0,
  modulesCount = 0,
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
    <Tabs value={activeTab} onValueChange={onTabChange} className="tw-w-full tw-flex-col tw-justify-start tw-gap-6">
      {!hideHeader && (
        <div className="tw-flex tw-items-center tw-justify-between">
          <AppsPageViewHeader
            activeTab={activeTab}
            onTabChange={onTabChange}
            appsCount={appsCount}
            modulesCount={modulesCount}
            appsLoading={appsLoading}
            modulesLoading={modulesLoading}
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
      {/* Apps Tab Content - only render when active */}
      {activeTab === 'apps' && (
        <TabsContent value="apps" className="tw-relative tw-flex tw-flex-col tw-gap-4 tw-overflow-auto tw-mt-0">
          {appsError ? (
            <div className="tw-p-6 tw-text-center" role="alert" aria-live="polite">
              <div className="tw-text-red-500 tw-mb-2">Failed to load apps</div>
              <div className="tw-text-sm tw-text-muted-foreground">{appsError.message || 'An error occurred'}</div>
            </div>
          ) : appsEmpty ? (
            emptyAppsSlot
          ) : appsTable ? (
            viewAs === 'list' ? (
              <AppsTable table={appsTable} isLoading={appsLoading} />
            ) : (
              <AppsGrid
                table={appsTable}
                onPlay={onPlay}
                onEdit={onEdit}
                onClone={onClone}
                onDelete={onDelete}
                onExport={onExport}
                perms={perms}
                canDelete={canDelete}
              />
            )
          ) : null}
        </TabsContent>
      )}
      {/* Modules Tab Content - only render when active */}
      {activeTab === 'modules' && (
        <TabsContent value="modules" className="tw-relative tw-flex tw-flex-col tw-gap-4 tw-overflow-auto tw-mt-0">
          {modulesError ? (
            <div className="tw-p-6 tw-text-center" role="alert" aria-live="polite">
              <div className="tw-text-red-500 tw-mb-2">Failed to load modules</div>
              <div className="tw-text-sm tw-text-muted-foreground">{modulesError.message || 'An error occurred'}</div>
            </div>
          ) : modulesEmpty ? (
            emptyModulesSlot
          ) : modulesTable ? (
            viewAs === 'list' ? (
              <AppsTable table={modulesTable} isLoading={modulesLoading} />
            ) : (
              <AppsGrid
                table={modulesTable}
                onPlay={onPlay}
                onEdit={onEdit}
                onClone={onClone}
                onDelete={onDelete}
                onExport={onExport}
                perms={perms}
                canDelete={canDelete}
              />
            )
          ) : null}
        </TabsContent>
      )}
    </Tabs>
  );
}

AppsTabs.propTypes = {
  appsEmpty: PropTypes.bool,
  modulesEmpty: PropTypes.bool,
  emptyAppsSlot: PropTypes.node,
  emptyModulesSlot: PropTypes.node,
  // Tab control props
  activeTab: PropTypes.oneOf(['apps', 'modules']),
  onTabChange: PropTypes.func.isRequired,
  // Table props
  appsTable: PropTypes.object,
  modulesTable: PropTypes.object,
  // Loading and error states
  appsLoading: PropTypes.bool,
  modulesLoading: PropTypes.bool,
  appsError: PropTypes.oneOfType([PropTypes.instanceOf(Error), PropTypes.string, PropTypes.object]),
  modulesError: PropTypes.oneOfType([PropTypes.instanceOf(Error), PropTypes.string, PropTypes.object]),
  // Count props
  appsCount: PropTypes.number,
  modulesCount: PropTypes.number,
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
  activeTab: 'apps',
  onTabChange: null,
  appsTable: null,
  modulesTable: null,
  appsLoading: false,
  modulesLoading: false,
  appsError: null,
  modulesError: null,
  appsCount: 0,
  modulesCount: 0,
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
