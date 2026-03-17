import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import moment from 'moment';

import CheckboxComponent from '@/components/ui/Checkbox/Index';

import {
  downloadExportedData,
  useExportApp,
  useFetchAppByVersion,
  useFetchAppTables,
  useFetchAppVersions,
} from '../hooks/appsServiceHooks';

import ActionDialog from '../ActionDialog';

export default function ExportAppModal({ open, onClose, appDetails }) {
  const [selectedVersionId, setSelectedVersionId] = useState(null);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [exportTJDBSchema, setExportTJDBSchema] = useState(true);

  const appType = appDetails?.type;

  const {
    data: versions,
    isFetching: isFetchingAppVersions,
    isError: isErrorInFetchingAppVersions,
  } = useFetchAppVersions(open ? appDetails?.id : null);
  const {
    data: allTables,
    isFetching: isFetchingAppTables,
    isError: isErrorInFetchingAppTables,
  } = useFetchAppTables(open ? appDetails?.id : null);
  const {
    data: appByVersion,
    isFetching: isFetchingAppByVersion,
    isError: isErrorInFetchingAppByVersion,
  } = useFetchAppByVersion(open ? appDetails?.id : null, selectedVersionId);

  const { mutate: exportApp, isPending: isExportingApp } = useExportApp();

  const handleCloseDialog = () => {
    onClose();
  };

  const handleChangeSelectedVersion = (newVersionId) => () => {
    if (newVersionId === selectedVersionId) return;

    setSelectedVersionId(newVersionId);
  };

  const handleToggleExportTJDBSchema = () => {
    setExportTJDBSchema((prev) => !prev);
  };

  const handleExportApp = (versionToExport, tables) => {
    const requestBody = {
      app: [
        {
          id: appDetails.appId || appDetails?.id,
          ...(versionToExport && { search_params: { version_id: versionToExport } }),
        },
      ],
      ...(exportTJDBSchema && { tooljet_database: tables }),
      organization_id: appDetails.organization_id || appDetails.organizationId,
    };

    exportApp(
      { requestBody, appType },
      {
        onError: (error) => {
          toast.error(`Could not export ${appType === 'module' ? 'module' : 'app'}: ${error?.data?.message}`, {
            position: 'top-center',
          });

          handleCloseDialog();
        },
        onSuccess: (data) => {
          const appName = (appDetails.appName || appDetails.name).replace(/\s+/g, '-').toLowerCase();
          const fileName = `${appName}-export-${new Date().getTime()}`;

          downloadExportedData(data, fileName);

          toast.success(`${appType === 'module' ? 'Module' : 'App'} has been exported successfully!`);

          handleCloseDialog();
        },
      }
    );
  };

  useEffect(() => {
    if (!versions?.versions) return;

    const currentEditingVersion = versions.versions.filter((version) => version.isCurrentEditingVersion)?.[0] ?? null;

    if (currentEditingVersion) {
      setSelectedVersionId(currentEditingVersion.id);
      setCurrentVersion(currentEditingVersion);
    }
  }, [versions]);

  useEffect(() => {
    if (appType === 'module' && open && allTables && currentVersion) {
      handleExportApp(null, allTables);
    }
  }, [appType, open, allTables, currentVersion]);

  useEffect(() => {
    if (isErrorInFetchingAppVersions || isErrorInFetchingAppTables) {
      toast.error('Could not fetch the versions.', { position: 'top-center' });
      handleCloseDialog();
      return;
    }

    if (isErrorInFetchingAppByVersion) {
      toast.error('Could not fetch the tables.', { position: 'top-center' });
      handleCloseDialog();
      return;
    }
  }, [isErrorInFetchingAppVersions, isErrorInFetchingAppTables, isErrorInFetchingAppByVersion]);

  const isFormBeingSubmitted = isExportingApp;
  const isCancelBtnDisabled = isFormBeingSubmitted || isFetchingAppVersions || isFetchingAppTables;
  const isSubmitBtnDisabled = isFormBeingSubmitted || isFetchingAppVersions || isFetchingAppTables;

  // Don't render modal for modules - they auto-export
  if (appType === 'module') {
    return null;
  }

  return (
    <ActionDialog
      open={open}
      title="Select a version to export"
      cancelBtnProps={{ 'data-cy': 'modal-close-button', disabled: isCancelBtnDisabled, onClick: handleCloseDialog }}
      submitActions={[
        {
          label: 'Export all',
          variant: 'secondary',
          disabled: isSubmitBtnDisabled,
          isLoading: isFormBeingSubmitted,
          'data-cy': 'export-all-button',
          onClick: () => handleExportApp(null, allTables),
        },
        {
          label: 'Export selected version',
          disabled: isSubmitBtnDisabled,
          isLoading: isFetchingAppByVersion,
          'data-cy': 'export-selected-version-button',
          onClick: () => handleExportApp(selectedVersionId, appByVersion),
        },
      ]}
      classes={{
        dialogContent: 'tw-max-w-full tw-w-[30.5rem]',
        dialogBody: 'tw-p-0',
        dialogFooter: 'tw-border-t tw-border-border-weak',
      }}
    >
      {isFetchingAppVersions || isFetchingAppTables ? (
        <div className="tw-flex tw-items-center tw-justify-center tw-h-96">
          <p className="tw-font-body-large tw-text-text-placeholder">Loading versions...</p>
        </div>
      ) : (
        <div>
          <div className="tw-px-6 tw-py-4 tw-space-y-4 tw-h-96 tw-overflow-y-auto">
            <p className="tw-font-title-large tw-text-text-default" data-cy="current-version-label">
              Current version
            </p>

            <VersionItem
              name={currentVersion?.name}
              isChecked={selectedVersionId === currentVersion?.id}
              createdAt={currentVersion?.created_at || currentVersion?.createdAt}
              onCheckedChange={handleChangeSelectedVersion(currentVersion?.id)}
            />

            {versions?.length > 1 ? (
              <>
                <p className="tw-font-title-large tw-text-text-default" data-cy="other-version-label">
                  Older versions
                </p>

                <div className="tw-space-y-3">
                  {versions.map((version) => {
                    if (version.id !== currentVersion?.id) {
                      return (
                        <VersionItem
                          key={version.id}
                          name={version.name}
                          isChecked={selectedVersionId === version.id}
                          createdAt={version.createdAt || version.created_at}
                          onCheckedChange={handleChangeSelectedVersion(version.id)}
                        />
                      );
                    }
                  })}
                </div>
              </>
            ) : (
              <p className="tw-font-body-large tw-text-text-placeholder" data-cy="no-other-versions-found-text">
                No other versions found
              </p>
            )}
          </div>

          <div className="tw-border-t tw-border-border-weak tw-px-6 tw-py-4">
            <CheckboxComponent
              label="Export ToolJet table schema"
              checked={exportTJDBSchema}
              onCheckedChange={handleToggleExportTJDBSchema}
              classes={{ checkboxLabel: 'tw-text-text-default tw-font-title-default' }}
            />
          </div>
        </div>
      )}
    </ActionDialog>
  );
}

const versionItemClasses = {
  checkboxLabel: 'tw-text-text-default tw-font-title-default',
  helperText: 'tw-text-text-placeholder tw-font-body-default',
};

function VersionItem({ name, createdAt, isChecked, onCheckedChange }) {
  const createdOnText = createdAt ? `Created on ${moment(createdAt).format('Do MMM YYYY')}` : '';

  return (
    <CheckboxComponent
      type="radio"
      label={name}
      checked={isChecked}
      helper={createdOnText}
      classes={versionItemClasses}
      onCheckedChange={onCheckedChange}
      data-cy={`${String(name).toLowerCase().replace(/\s+/g, '-')}-version-wrapper`}
    />
  );
}
