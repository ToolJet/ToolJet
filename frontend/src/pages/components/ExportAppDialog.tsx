import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import moment from 'moment';

import {
  downloadExportedData,
  useExportApp,
  useFetchAppByVersion,
  useFetchAppTables,
  useFetchAppVersions,
} from '@/_services/hooks/appsServiceHooks';
import { authenticationService } from '@/_services/authentication.service';
import CheckboxComponent from '@/components/ui/Checkbox/Index';

import ActionDialog from '@/pages/AppsDashboard/components/ActionDialog';

import type { IAppDetails, IAppVersion } from '@/_stores/types/appsStore';
import { type TAppType } from '@/pages/AppsDashboard/helper';

export default function ExportAppDialog({ open, onClose, appDetails, appType }: IExportAppModalProps) {
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState<IAppVersion | null>(null);
  const [exportTJDBSchema, setExportTJDBSchema] = useState(true);

  const derivedAppType = appType ?? appDetails?.type;
  const appId = appDetails?.appId || appDetails?.id;
  const currentOrganizationId = authenticationService.currentSessionValue?.current_organization_id;

  const {
    data: versions,
    isFetching: isFetchingAppVersions,
    isError: isErrorInFetchingAppVersions,
  } = useFetchAppVersions(appId, { enabled: Boolean(appId) });
  const {
    data: allTables,
    isFetching: isFetchingAppTables,
    isError: isErrorInFetchingAppTables,
  } = useFetchAppTables(appId);
  const {
    data: appByVersion,
    isFetching: isFetchingAppByVersion,
    isError: isErrorInFetchingAppByVersion,
  } = useFetchAppByVersion(appId, selectedVersionId);

  const { mutate: exportApp, isPending: isExportingApp } = useExportApp();

  const handleCloseDialog = () => {
    onClose();
  };

  const handleChangeSelectedVersion = (newVersionId?: string) => () => {
    if (!newVersionId || newVersionId === selectedVersionId) return;

    setSelectedVersionId(newVersionId);
  };

  const handleToggleExportTJDBSchema = () => {
    setExportTJDBSchema((prev) => !prev);
  };

  const handleExportApp = (versionToExport: string | null, tables?: ITableRef[]) => {
    const requestBody = {
      app: [
        {
          id: appId,
          ...(versionToExport && { search_params: { version_id: versionToExport } }),
        },
      ],
      ...(exportTJDBSchema && { tooljet_database: tables }),
      organization_id: appDetails.organization_id || appDetails.organizationId || currentOrganizationId,
    };

    exportApp(
      { requestBody, appType: derivedAppType },
      {
        onError: (error) => {
          toast.error(
            `Could not export ${derivedAppType === 'module' ? 'module' : 'app'}: ${(error as IApiError)?.data?.message}`,
            {
              position: 'top-center',
            }
          );

          handleCloseDialog();
        },
        onSuccess: (data) => {
          const appName = (appDetails.appName || appDetails.name)?.replace(/\s+/g, '-');
          const fileName = `${appName}-export-${new Date().getTime()}`;

          downloadExportedData(data, fileName);

          toast.success(`${derivedAppType === 'module' ? 'Module' : 'App'} has been exported successfully!`);

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
    // auto-export module
    if (derivedAppType === 'module' && open && allTables && currentVersion) {
      handleExportApp(null, allTables);
    }
  }, [derivedAppType, open, allTables, currentVersion]);

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
  // The selected version's tables arrive asynchronously; exporting earlier would omit them.
  const isExportSelectedBtnDisabled = isSubmitBtnDisabled || isFetchingAppByVersion;
  const allVersions = versions?.versions ?? [];

  // Don't render modal for modules - they auto-export
  if (derivedAppType === 'module') {
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
          disabled: isExportSelectedBtnDisabled,
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
          <div className="tw-px-6 tw-py-4 tw-space-y-4 tw-h-96 tw-overflow-y-auto tw-hide-scrollbar">
            <p className="tw-font-title-large tw-text-text-default" data-cy="current-version-label">
              Current version
            </p>
            <div data-cy="current-version-section">
              <VersionItem
                name={getVersionDisplayName(currentVersion)}
                isChecked={selectedVersionId === currentVersion?.id}
                createdAt={currentVersion?.created_at || currentVersion?.createdAt}
                onCheckedChange={handleChangeSelectedVersion(currentVersion?.id)}
              />
            </div>
            <div data-cy="other-version-section">
              {allVersions.length > 1 ? (
                <>
                  <p className="tw-font-title-large tw-text-text-default" data-cy="other-version-label">
                    Older versions
                  </p>

                  <div className="tw-space-y-3" data-cy="older-version-list">
                    {allVersions
                      .filter((version) => version.id !== currentVersion?.id)
                      .map((version) => (
                        <VersionItem
                          key={version.id}
                          name={getVersionDisplayName(version)}
                          isChecked={selectedVersionId === version.id}
                          createdAt={version.createdAt || version.created_at}
                          onCheckedChange={handleChangeSelectedVersion(version.id)}
                        />
                      ))}
                  </div>
                </>
              ) : (
                <p className="tw-font-body-large tw-text-text-placeholder" data-cy="no-other-versions-found-text">
                  No other versions found
                </p>
              )}
            </div>
          </div>

          <div className="tw-border-0 tw-border-t tw-border-solid tw-border-border-weak tw-px-6 tw-py-4">
            <CheckboxComponent
              label="Export ToolJet table schema"
              checked={exportTJDBSchema}
              onCheckedChange={handleToggleExportTJDBSchema}
              classes={{ checkboxLabel: 'tw-text-text-default tw-font-title-default' }}
              data-cy="export-tooljet-table-schema-checkbox"
            />
          </div>
        </div>
      )}
    </ActionDialog>
  );
}

const getVersionDisplayName = (version: IAppVersion | null) =>
  version?.display_name || version?.displayName || version?.name || '';

const versionItemClasses = {
  checkboxLabel: 'tw-text-text-default tw-font-title-default',
  helperText: 'tw-text-text-placeholder tw-font-body-default',
};

function VersionItem({ name, createdAt, isChecked, onCheckedChange }: IVersionItemProps) {
  const createdOnText = createdAt ? `Created on ${moment(createdAt).format('Do MMM YYYY')}` : '';

  return (
    <CheckboxComponent
      type="radio"
      label={name}
      checked={isChecked}
      helper={createdOnText}
      classes={versionItemClasses}
      onCheckedChange={onCheckedChange}
      data-cy={`${String(name).toLowerCase().replace(/\s+/g, '-')}-radio-button`}
    />
  );
}

interface IExportAppModalProps {
  open: boolean;
  onClose: () => void;
  appType?: TAppType;
  appDetails: IAppDetails & {
    // Additional optional properties, may be received from App Builder
    appId?: string;
    appName?: string;
    organization_id?: string;
    organizationId?: string;
    type?: TAppType;
  };
}

interface IVersionItemProps {
  name: string;
  createdAt?: string;
  isChecked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

interface ITableRef {
  table_id: string;
}

// The service layer rejects with the parsed response body on `data`.
interface IApiError extends Error {
  data?: { message?: string };
}
