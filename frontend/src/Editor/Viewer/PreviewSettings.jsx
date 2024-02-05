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

const PreviewSettings = ({ isMobileLayout, setAppDefinitionFromVersion, showHeader, darkMode }) => {
  const { editingVersion } = useAppVersionStore((state) => ({
    editingVersion: state?.editingVersion,
  }));
  const { appId } = useAppInfo();
  const [previewNavbar, togglePreviewNavbar] = useState(false);

  const overlay = (
    <div className={classNames({ 'dark-theme theme-dark': darkMode })}>
      <div className="preview-settings-overlay" style={{ borderColor: darkMode ? '#2B3036' : '#E4E7EB' }}>
        <span className="preview-settings-text">Preview settings</span>
        <span>
          {editingVersion && (
            <AppVersionsManager
              appId={appId}
              setAppDefinitionFromVersion={(data) => {
                setAppDefinitionFromVersion(data);
              }}
              onVersionDelete={noop}
              isEditable={false}
              isViewer
            />
          )}
        </span>
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
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>Preview settings</Offcanvas.Title>
          </Offcanvas.Header>
          {previewNavbar && (
            <Offcanvas.Body>
              <span>
                {editingVersion && (
                  <AppVersionsManager
                    appId={appId}
                    setAppDefinitionFromVersion={(data) => {
                      togglePreviewNavbar(false);
                      setAppDefinitionFromVersion(data);
                    }}
                    onVersionDelete={noop}
                    isEditable={false}
                    isViewer
                  />
                )}
              </span>
              <div className="d-flex p-2 align-items-center">
                <span style={{ marginRight: '24px' }}>layout</span>
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
