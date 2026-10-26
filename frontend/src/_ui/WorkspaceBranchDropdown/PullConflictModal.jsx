import React from 'react';
import ReactDOM from 'react-dom';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import '@/_styles/pull-conflict-modal.scss';

const TYPE_ICON_MAP = {
  app: 'apps',
  module: 'module',
  datasource: 'datasource',
  folder: 'folder',
};

const GROUP_LABEL_MAP = {
  'app-name': 'Conflicting apps',
  'app-slug': 'Conflicting Applications',
  'module-name': 'Conflicting modules',
  'module-slug': 'Conflicting modules',
  'folder-folder': 'Conflicting app folders',
  'datasource-name': 'Conflicting data sources',
};

const CONFLICT_TITLE_MAP = {
  'app-name': 'App name must be unique',
  'app-slug': 'App slug must be unique',
  'module-name': 'Module name must be unique',
  'module-slug': 'Module slug must be unique',
  'folder-folder': 'Folder name must be unique',
  'datasource-name': 'Data source name must be unique',
};

export function PullConflictModal({ show, onClose, conflictGroups = [] }) {
  if (!show) return null;

  const conflictTitles = [
    ...new Set(conflictGroups.map((g) => CONFLICT_TITLE_MAP[`${g.type}-${g.conflictField}`]).filter(Boolean)),
  ];

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('pull-conflict-modal-overlay')) {
      onClose();
    }
  };

  return ReactDOM.createPortal(
    <div className="pull-conflict-modal-overlay" onClick={handleOverlayClick}>
      <div className="pull-conflict-modal">
        {/* HEADER */}
        <div className="pull-conflict-modal-header">
          <div className="conflict-warning-icon">
            <SolidIcon name="informationcircle" width="24" fill="var(--orange9)" />
          </div>
        </div>

        {/* BODY */}
        <div className="pull-conflict-modal-body">
          <div className="conflict-titles">
            {conflictTitles.map((title, i) => (
              <h3 key={i} className="conflict-title">
                {title}
              </h3>
            ))}
          </div>

          <p className="conflict-description">
            The following resources have the same name or slug on this branch. ToolJet requires unique names &amp; slug
            for apps, data sources, modules, and folders within a branch.
          </p>

          {conflictGroups.map((group, idx) => (
            <div key={idx} className="conflict-group-wrapper">
              <div className="conflict-section">
                <div className="conflict-section-header">
                  <span>{GROUP_LABEL_MAP[`${group.type}-${group.conflictField}`] || group.label}</span>
                </div>

                <div className="conflict-section-body">
                  {group.conflicts.map((item, itemIdx) => (
                    <div key={itemIdx} className="conflict-item">
                      <SolidIcon name={TYPE_ICON_MAP[group.type] || 'apps'} width="16" fill="var(--slate9)" />

                      <span className="conflict-item-name">{item.name}</span>

                      <span className={`conflict-badge conflict-badge--${item.status}`}>
                        {item.status === 'incoming' ? 'Incoming pull' : 'Existing branch'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <p className="conflict-footer-text">
            Rename the conflicting resources before pulling again. Read our docs for step-by-step instructions on
            resolving naming conflicts.
          </p>
        </div>

        {/* FOOTER */}
        <div className="pull-conflict-modal-footer">
          <ButtonSolid variant="tertiary" size="md" onClick={onClose} data-cy="conflict-cancel-button">
            Cancel
          </ButtonSolid>

          <ButtonSolid
            variant="secondary"
            size="md"
            as="a"
            href="https://docs.tooljet.com"
            target="_blank"
            rel="noopener noreferrer"
            data-cy="conflict-read-docs-button"
          >
            Read docs
          </ButtonSolid>
        </div>
      </div>
    </div>,
    document.body
  );
}
