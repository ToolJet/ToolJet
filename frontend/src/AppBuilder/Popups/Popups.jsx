import React from 'react';
import { Confirm } from '@/AppBuilder/Viewer/Confirm';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { WorkspaceGitSyncModal } from '@/_ui/WorkspaceGitSyncModal';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';

export const Popups = ({ darkMode }) => {
  const queryConfirmationList = useStore((state) => state.dataQuery.queryConfirmationList, shallow);
  const onQueryConfirmOrCancel = useStore((state) => state.queryPanel.onQueryConfirmOrCancel);

  const { showGitSyncModal, toggleGitSyncModal, selectedVersion, orgGit } = useStore(
    (state) => ({
      showGitSyncModal: state.showGitSyncModal,
      toggleGitSyncModal: state.toggleGitSyncModal,
      selectedVersion: state.selectedVersion,
      orgGit: state.orgGit,
    }),
    shallow
  );

  const workspaceActiveBranch = useWorkspaceBranchesStore((state) => state.currentBranch);
  const defaultBranchName = orgGit?.git_https?.github_branch || orgGit?.git_ssh?.github_branch || 'main';
  const isOnBranchVersion = selectedVersion?.versionType === 'branch' || selectedVersion?.version_type === 'branch';
  const isWorkspaceOnNonDefaultBranch =
    workspaceActiveBranch?.name &&
    workspaceActiveBranch.name !== defaultBranchName &&
    !workspaceActiveBranch?.is_default &&
    !workspaceActiveBranch?.isDefault;
  const isOnDefaultBranch = !isOnBranchVersion && !isWorkspaceOnNonDefaultBranch;

  return (
    <div>
      <Confirm
        show={queryConfirmationList?.length > 0}
        message={`Do you want to run this query - ${queryConfirmationList?.[0]?.queryName}?`}
        onConfirm={(queryConfirmationData) => onQueryConfirmOrCancel(queryConfirmationData, true)}
        onCancel={() => onQueryConfirmOrCancel(queryConfirmationList?.[0])}
        queryConfirmationData={queryConfirmationList?.[0]}
        darkMode={darkMode}
        key={queryConfirmationList?.[0]?.queryName}
      />
      {showGitSyncModal && isOnDefaultBranch && (
        <WorkspaceGitSyncModal
          isOnDefaultBranch={isOnDefaultBranch}
          initialTab="pull"
          onClose={() => toggleGitSyncModal()}
        />
      )}
    </div>
  );
};
