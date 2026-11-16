import React from 'react';
import { TriangleAlert } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  Button,
} from '@/components/ui/Rocket';

export const NESTED_WORKFLOW_PINS_BLOCKED = 'NESTED_WORKFLOW_PINS_BLOCKED';

const COPY = {
  save: {
    title: 'Cannot save this workflow',
    intro: () =>
      'Every workflow nested in this one must be pinned to a saved version. The following are currently pinned to a draft:',
  },
  promote: {
    title: 'Cannot promote this workflow',
    intro: (environment) => `The following nested workflows aren't promoted to ${environment} yet:`,
    action: (environment) => `Promote each one to ${environment}, then try again.`,
  },
  release: {
    title: 'Cannot release this workflow',
    intro: () => "The following nested workflows aren't released at the pinned version:",
    action: () => 'Release each one at that version, then try again.',
  },
};

const NestedWorkflowPinsBlockedDialog = ({ blocked, onClose }) => {
  if (!blocked) return null;
  const { action, environment, workflows } = blocked;
  const copy = COPY[action];

  return (
    <AlertDialog open>
      <AlertDialogContent data-cy="nested-workflow-pins-blocked-dialog">
        <AlertDialogHeader>
          <AlertDialogMedia>
            <TriangleAlert className="tw-size-10 tw-text-icon-danger" />
          </AlertDialogMedia>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="tw-font-body-default tw-text-text-default">
          <p className="tw-mb-1">{copy.intro(environment)}</p>
          <ol className="tw-mb-3 tw-list-decimal tw-pl-5">
            {workflows.map(({ name, versionName }) => (
              <li key={`${name}-${versionName}`}>{versionName ? `${name} (${versionName})` : name}</li>
            ))}
          </ol>
          {copy.action ? (
            <p className="tw-mb-0">{copy.action(environment)}</p>
          ) : (
            <>
              <p className="tw-mb-1 tw-font-medium">To continue, for each one you can either:</p>
              <ul className="tw-mb-0 tw-list-disc tw-pl-5">
                <li>Save its draft version, or</li>
                <li>Pin it to a version that&apos;s already saved</li>
              </ul>
            </>
          )}
        </div>
        <AlertDialogFooter className="tw-justify-end">
          <AlertDialogAction asChild>
            <Button variant="outline" onClick={onClose} data-cy="nested-workflow-pins-blocked-understand">
              I understand
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default NestedWorkflowPinsBlockedDialog;
