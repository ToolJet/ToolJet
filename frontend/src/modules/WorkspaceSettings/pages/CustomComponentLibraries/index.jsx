import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import ModalBase from '@/_ui/Modal';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import TablerIcon from '@/_ui/Icon/TablerIcon';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/Rocket/shadcn/dropdown-menu';
import { customComponentLibrariesService } from '@/_services/customComponentLibraries.service';
import './custom-component-libraries.styles.scss';

export default function CustomComponentLibraries({ darkMode }) {
  const [libraries, setLibraries] = useState(null); // null = loading
  const [loadFailed, setLoadFailed] = useState(false); // failed fetch ≠ empty list
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

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

  return (
    <div className="custom-component-libraries-page" data-cy="custom-component-libraries-page">
      <div className="libraries-count" data-cy="libraries-count">
        {libraries === null ? '' : `${libraries.length} ${libraries.length === 1 ? 'library' : 'libraries'}`}
      </div>

      <div className="libraries-card">
        <div className="libraries-table-header">
          <div className="col-name">Name</div>
          <div className="col-version">Latest version</div>
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="library-kebab-btn" data-cy={`library-menu-${library.name}`}>
                      <TablerIcon iconName="IconDotsVertical" style={{ width: 12, height: 12 }} stroke={1.5} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="library-kebab-menu">
                    <DropdownMenuItem
                      className="library-kebab-delete"
                      onSelect={() => setDeleteTarget(library)}
                      data-cy={`delete-library-${library.name}`}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
            <ButtonSolid variant="tertiary" size="sm" onClick={() => setDeleteTarget(null)} data-cy="delete-cancel">
              Cancel
            </ButtonSolid>
            <ButtonSolid
              variant="dangerPrimary"
              size="sm"
              onClick={handleDelete}
              isLoading={deleteInProgress}
              data-cy="delete-confirm"
            >
              Delete library
            </ButtonSolid>
          </div>
        </div>
      </ModalBase>
    </div>
  );
}
