import React, { useState } from 'react';
import Icon from '@/_ui/Icon/solidIcons/index';
import { OverlayTrigger } from 'react-bootstrap';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { useAppInfo } from '@/_stores/appDataStore';
import { AppVersionsManager } from '@/Editor/AppVersionsManager/AppVersionsManager';
import { noop } from 'lodash';
import HeaderActions from '@/Editor/Header/HeaderActions';
import Navbar from 'react-bootstrap/Navbar';
import Offcanvas from 'react-bootstrap/Offcanvas';
import 'bootstrap/dist/css/bootstrap.min.css';
import classNames from 'classnames';
import { shallow } from 'zustand/shallow';
import { useEditorStore } from '@/_stores/editorStore';
import Cross from '@/_ui/Icon/solidIcons/Cross';
import { checkIfLicenseNotValid } from '@/_helpers/appUtils';
import EnvironmentManager from '@/Editor/Header/EnvironmentManager';
import { useAppType } from '@/AppBuilder/_contexts/ModuleContext';

const PreviewSettings = ({
  isMobileLayout,
  onAppEnvironmentChanged,
  setAppDefinitionFromVersion,
  showHeader,
  darkMode,
}) => {
  const { appType } = useAppType();
  const { featureAccess, currentAppEnvironment, setCurrentAppEnvironmentId } = useEditorStore(
    (state) => ({
      featureAccess: state?.featureAccess,
      currentAppEnvironment: state?.currentAppEnvironment,
      setCurrentAppEnvironmentId: state?.actions?.setCurrentAppEnvironmentId,
    }),
    shallow
  );
  const { editingVersion } = useAppVersionStore(
    (state) => ({
      editingVersion: state?.editingVersion,
    }),
    shallow
  );
  const { appId, isPublic, environments, creationMode } = useAppInfo();
  const isLicenseNotValid = checkIfLicenseNotValid();

  const [previewNavbar, togglePreviewNavbar] = useState(false);

  const _renderAppVersionsManager = () => {
    return (
      <AppVersionsManager
        appId={appId}
        setAppDefinitionFromVersion={(data) => {
          togglePreviewNavbar(false);
          setAppDefinitionFromVersion(data);
        }}
        onVersionDelete={noop}
        environments={environments}
        currentEnvironment={currentAppEnvironment}
        setCurrentEnvironment={setCurrentAppEnvironmentId}
        isPublic={isPublic ?? false}
        appCreationMode={creationMode}
        isEditable={false}
        isViewer
        darkMode={darkMode}
      />
    );
  };

  const _renderEnvironmentManager = () => {
    return (
      <EnvironmentManager
        appEnvironmentChanged={(currentEnvironment, envSelection) => {
          togglePreviewNavbar(false);
          onAppEnvironmentChanged(currentEnvironment, envSelection);
        }}
        environments={environments}
        multiEnvironmentEnabled={featureAccess?.multiEnvironment}
        setCurrentEnvironment={setCurrentAppEnvironmentId}
        setCurrentAppVersionPromoted={noop}
        licenseValid={!isLicenseNotValid}
        isViewer
      />
    );
  };

  const _renderOverlay = () => (
    <div className={classNames({ 'dark-theme theme-dark': darkMode })} style={{ borderRadius: '6px' }}>
      <div className="preview-settings-overlay" style={{ borderColor: darkMode ? '#2B3036' : '#E4E7EB' }}>
        <span className="preview-settings-text">Preview settings</span>
        <span>{editingVersion && appType !== 'module' && _renderAppVersionsManager()}</span>
        <div className="navbar-seperator"></div>
        <span>{editingVersion && appType !== 'module' && _renderEnvironmentManager()}</span>
        <span>
          <HeaderActions showToggleLayoutBtn darkMode={darkMode} />
        </span>
      </div>
    </div>
  );

  if (isMobileLayout) {
    return (
      <Navbar
        key={'viewer-preview-navbar'}
        expand={false}
        expanded={previewNavbar}
        onToggle={(show) => togglePreviewNavbar(show)}
        as={(props) => {
          return <div>{props.children}</div>;
        }}
      >
        <Navbar.Toggle
          as={(props) => {
            return (
              <div
                className="released-version-no-header-mbl-preview"
                style={{ backgroundColor: 'var(--slate5)', top: '7px', left: showHeader ? '61%' : '41%' }}
              >
                <span
                  style={{
                    color: 'var(--slate12)',
                  }}
                  className="preview-chip"
                >
                  Preview
                </span>
                <span
                  style={{
                    marginLeft: '12px',
                    cursor: 'pointer',
                  }}
                  onClick={props.onClick}
                >
                  <Icon name={'settings'} height={12} width={12} fill={'#889099'} />
                </span>
              </div>
            );
          }}
        />
        <Navbar.Offcanvas placement="top" className={classNames({ 'dark-theme theme-dark': darkMode })}>
          <Offcanvas.Header>
            <Offcanvas.Title>Preview settings</Offcanvas.Title>
            <div onClick={() => togglePreviewNavbar(false)} className="cursor-pointer">
              <Cross fill={'var(--slate12)'} />
            </div>
          </Offcanvas.Header>
          {previewNavbar && (
            <Offcanvas.Body>
              <span style={{ marginTop: '4px' }}>{_renderEnvironmentManager()}</span>
              <hr className="m-0" />
              <span>{_renderAppVersionsManager()}</span>
              <div className="d-flex p-2 align-items-center">
                <span style={{ marginRight: '24px' }}>Layout</span>
                <HeaderActions showToggleLayoutBtn showFullWidth />
              </div>
            </Offcanvas.Body>
          )}
        </Navbar.Offcanvas>
      </Navbar>
    );
  }
  return (
    <div
      className="released-version-no-header-mbl-preview"
      style={{ backgroundColor: 'var(--slate5)', top: showHeader ? '' : '14px' }}
    >
      <span
        style={{
          color: 'var(--slate12)',
        }}
        className="preview-chip"
      >
        Preview
      </span>
      <OverlayTrigger rootClose trigger="click" placement="bottom" overlay={_renderOverlay()}>
        <span
          style={{
            marginLeft: '12px',
            cursor: 'pointer',
          }}
        >
          <Icon name={'settings'} height={12} width={12} fill={'#889099'} />
        </span>
      </OverlayTrigger>
    </div>
  );
};

export default PreviewSettings;
