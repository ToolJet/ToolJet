import React, { useCallback, useEffect, useRef, useState } from 'react';
import moment from 'moment';
import { toast } from 'react-hot-toast';
import cx from 'classnames';
import { dataqueryService } from '@/_services';
import { IconTrash } from '@tabler/icons-react';
import { ToolTip, ConfirmDialog } from '@/_components';
import { Button } from '@/components/ui/Button/Button';
import useStore from '@/AppBuilder/_stores/store';

export default function LibraryVersionBar({ queryId, versionId, darkMode }) {
  const [entry, setEntry] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState(null);
  const isUpdating = useStore((state) => state.dataQuery.isUpdatingQueryInProcess);
  // saveData is throttled; an edit that is saving (or queued behind a save) has a key here.
  const hasPendingSave = useStore((state) => Object.keys(state.dataQuery.queryUpdates ?? {}).length > 0);
  const wasUpdating = useRef(false);
  const requestId = useRef(0);

  // Latest request wins, so a slow earlier response can't overwrite a newer one.
  const refresh = useCallback(() => {
    const current = ++requestId.current;
    return dataqueryService
      .getLibraryCatalog(versionId)
      .then(({ queries = [] }) => {
        if (current !== requestId.current) return;
        setLoadFailed(false);
        setEntry(queries.find((query) => query.id === queryId) ?? null);
      })
      .catch(() => {
        if (current !== requestId.current) return;
        setEntry(null);
        setLoadFailed(true);
      });
  }, [versionId, queryId]);

  useEffect(() => {
    setEntry(null);
    setLoadFailed(false);
    refresh();
  }, [refresh]);

  // A saved edit changes whether the draft still matches the latest version.
  useEffect(() => {
    if (wasUpdating.current && !isUpdating) refresh();
    wasUpdating.current = isUpdating;
  }, [isUpdating, refresh]);

  const release = async () => {
    setIsReleasing(true);
    try {
      // A throttled save can still be waiting for its trailing call: send it now and wait, so the snapshot
      // is the draft the user sees.
      const { saveData } = useStore.getState().dataQuery;
      saveData.flush?.();
      // A failed save means the server still has the old draft: release nothing.
      try {
        await useStore.getState().dataQuery.queryUpdates[queryId];
      } catch {
        toast.error('Save the query before releasing');
        return;
      }
      const released = await dataqueryService.releaseLibraryQuery(queryId, versionId);
      toast.success(`Released v${released.versionNumber}`);
      await refresh();
    } catch (err) {
      toast.error(typeof err?.error === 'string' ? err.error : 'Could not release this query');
    } finally {
      setIsReleasing(false);
    }
  };

  const deleteVersion = async () => {
    const target = versionToDelete;
    setVersionToDelete(null);
    try {
      await dataqueryService.deleteLibraryQueryVersion(queryId, versionId, target.id);
      await refresh();
    } catch (err) {
      toast.error(typeof err?.error === 'string' ? err.error : `Could not delete ${target.name}`);
    }
  };

  if (loadFailed) {
    return (
      <div className="tw-py-2 tw-font-body-small tw-text-text-placeholder" data-cy="library-version-bar">
        Couldn&apos;t load versions
      </div>
    );
  }
  if (!entry) return null;

  const versions = entry.versions ?? [];
  const latest = versions[0];
  // The server always sends nextVersionNumber (it counts deleted versions); the fallback only avoids a broken label.
  const nextNumber = entry.nextVersionNumber ?? (latest ? Number(String(latest.name).replace(/^v/, '')) + 1 : 1);
  const matchesLatest = !!latest && !!entry.draft?.matchesLatestVersion;

  return (
    <div
      className={cx('tw-flex tw-items-center tw-gap-3 tw-py-2', { 'theme-dark': darkMode })}
      data-cy="library-version-bar"
    >
      <ul className="tw-flex tw-flex-1 tw-min-w-0 tw-gap-3 tw-overflow-x-auto tw-m-0 tw-p-0 tw-list-none tw-font-body-small tw-text-text-placeholder">
        {versions.map((version) => (
          <li key={version.id} className="tw-whitespace-nowrap">
            <span data-testid="library-version-name" className="tw-text-text-default">
              {version.name}
            </span>
            <span> · {moment(version.createdAt).format('MMM D, YYYY')}</span>
            <ToolTip message={`Delete ${version.name}`} placement="bottom">
              <button
                type="button"
                className="tw-ml-1 tw-rounded tw-border-0 tw-bg-transparent tw-p-1 tw-align-middle tw-text-text-placeholder hover:tw-bg-interactive-hover hover:tw-text-text-danger focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-interactive-focus-outline"
                aria-label={`Delete ${version.name}`}
                onClick={() => setVersionToDelete(version)}
                data-cy={`library-version-delete-${version.name}`}
              >
                <IconTrash size={14} stroke={1.5} />
              </button>
            </ToolTip>
          </li>
        ))}
      </ul>
      <ToolTip message={`Nothing changed since ${latest?.name}`} show={matchesLatest} placement="bottom">
        <span>
          <Button
            size="medium"
            variant="primary"
            onClick={release}
            disabled={isUpdating || hasPendingSave || isReleasing || matchesLatest}
            isLoading={isReleasing}
            data-cy="library-release-button"
          >
            {`Release v${nextNumber}`}
          </Button>
        </span>
      </ToolTip>
      <ConfirmDialog
        show={!!versionToDelete}
        title="Delete version"
        message={`Delete ${versionToDelete?.name}? Apps can't pin it after this.`}
        onConfirm={deleteVersion}
        onCancel={() => setVersionToDelete(null)}
        confirmButtonText="Delete"
        cancelButtonType="tertiary"
        darkMode={darkMode}
      />
    </div>
  );
}
