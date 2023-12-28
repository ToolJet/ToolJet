import React, { useState } from 'react';
import Icon from '@/_ui/Icon/solidIcons/index';
import { OverlayTrigger } from 'react-bootstrap';
import { useEditorStore } from '@/_stores/editorStore';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { useAppInfo } from '@/_stores/appDataStore';
import { shallow } from 'zustand/shallow';
import { AppVersionsManager } from '../AppVersionsManager/AppVersionsManager';
import { noop } from 'lodash';
import HeaderActions from '../Header/HeaderActions';
import Navbar from 'react-bootstrap/Navbar';
import Offcanvas from 'react-bootstrap/Offcanvas';
import 'bootstrap/dist/css/bootstrap.min.css';

const PreviewSettings = ({ isMobileLayout, onAppEnvironmentChanged, setAppDefinitionFromVersion, showHeader }) => {
  const { featureAccess, currentAppEnvironment, setCurrentAppEnvironmentId } = useEditorStore(
    (state) => ({
      featureAccess: state?.featureAccess,
      currentAppEnvironment: state?.currentAppEnvironment,
      setCurrentAppEnvironmentId: state?.actions?.setCurrentAppEnvironmentId,
    }),
    shallow
  );
  const { editingVersion } = useAppVersionStore((state) => ({
    editingVersion: state?.editingVersion,
  }));
  const { appId, isPublic, environments, creationMode } = useAppInfo();
  const licenseValid = !featureAccess?.licenseStatus?.isExpired && featureAccess?.licenseStatus?.isLicenseValid;
  const [previewNavbar, togglePreviewNavbar] = useState(false);

  const overlay = (
    <div>
      <div className="preview-settings-overlay">
        <span className="preview-settings-text">Preview settings</span>
        <div className="navbar-seperator"></div>
        <span>
          {editingVersion && (
            <AppVersionsManager
              appId={appId}
              setAppDefinitionFromVersion={(data) => {
                setAppDefinitionFromVersion(data);
              }}
              onVersionDelete={noop}
              environments={environments}
              currentEnvironment={currentAppEnvironment}
              setCurrentEnvironment={setCurrentAppEnvironmentId}
              isPublic={isPublic ?? false}
              appCreationMode={creationMode}
              isEditable={false}
            />
          )}
        </span>
        <span>
          <HeaderActions showToggleLayoutBtn />
        </span>
      </div>
    </div>
  );
  if (isMobileLayout) {
    return (
      <Navbar
        key={'ff'}
        expand={'ff'}
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
                style={{ backgroundColor: 'var(--slate5)', top: '11px', left: showHeader ? '65%' : '41%' }}
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

        <Navbar.Offcanvas placement="top">
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>Preview settings</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            {/* <span>
              {editingVersion && (
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
                />
              )}
            </span> */}
          </Offcanvas.Body>
        </Navbar.Offcanvas>
      </Navbar>
    );
  }
  return (
    <div className="released-version-no-header-mbl-preview" style={{ backgroundColor: 'var(--slate5)' }}>
      <span
        style={{
          color: 'var(--slate12)',
        }}
        className="preview-chip"
      >
        Preview
      </span>
      <OverlayTrigger rootClose trigger="click" placement="bottom" overlay={overlay}>
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
