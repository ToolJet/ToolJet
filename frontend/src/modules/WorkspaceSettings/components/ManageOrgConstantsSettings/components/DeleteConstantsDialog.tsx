import React, { useState } from 'react';
import { Trash } from 'lucide-react';
import { InlineInfo } from '@/components/ui/Rocket';
import ActionDialog from '@/components/ui/Rocket/Dialog/ActionDialog';
import { DialogDescription, DialogTitle } from '@/components/ui/Rocket/Dialog/Dialog';
import { getErrorMessage } from '../helpers/errors';

interface DeleteConstantsDialogProps {
  /** Names of the constants to delete. */
  constants: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<unknown>;
  /** Where focus goes when the dialog closes, for an opener that is gone by then. */
  onCloseAutoFocus?: (event: Event) => void;
}

export default function DeleteConstantsDialog({
  constants,
  open,
  onOpenChange,
  onConfirm,
  onCloseAutoFocus,
}: DeleteConstantsDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isBulk = constants.length > 1;

  const close = () => {
    if (pending) return;
    setError(null);
    onOpenChange(false);
  };

  const confirm = async () => {
    setPending(true);
    setError(null);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <ActionDialog
      open={open}
      handleOpenChange={(next: boolean) => !next && close()}
      onCloseAutoFocus={onCloseAutoFocus}
      classes={{ dialogContent: 'tw-max-w-[459px] tw-border-0', dialogBody: 'tw-pb-0' }}
      cancelBtnProps={{ onClick: close, disabled: pending, 'data-cy': 'cancel-button' }}
      submitActions={[
        {
          label: isBulk ? 'Delete constants' : 'Delete constant',
          variant: 'dangerPrimary',
          isLoading: pending,
          disabled: pending,
          onClick: confirm,
          'data-cy': 'delete-constant-button',
        },
      ]}
    >
      <div className="tw-flex tw-flex-col tw-gap-2">
        <Trash size={40} className="tw-text-icon-danger" />
        <div className="tw-flex tw-flex-col tw-gap-0.5">
          <DialogTitle className="tw-font-title-x-large tw-text-text-default">
            {isBulk ? `Delete ${constants.length} constants?` : 'Delete workspace constant?'}
          </DialogTitle>
          <DialogDescription className="tw-mb-0 tw-font-body-default tw-text-text-default">
            {isBulk
              ? `The ${constants.length} selected constants will be permanently deleted from every environment, do you want to continue?`
              : `The workspace constant ${constants[0]} will be permanently deleted from every environment, do you want to continue?`}
          </DialogDescription>
        </div>
        {error && <InlineInfo type="danger" variant="filled" description={error} />}
      </div>
    </ActionDialog>
  );
}
