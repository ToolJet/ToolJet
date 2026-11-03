import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-bootstrap/Modal';
import { capitalize } from 'lodash';
import { useTranslation } from 'react-i18next';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { gitSyncService, authenticationService, tooljetDatabaseService } from '@/_services';
import { getPrivateRoute } from '@/_helpers/routes';
import { missingTablesFrom, promoteTablesOneUp } from './missingTables';
import { toast } from 'react-hot-toast';
import ArrowRight from '@/_ui/Icon/solidIcons/ArrowRight';
import '@/_styles/versions.scss';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import PromoteConfirmationExtras from './PromoteConfirmationExtras';

const PromoteConfirmationModal = React.memo(({ data, onClose, editingVersion }) => {
  const { moduleId } = useModuleContext();
  const [promotingEnvironment, setPromotingEnvironment] = useState(false);
  const [missingTables, setMissingTables] = useState(null);
  const [tablePromoteError, setTablePromoteError] = useState(null);
  const darkMode = localStorage.getItem('darkMode') === 'true' || false;
  const currentVersionId = useStore((state) => state.currentVersionId);
  const [showModal, setShow] = useState(data);
  const { t } = useTranslation();
  const { current_organization_id } = authenticationService.currentSessionValue;

  const { promoteAppVersionAction, selectedVersion, creationMode, versions, appId, releasedVersionId } = useStore(
    (state) => ({
      appId: state.appStore.modules[moduleId].app.appId,
      releasedVersionId: state.releasedVersionId,
      promoteAppVersionAction: state.promoteAppVersionAction,
      selectedVersion: state.selectedVersion,
      creationMode: state.appStore.modules[moduleId].app.creationMode,
      versions: state.developmentVersions || [],
    }),
    shallow
  );

  // Use editingVersion if provided, otherwise fall back to currentVersionId
  const versionIdToPromote = editingVersion || currentVersionId;

  // Find the version object to display the correct name
  const versionToPromote = versions.find((v) => v.id === versionIdToPromote) || selectedVersion;

  useEffect(() => {
    setShow(data);
  }, [data]);

  // A full-screen view opened from this dialog needs the focus and the Escape key.
  const overlayOpen = useStore((state) => state.isEditorOverlayOpen);

  const handleClose = useCallback(() => {
    if (promotingEnvironment) return;
    onClose();
    setShow(false);
  }, [promotingEnvironment, onClose]);

  const handleConfirm = () => {
    setPromotingEnvironment(true);

    promoteAppVersionAction(
      versionIdToPromote,
      async (response) => {
        toast.success(`${versionToPromote.name} has been promoted to ${data.target.name}!`);
        setPromotingEnvironment(false);
        onClose();

        {
          /* Can clean when autoCommit is removed completely */
        }
        // if (
        //   data?.current?.name == 'development' &&
        //   (creationMode !== 'GIT' || (creationMode === 'GIT' && allowAppEdit))
        // ) {
        //   try {
        //     const gitData = await gitSyncService.getAppConfig(current_organization_id, versionToPromote?.id);
        //     const appGit = gitData?.app_git;
        //     if (appGit && appGit?.org_git?.auto_commit) {
        //       const body = {
        //         gitAppName: appGit?.git_app_name,
        //         versionId: versionToPromote?.id,
        //         lastCommitMessage: ` ${versionToPromote.name} Version of app ${appGit?.git_app_name} promoted from development to staging`,
        //         gitVersionName: versionToPromote?.name,
        //         allowMasterPush: true,
        //       };
        //       await gitSyncService.gitPush(body, appGit?.id, versionToPromote?.id);
        //       toast.success('Changes committed successfully');
        //     }
        //   } catch (err) {
        //     const status = err?.statusCode;
        //     const error = err?.error;
        //     if (
        //       !(status === 404 && error === 'Git Configuration not found') &&
        //       !(error === 'No Git Provider is enabled for the workspace')
        //     ) {
        //       toast.error(error, {
        //         style: {
        //           width: 'auto',
        //           maxWidth: '339px',
        //         },
        //       });
        //     }
        //   }
        // }

        // setSelectedEnvironment(response);
        // set env id here-----> state update
        // appEnvironmentChanged(response, true);
        setPromotingEnvironment(false);
        onClose();
      },
      (error) => {
        const tables = missingTablesFrom(error);
        if (tables?.length) {
          // Shown in the dialog with a way through, not as a toast that is gone before it is read.
          setMissingTables(tables);
          setTablePromoteError(null);
          setPromotingEnvironment(false);
          return;
        }
        const rawError = error?.error || error?.message;
        const errorMessage =
          typeof rawError === 'object'
            ? rawError.error
            : rawError || `${versionToPromote.name} could not be promoted to ${data.target.name}. Please try again!`;
        const errorDetails = typeof rawError === 'object' ? rawError.details : errorMessage;
        toast.error(errorMessage);
        useStore.getState().debugger.log({
          logLevel: 'error',
          type: 'component',
          key: 'Promote Failed',
          message: errorMessage,
          description: errorDetails || errorMessage,
          error: { message: errorMessage, description: errorDetails || errorMessage },
          errorTarget: 'Version',
          timestamp: new Date().toISOString(),
        });
        setPromotingEnvironment(false);
      },
      moduleId
    );
  };

  const handlePromoteTablesAndApp = async () => {
    setPromotingEnvironment(true);
    setTablePromoteError(null);
    const failed = await promoteTablesOneUp(
      tooljetDatabaseService.promoteTable,
      current_organization_id,
      missingTables,
      data?.current?.id
    );
    if (failed) {
      setTablePromoteError(failed);
      setPromotingEnvironment(false);
      return;
    }
    setMissingTables(null);
    handleConfirm();
  };

  if (!versionToPromote) return null;

  return (
    <Modal
      show={showModal}
      onHide={handleClose}
      enforceFocus={!overlayOpen}
      keyboard={!overlayOpen}
      size="sm"
      animation={false}
      centered={true}
      contentClassName={`promote-confirm-dialogue-modal ${darkMode ? 'dark-theme' : ''}`}
    >
      <Modal.Header>
        <Modal.Title className={`confirmation-header ${darkMode ? 'dark-theme' : ''}`} data-cy="modal-title">
          Promote {versionToPromote.name}
        </Modal.Title>
        <svg
          onClick={handleClose}
          className="cursor-pointer"
          width="33"
          height="33"
          viewBox="0 0 33 33"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          data-cy="close-button"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M11.5996 11.6201C11.8599 11.3597 12.282 11.3597 12.5424 11.6201L16.071 15.1487L19.5996 11.6201C19.8599 11.3597 20.282 11.3597 20.5424 11.6201C20.8027 11.8804 20.8027 12.3025 20.5424 12.5629L17.0138 16.0915L20.5424 19.6201C20.8027 19.8804 20.8027 20.3025 20.5424 20.5629C20.282 20.8232 19.8599 20.8232 19.5996 20.5629L16.071 17.0343L12.5424 20.5629C12.282 20.8232 11.8599 20.8232 11.5996 20.5629C11.3392 20.3025 11.3392 19.8804 11.5996 19.6201L15.1282 16.0915L11.5996 12.5629C11.3392 12.3025 11.3392 11.8804 11.5996 11.6201Z"
            fill={`var(--slate12)`}
          />
        </svg>
      </Modal.Header>

      <Modal.Body className="env-confirm-dialogue-body">
        <div className={`change-info ${darkMode ? 'theme-dark' : ''}`}>
          <div className="section">
            <div className="label" data-cy="from-label">
              FROM
            </div>
            <div className="env-name" data-cy="current-env-name">
              {capitalize(data?.current?.name)}
            </div>
          </div>
          <div className="arrow-container">
            <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M0.942841 0.344988C0.673302 0.560619 0.629601 0.953927 0.845232 1.22347L3.86622 4.9997L0.845232 8.77593C0.629601 9.04547 0.673301 9.43878 0.94284 9.65441C1.21238 9.87004 1.60569 9.82634 1.82132 9.5568L5.15465 5.39013C5.33726 5.16187 5.33726 4.83753 5.15465 4.60926L1.82132 0.442596C1.60569 0.173058 1.21238 0.129357 0.942841 0.344988Z"
                fill="#11181C"
              />
            </svg>
          </div>
          <div className="section">
            <div className="label" data-cy="to-label">
              TO
            </div>
            <div className="env-name" data-cy="target-env-name">
              {capitalize(data?.target?.name)}
            </div>
          </div>
        </div>
        {data?.current?.name === 'development' && (
          <div className="env-change-info" data-cy="env-change-info-text">
            {/* You won&apos;t be able to edit this version after promotion. Are you sure you want to continue? */}
            This version will be pushed to Staging. Are you sure you are done editing the current version?
          </div>
        )}
        <PromoteConfirmationExtras
          show={!!showModal}
          appId={appId}
          versionId={versionIdToPromote}
          targetEnvironment={data?.target}
          releasedVersionId={releasedVersionId}
        />
        {missingTables?.length > 0 && (
          <div className="promote-missing-tables" role="alert" data-cy="promote-missing-tables">
            <div className="promote-missing-tables__title">
              {missingTables.length === 1
                ? `1 ToolJet Database table isn't in ${capitalize(data?.target?.name)} yet`
                : `${missingTables.length} ToolJet Database tables aren't in ${capitalize(data?.target?.name)} yet`}
            </div>
            <div className="promote-missing-tables__names" data-cy="promote-missing-table-names">
              {missingTables.map((table) => table.name).join(', ')}
            </div>
            <div className="promote-missing-tables__help">
              The app reads them there. Promoting the tables copies their structure to{' '}
              {capitalize(data?.target?.name)}, without any rows, and then promotes the app.{' '}
              <a href={getPrivateRoute('database')} target="_blank" rel="noreferrer" data-cy="open-tooljet-database">
                Open ToolJet Database
              </a>
            </div>
            {tablePromoteError && (
              <div className="promote-missing-tables__error" data-cy="promote-table-error">
                Couldn't promote {tablePromoteError.name}: {tablePromoteError.reason}
              </div>
            )}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="mt-3 env-modal-footer">
        <ButtonSolid variant="tertiary" onClick={handleClose} data-cy="cancel-button">
          {t('globals.cancel', 'Cancel')}
        </ButtonSolid>
        <ButtonSolid
          variant="primary"
          onClick={missingTables?.length ? handlePromoteTablesAndApp : handleConfirm}
          isLoading={promotingEnvironment}
          data-cy="promote-button"
        >
          {missingTables?.length ? 'Promote tables and app' : 'Promote'}
          <span style={{ marginTop: '2px' }}>
            <ArrowRight fill="#FDFDFE" width="22" />
          </span>
        </ButtonSolid>
      </Modal.Footer>
    </Modal>
  );
});

export default PromoteConfirmationModal;
