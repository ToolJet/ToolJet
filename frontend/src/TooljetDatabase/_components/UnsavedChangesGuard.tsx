import React, { useEffect } from 'react';
import { TriangleAlert } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/Rocket/AlertDialog/AlertDialog';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { settleDiscard, useUnsavedChanges } from '../_stores/unsavedChanges';

const listLabels = (labels: string[]) =>
  labels.length > 1 ? `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}` : labels[0];

// Mounted once by the page. Warns the browser about a reload or tab close while anything is dirty (the browser shows its
// own generic dialog), and hosts the dialog that `confirmDiscard` asks through.
export function UnsavedChangesGuard() {
  const isDirty = useUnsavedChanges((state) => Object.keys(state.sources).length > 0);
  const askingAbout = useUnsavedChanges((state) => state.askingAbout);

  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [isDirty]);

  return (
    <AlertDialog
      open={askingAbout !== null}
      onOpenChange={(open) => {
        if (!open) settleDiscard(false);
      }}
    >
      {/* Esc keeps editing; an outside press does nothing, so the answer is always a button. */}
      <AlertDialogContent
        className="tw-max-w-[400px]"
        onEscapeKeyDown={() => settleDiscard(false)}
        data-cy="discard-changes-dialog"
      >
        <AlertDialogHeader>
          <AlertDialogMedia>
            <TriangleAlert className="tw-size-10 tw-text-icon-danger" />
          </AlertDialogMedia>
          <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
          <AlertDialogDescription>
            {askingAbout ? `Unsaved input in ${listLabels(askingAbout)} will be lost.` : ''}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" data-cy="keep-editing-button">
              Keep editing
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="primary"
              danger

              onClick={() => settleDiscard(true)}
              data-cy="discard-changes-button"
            >
              Discard
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
