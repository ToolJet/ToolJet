import React, { useState, useEffect } from 'react';
import Icon from '@/_ui/Icon/solidIcons/index';
import { OverlayTrigger, Navbar, Offcanvas } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import classNames from 'classnames';
import Cross from '@/_ui/Icon/solidIcons/Cross';
import { AppVersionsManager } from '@/AppBuilder/Header/AppVersionsManager';
import HeaderActions from '@/AppBuilder/Header/HeaderActions';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

const PreviewSettings = ({ isMobileLayout, showHeader, darkMode }) => {
  const { setShowUndoRedoBtn, editingVersion } = useStore(
    (state) => ({
      setShowUndoRedoBtn: state?.setShowUndoRedoBtn,
      editingVersion: state?.editingVersion,
    }),
    shallow
  );

  const [previewNavbar, togglePreviewNavbar] = useState(false);

  useEffect(() => {
    setShowUndoRedoBtn(false);
    return () => setShowUndoRedoBtn(true);
  }, [setShowUndoRedoBtn]);

  const renderOverlay = () => (
    <div className={classNames({ 'dark-theme theme-dark': darkMode })} style={{ borderRadius: '6px' }}>
      <div className="preview-settings-overlay" style={{ borderColor: darkMode ? '#2B3036' : '#E4E7EB' }}>
        <span className="preview-settings-text" data-cy="preview-settings-text">
          Preview settings
        </span>
        {editingVersion && (
          <>
            <AppVersionsManager darkMode={darkMode} />
            <div className="navbar-seperator"></div>
          </>
        )}
        <span>
          <HeaderActions showToggleLayoutBtn darkMode={darkMode} />
        </span>
      </div>
    </div>
  );

  if (isMobileLayout) {
    return (
      <Navbar
        key="viewer-preview-navbar"
        expand={false}
        expanded={previewNavbar}
        onToggle={togglePreviewNavbar}
        as={(props) => <div>{props.children}</div>}
      >
        <Navbar.Toggle
          as={(props) => (
            <div
              className="released-version-no-header-mbl-preview"
              style={{ backgroundColor: 'var(--slate5)', top: '7px', left: showHeader ? '61%' : '41%' }}
            >
              <span className="preview-chip" style={{ color: 'var(--slate12)' }} data-cy="preview-chip">
                Preview
              </span>
              <span
                style={{ marginLeft: '12px', cursor: 'pointer' }}
                onClick={props.onClick}
                data-cy="preview-settings"
              >
                <Icon name="settings" height={12} width={12} fill="#889099" />
              </span>
            </div>
          )}
        />
        <Navbar.Offcanvas placement="top" className={classNames({ 'dark-theme theme-dark': darkMode })}>
          <Offcanvas.Header>
            <div className="w-100 d-flex align-self-start justify-content-between">
              <Offcanvas.Title>Preview settings</Offcanvas.Title>
              <div onClick={() => togglePreviewNavbar(false)} className="cursor-pointer">
                <Cross fill="var(--slate12)" />
              </div>
            </div>
          </Offcanvas.Header>
          {previewNavbar && (
            <Offcanvas.Body>
              <span>
                <AppVersionsManager darkMode={darkMode} />
              </span>

              <div
                className={classNames('d-flex px-2 pb-2 align-items-center width-100', {
                  'dark-theme theme-dark': darkMode,
                })}
                style={{ backgroundColor: !darkMode && '#fcfcfd' }}
              >
                <span style={{ marginRight: '24px' }}>Layout</span>
                <HeaderActions showToggleLayoutBtn showFullWidth={true} darkMode={darkMode} />
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
      <span className="preview-chip" style={{ color: 'var(--slate12)' }} data-cy="preview-chip">
        Preview
      </span>
      <OverlayTrigger rootClose trigger="click" placement="bottom" overlay={renderOverlay()}>
        <span style={{ marginLeft: '12px', cursor: 'pointer' }} data-cy="preview-settings">
          <Icon name="settings" height={12} width={12} fill="#889099" />
        </span>
      </OverlayTrigger>
    </div>
  );
};

export default PreviewSettings;
