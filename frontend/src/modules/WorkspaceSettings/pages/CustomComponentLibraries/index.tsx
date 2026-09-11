import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { VectorSquare } from 'lucide-react';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

import Dialog from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button/Button';
import { licenseService } from '@/_services/license.service';
import { customComponentLibrariesService, type CustomComponentLibrary } from '@/_services/customComponentLibraries.service';
import { useCustomComponentLibrariesStore } from '@/_stores/customComponentLibrariesStore';

import './custom-component-libraries.styles.scss';

const ButtonComponent = Button as React.ComponentType<any>;

interface DeleteErrorResponse {
  data?: {
    apps?: string[];
    message?: string;
  };
}

interface CustomComponentLibrariesProps {
  darkMode: boolean;
}

export default function CustomComponentLibraries({ darkMode }: CustomComponentLibrariesProps) {
  const libraries = useCustomComponentLibrariesStore((state: any) => state.libraries) as
    | CustomComponentLibrary[]
    | null; // null = loading
  const loadFailed = useCustomComponentLibrariesStore((state: any) => state.loadFailed) as boolean; // failed fetch ≠ empty list
  const [deleteTarget, setDeleteTarget] = useState<CustomComponentLibrary | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [popoverToOpenId, setPopoverToOpenId] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    licenseService
      .getFeatureAccess()
      .then((data: { customComponentLibraries?: boolean }) => setHasAccess(data?.customComponentLibraries === true))
      .catch(() => setHasAccess(false));
  }, []);

  useEffect(() => {
    if (hasAccess === true) useCustomComponentLibrariesStore.getState().fetchLibraries();
  }, [hasAccess]);

  // Cache is shared with the RightSideBar tab and the dev-pin sync — this page invalidates
  // its own reference on unmount so a delete/publish made elsewhere is picked up next visit.
  useEffect(() => {
    return () => useCustomComponentLibrariesStore.getState().invalidate();
  }, []);

  if (hasAccess !== true) return null;

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleteInProgress(true);
    try {
      await customComponentLibrariesService.deleteLibrary(deleteTarget.id);
      toast.success('Library deleted', { duration: 2000 });
      setDeleteTarget(null);
      useCustomComponentLibrariesStore.getState().fetchLibraries({ force: true });
    } catch (err) {
      const error = err as DeleteErrorResponse;
      const apps = error?.data?.apps;
      toast.error(
        apps?.length
          ? `Cannot delete — in use by: ${apps.join(', ')}`
          : error?.data?.message ?? 'Could not delete library',
        { duration: 5000 }
      );
    }
    setDeleteInProgress(false);
  };

  const handleOpenDeleteDialog = (library: CustomComponentLibrary) => () => {
    setDeleteTarget(library);
    setPopoverToOpenId(null);
  };

  return (
    <div className="custom-component-libraries-page" data-cy="custom-component-libraries-page">
      <div className="tw-h-8 tw-flex tw-items-center tw-justify-between">
        <p className="libraries-count" data-cy="libraries-count">
          {libraries === null ? '' : `${libraries.length} ${libraries.length <= 1 ? 'library' : 'libraries'}`}
        </p>
      </div>

      <div className="libraries-card">
        <div className="libraries-table-header">
          <div className="col-name tw-text-text-placeholder">Name</div>
          <div className="col-version tw-text-text-placeholder">Latest version</div>
        </div>

        {libraries === null ? null : loadFailed ? (
          <div className="libraries-empty" data-cy="libraries-load-error">
            <p className="libraries-empty-title">Could not load libraries</p>
            <p className="libraries-empty-subtitle">
              <button
                type="button"
                className="libraries-retry-link"
                onClick={() => useCustomComponentLibrariesStore.getState().fetchLibraries({ force: true })}
              >
                Retry
              </button>
            </p>
          </div>
        ) : libraries.length === 0 ? (
          <CustomComponentLibraryEmptyState />
        ) : (
          <div className="libraries-table-body" data-cy="libraries-table">
            {libraries.map((library) => (
              <div className="libraries-row" key={library.id} data-cy={`library-row-${library.name}`}>
                <div className="col-name">{library.name}</div>
                <div className="col-version">
                  {library.revisions[0]?.version ?? (library.devBundles?.length ? 'dev' : '—')}
                </div>

                <OverlayTrigger
                  rootClose
                  show={popoverToOpenId === library.id}
                  trigger="click"
                  placement="bottom-end"
                  overlay={
                    <Popover id="popover-ccl-menu" className={(darkMode && 'dark-theme') || ''} style={{ transition: 'none' }}>
                      <Popover.Body bsPrefix="popover-body">
                        <ButtonComponent
                          isLucid
                          size="medium"
                          variant="ghost"
                          fill="var(--icon-danger)"
                          leadingIcon="trash-2"
                          className="tw-text-text-danger"
                          onClick={handleOpenDeleteDialog(library)}
                          data-cy={`delete-library-${library.name}`}
                        >
                          Delete library
                        </ButtonComponent>
                      </Popover.Body>
                    </Popover>
                  }
                >
                  <ButtonComponent
                    isLucid
                    iconOnly
                    size="small"
                    variant="outline"
                    onClick={() => setPopoverToOpenId(popoverToOpenId === library.id ? null : library.id)}
                    className="tw-rounded-sm"
                    leadingIcon="ellipsis-vertical"
                  />
                </OverlayTrigger>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={!!deleteTarget}
        cancelBtnProps={{
          'data-cy': 'cancel-button',
          disabled: deleteInProgress,
          onClick: () => setDeleteTarget(null),
        }}
        submitActions={[
          {
            label: 'Delete library',
            variant: 'dangerPrimary',
            isLoading: deleteInProgress,
            'data-cy': 'delete-confirm',
            onClick: handleDelete,
          },
        ]}
        classes={{ dialogBody: 'tw-pb-0', dialogContent: 'tw-max-w-md' }}
      >
        <div className="tw-flex tw-flex-col tw-gap-0.5">
          <h6 data-cy="modal-header" className="tw-text-text-default tw-font-medium tw-text-xl">
            Delete library?
          </h6>

          <p data-cy="modal-description" className="tw-text-text-default tw-text-base tw-mb-0">
            Delete <span className="tw-font-semibold">{deleteTarget?.name}</span>? All published versions and dev
            uploads will be permanently removed. This cannot be undone.
          </p>
        </div>
      </Dialog>
    </div>
  );
}

function CustomComponentLibraryEmptyState() {
  return (
    <div className="tw-flex tw-flex-col tw-items-center tw-px-4 tw-py-10" data-cy="custom-component-library-empty">
      <div className="tw-flex tw-justify-center tw-items-center tw-size-8 tw-rounded-lg tw-bg-background-surface-layer-02 tw-mb-2">
        <VectorSquare size="20" color="var(--icon-default)" />
      </div>

      <p className="tw-font-medium tw-text-base tw-mb-0">No custom component library yet</p>

      <p className="tw-text-base tw-text-text-placeholder tw-mb-7 tw-text-center">
        Publish one to this workspace with the ToolJet CLI.
      </p>
    </div>
  );
}
