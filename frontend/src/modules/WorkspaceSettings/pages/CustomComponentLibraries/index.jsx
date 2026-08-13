import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

import ModalBase from '@/_ui/Modal';
import { Button } from '@/components/ui/Button/Button';
import { customComponentLibrariesService } from '@/_services/customComponentLibraries.service';

import './custom-component-libraries.styles.scss';

export default function CustomComponentLibraries({ darkMode }) {
  const [libraries, setLibraries] = useState(null); // null = loading
  const [loadFailed, setLoadFailed] = useState(false); // failed fetch ≠ empty list
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [popoverToOpenId, setPopoverToOpenId] = useState(null);

  const fetchLibraries = () => {
    setLoadFailed(false);
    customComponentLibrariesService
      .list()
      .then((res) => setLibraries(Array.isArray(res) ? res : []))
      .catch(() => {
        setLibraries([]);
        setLoadFailed(true);
      });
  };

  useEffect(fetchLibraries, []);

  const handleDelete = async () => {
    setDeleteInProgress(true);
    try {
      await customComponentLibrariesService.deleteLibrary(deleteTarget.id);
      toast.success('Library deleted', { duration: 2000 });
      setDeleteTarget(null);
      fetchLibraries();
    } catch (error) {
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

  const handleOpenDeleteDialog = (library) => () => {
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
              <button type="button" className="libraries-retry-link" onClick={fetchLibraries}>
                Retry
              </button>
            </p>
          </div>
        ) : libraries.length === 0 ? (
          <div className="libraries-empty" data-cy="libraries-empty">
            <p className="libraries-empty-title">No custom component libraries yet</p>
            <p className="libraries-empty-subtitle">Publish one to this workspace with the ToolJet CLI.</p>
          </div>
        ) : (
          <div className="libraries-table-body" data-cy="libraries-table">
            {libraries.map((library) => (
              <div className="libraries-row" key={library.id} data-cy={`library-row-${library.name}`}>
                <div className="col-name">{library.name}</div>
                <div className="col-version">{library.revisions[0]?.version ?? '—'}</div>

                <OverlayTrigger
                  rootClose
                  show={popoverToOpenId === library.id}
                  trigger="click"
                  placement="bottom-end"
                  overlay={
                    <Popover id="popover-ccl-menu" className={darkMode && 'dark-theme'} style={{ transition: 'none' }}>
                      <Popover.Body bsPrefix="popover-body">
                        <Button
                          isLucid
                          size="medium"
                          variant="ghost"
                          fill="#E54D2E"
                          leadingIcon="trash-2"
                          className="tw-text-[#E54D2E]"
                          onClick={handleOpenDeleteDialog(library)}
                          data-cy={`delete-library-${library.name}`}
                        >
                          Delete library
                        </Button>
                      </Popover.Body>
                    </Popover>
                  }
                >
                  <Button
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

      <ModalBase
        show={!!deleteTarget}
        handleClose={() => setDeleteTarget(null)}
        darkMode={darkMode}
        title="Delete library"
        className="library-delete-modal"
        showFooter={false}
      >
        <div className="library-delete-confirm">
          <p>
            Delete <strong>{deleteTarget?.name}</strong>? All published versions and dev uploads will be permanently
            removed. This cannot be undone.
          </p>

          <div className="library-delete-modal-footer">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} data-cy="delete-cancel">
              Cancel
            </Button>

            <Button
              variant="dangerPrimary"
              onClick={handleDelete}
              isLoading={deleteInProgress}
              data-cy="delete-confirm"
            >
              Delete library
            </Button>
          </div>
        </div>
      </ModalBase>
    </div>
  );
}
