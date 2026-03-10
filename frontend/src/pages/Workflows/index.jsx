import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FileDown } from 'lucide-react';

import { getWorkspaceId } from '@/_helpers/utils';
import { Button } from '@/components/ui/Button/Button';
import { fetchAndSetWindowTitle, pageTitles } from '@white-label/whiteLabelling';
import { isWorkflowsFeatureEnabled } from '@/modules/common/helpers/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/rocket/dropdown-menu';

import { canUserPerformWorkflowAction } from './workflowPermissions';
import WorkspaceLayout from '../layouts/WorkspaceLayout';
import AppsFooter from '../Apps/components/AppsFooter';
import AppList from '../Apps/components/AppList';
import PageHeader from '../shared/PageHeader';
import ContentToolbar from '../shared/ContentToolbar';
import { useFetchApps, useFetchAppsLimit, useFetchWorkflowLimit } from '../shared/hooks/appsServiceHooks';
import { useFetchFolders } from '../shared/hooks/folderServiceHooks';
import { useFetchFeatureAccess } from '../shared/hooks/licenseServiceHooks';
// import CRUDActionDialog from '../shared/CRUDActionDialog';

// TODOs:
// Dialogs: Create/Rename/Delete/Import/Export workflow, Import workflow, Create/Edit/Delete folder, Move to folder, Change Icon

export default function Workflows() {
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);

  const [searchParams, setSearchParams] = useSearchParams();

  const { data: folders, isSuccess: isFoldersSuccess } = useFetchFolders({ appType: 'workflow' }, {});

  // TODO: Discuss with team that folder search param should have id and not name
  const folderQueryParam = searchParams.get('folder') || '';
  const currentSelectedFolder =
    folders?.find((folder) => folder.label?.toLowerCase() === folderQueryParam?.toLowerCase()) ?? null;
  const selectedFolderId = currentSelectedFolder?.value ?? null;

  const { data: workflows } = useFetchApps(
    { appType: 'workflow', folder: selectedFolderId, page: currentPage },
    { enabled: isFoldersSuccess }
  );
  useFetchFeatureAccess();
  useFetchAppsLimit();

  const { data: workflowInstanceLevelLimit, isLoading: isLoadingInstanceLevelLimit } =
    useFetchWorkflowLimit('instance');
  const { data: workflowWorkspaceLevelLimit, isLoading: isLoadingWorkspaceLevelLimit } =
    useFetchWorkflowLimit('workspace');

  useEffect(() => {
    // fetchAndSetWindowTitle({ page: pageTitles.DASHBOARD }); // Also called in frontend/src/_ui/Layout/index.jsx check if we can skip this call from here

    // TODO: I guess if we do not render route itself we won't need this logic here
    const canView = canUserPerformWorkflowAction('view') && isWorkflowsFeatureEnabled();

    if (!canView) {
      toast.error('You do not have permission to view workflows');

      const workspaceId = getWorkspaceId();
      navigate(`/${workspaceId}/home`);
    }
  }, [navigate]);

  const setSelectedFolder = (folderId) => {
    if (folderId === 'all') {
      setSearchParams(undefined);
      return;
    }

    const newSelectedFolderLabel = folders?.find((folder) => folder.value === folderId)?.label ?? '';
    console.log('newSelectedFolderLabel', newSelectedFolderLabel);

    setSearchParams({ folder: newSelectedFolderLabel }, { replace: true });
  };

  const hasWorkflowLimitReached = () => {
    if (isLoadingInstanceLevelLimit || isLoadingWorkspaceLevelLimit) return false;

    const instanceLimitReached =
      workflowInstanceLevelLimit.total === 0 || workflowInstanceLevelLimit.current >= workflowInstanceLevelLimit.total;
    const workspaceLimitReached =
      workflowWorkspaceLevelLimit.total === 0 ||
      workflowWorkspaceLevelLimit.current >= workflowWorkspaceLevelLimit.total;

    return instanceLimitReached || workspaceLimitReached;
  };

  const totalAppCount = selectedFolderId ? workflows?.meta?.folder_count : workflows?.meta?.total_count;

  const isCreateBtnDisabled = hasWorkflowLimitReached();
  const isDropdownMenuDisabled = hasWorkflowLimitReached();

  return (
    <WorkspaceLayout>
      <section className="tw-flex tw-flex-col tw-h-[calc(100svh-var(--header-height))]">
        <div className="tw-flex-1 tw-px-20 tw-py-10 tw-space-y-5 tw-h-[calc(100svh-var(--header-height)-48px)]">
          <PageHeader title="Workflows">
            <div className="tw-flex tw-items-center tw-gap-2">
              <Button
                isLucid
                variant="secondary"
                leadingIcon="plus"
                disabled={isCreateBtnDisabled}
                data-cy="create-new-workflows-button"
              >
                Create blank workflow
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    isLucid
                    iconOnly
                    variant="outline"
                    data-cy="import-dropdown-menu"
                    leadingIcon="ellipsis-vertical"
                    disabled={isDropdownMenuDisabled}
                  />
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-40" align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuItem className="tw-text-text-default tw-font-body-default" onClick={() => null}>
                      <FileDown size={16} color="var(--icon-weak)" />
                      Import from device
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </PageHeader>

          <ContentToolbar
            folderList={folders ?? []}
            selectedFolder={selectedFolderId ?? 'all'}
            onChangeSelectedFolder={setSelectedFolder}
          />

          <div className="tw-overflow-y-scroll tw-hide-scrollbar">
            <AppList apps={workflows?.apps ?? []} />
          </div>
        </div>

        <div className="tw-flex-shrink-0">
          <AppsFooter currentPage={currentPage} pageSize={9} totalItems={totalAppCount} onPageChange={setCurrentPage} />
        </div>
      </section>

      {/* <CRUDActionDialog open actionType="create" appType="workflow" /> */}
    </WorkspaceLayout>
  );
}
