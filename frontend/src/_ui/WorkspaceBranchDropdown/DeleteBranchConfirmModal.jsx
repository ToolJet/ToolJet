import React, { useEffect, useRef } from 'react';
import AlertDialog from '@/_ui/AlertDialog';
import TablerIcon from '@/_ui/Icon/TablerIcon';
import { Alert } from '@/_ui/Alert';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import { toast } from 'react-hot-toast';
import { IconInfoCircleFilled } from '@tabler/icons-react';
import '@/_styles/delete-branch-confirm-modal.scss';

export function DeleteBranchConfirmModal({ branchToDelete, onCancel, onDelete, onCloseParent }) {
  const { isDeletingBranch, deleteBranchError } = useWorkspaceBranchesStore((state) => ({
    isDeletingBranch: state.isDeletingBranch,
    deleteBranchError: state.deleteBranchError,
  }));

  const wasDeletingRef = useRef(false);

  // Auto-close and redirect on successful deletion
  useEffect(() => {
    if (wasDeletingRef.current && !isDeletingBranch && !deleteBranchError && branchToDelete) {
      const deletedName = branchToDelete.name;
      onCancel();
      onCloseParent();
      toast(`Branch '${deletedName}' is being deleted. Changes will be reflected in a few minutes`, {
        icon: <IconInfoCircleFilled size={20} style={{ color: '#6177DB', flexShrink: 0 }} />,
        duration: 8000,
        style: { maxWidth: '420px', fontSize: '15px', fontWeight: 400 },
      });
      const workspacePath = window.location.pathname.split('/')[1];
      setTimeout(() => {
        window.location.href = `/${workspacePath}`;
      }, 1500);
    }
    wasDeletingRef.current = isDeletingBranch;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDeletingBranch, deleteBranchError]);

  if (!branchToDelete) return null;

  return (
    <AlertDialog show={true} closeModal={onCancel} customClassName="delete-branch-confirm-modal">
      <div className="delete-branch-icon-wrapper">
        <TablerIcon iconName="IconTrash" size={48} color="var(--tomato9)" stroke={1.5} />
      </div>

      <div className="delete-branch-title">Delete branch &ldquo;{branchToDelete.name}&rdquo;</div>

      <div className="delete-branch-description">
        The branch will be deleted in ToolJet and in your git repository. Are you sure you want to delete{' '}
        {branchToDelete.name}?
      </div>

      {deleteBranchError && (
        <Alert svg="warning-icon" cls="delete-branch-error">
          {deleteBranchError}
        </Alert>
      )}

      <div className="delete-branch-actions">
        <button className="btn" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-danger" disabled={isDeletingBranch} onClick={() => onDelete(branchToDelete.id)}>
          Delete branch
        </button>
      </div>
    </AlertDialog>
  );
}

export default DeleteBranchConfirmModal;
