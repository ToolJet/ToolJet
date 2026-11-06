import React from 'react';

import { Button } from '@/components/ui/Button/Button';

interface IBaseCreateWorkspaceBtnProps {
  onAddWorkspace: () => void;
  disabled?: boolean;
}

export default function BaseCreateWorkspaceBtn({ onAddWorkspace, disabled = false }: IBaseCreateWorkspaceBtnProps) {
  return (
    <Button
      isLucid
      leadingIcon="plus"
      variant="ghostBrand"
      className="tw-w-full"
      data-cy="add-new-workspace-button"
      disabled={disabled}
      onClick={onAddWorkspace}
    >
      Add new workspace
    </Button>
  );
}
