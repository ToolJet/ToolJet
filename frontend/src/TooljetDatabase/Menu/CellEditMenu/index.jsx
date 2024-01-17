import React, { useState } from 'react';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import './styles.scss';

export const CellEditMenu = ({ darkMode = false }) => {
  const [isBoolean] = useState(false);
  const popover = (
    <Popover className={`${darkMode && 'dark-theme'} tjdb-table-cell-edit-popover`}>
      <Popover.Body className={`${darkMode && 'dark-theme'}`}>
        <div className={`d-flex flex-column ${isBoolean ? 'gap-4' : 'gap-3'}`}>
          {/*  Boolean View */}
          {isBoolean && (
            <div className="d-flex align-items-start gap-2">
              <span className="d-flex align-items-center gap-2 fw-500 tjdb-bool-cell-menu-badge-default">False</span>
              <span className="d-flex align-items-center gap-2 fw-500 tjdb-bool-cell-menu-badge-default">True</span>
              <span className="d-flex align-items-center gap-2 fw-500 tjdb-bool-cell-menu-badge-default tjdb-bool-cell-menu-badge-selected">
                Null
              </span>
            </div>
          )}

          {!isBoolean && (
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex flex-column align-items-start gap-1">
                <div className="d-flex align-items-center gap-1">
                  <div className="fw-500 tjdb-cell-menu-shortcuts-info">
                    <SolidIcon name="enterbutton" />
                  </div>
                  <div className="fw-400 tjdb-cell-menu-shortcuts-text">Save Changes</div>
                </div>
                <div className="d-flex align-items-center gap-1">
                  <div className="fw-500 tjdb-cell-menu-shortcuts-info">Esc</div>
                  <div className="fw-400 tjdb-cell-menu-shortcuts-text">Discard Changes</div>
                </div>
              </div>
              <div className="d-flex flex-column align-items-end gap-1">
                <div className="d-flex align-items-center gap-2">
                  <div className="d-flex flex-column">
                    <span className="fw-400 fs-12">Set to null</span>
                  </div>
                  <div>
                    <label className={`form-switch`}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={true}
                        onChange={(_e) => {
                          // setIsNotNull(e.target.checked);
                        }}
                      />
                    </label>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="d-flex flex-column">
                    <span className="fw-400 fs-12">Set to default</span>
                  </div>
                  <div>
                    <label className={`form-switch`}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={false}
                        onChange={(_e) => {
                          // setIsNotNull(e.target.checked);
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="d-flex justify-content-end align-items-end gap-2">
            <ButtonSolid variant="tertiary" size="sm">
              Cancel
            </ButtonSolid>
            <ButtonSolid disabled={false} variant="primary" size="sm">
              Save
            </ButtonSolid>
          </div>
        </div>
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger trigger="click" placement="bottom" rootclose overlay={popover} defaultShow>
      <div>CellMenu</div>
    </OverlayTrigger>
  );
};
