import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { InlineInfo } from '@/components/ui/Rocket';
import ActionDialog from '@/components/ui/Rocket/Dialog/ActionDialog';
import { DialogDescription, DialogTitle } from '@/components/ui/Rocket/Dialog/Dialog';

const FALLBACK_ERROR = 'Something went wrong. Please try again.';

export default function DeleteConstantsDialog({ constants, open, onOpenChange, onConfirm }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
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
      setError(err?.error || FALLBACK_ERROR);
    } finally {
      setPending(false);
    }
  };

  return (
    <ActionDialog
      open={open}
      handleOpenChange={(next) => !next && close()}
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
        <Trash2 size={40} className="tw-text-icon-danger" />
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
