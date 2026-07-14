import React from 'react';
import ReactDOM from 'react-dom';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import '@/_styles/workspace-pull-conflict-modal.scss';

const TYPE_ICON_MAP = {
  app: 'apps',
  module: 'module',
  datasource: 'datasource',
  folder: 'folder',
};

const CONFLICT_TITLE_MAP = {
  'app-name': 'App name already exists',
  'app-slug': 'App slug already exists',
  'module-name': 'Module name already exists',
  'module-slug': 'Module slug already exists',
  'folder-folder': 'Folder name must be unique',
  'datasource-name': 'Data source name already exists',
};

const CONFLICT_SECTION_HEADER_MAP = {
  'app-name': 'Conflicting app name',
  'app-slug': 'Conflicting app slug',
  'module-name': 'Conflicting module name',
  'module-slug': 'Conflicting module slug',
  'folder-folder': 'Conflicting folder name',
  'datasource-name': 'Conflicting data source name',
};

const STATUS_LABEL_MAP = {
  incoming: 'Incoming pull',
  existing: 'Existing branch',
  local: 'Local',
  remote: 'Remote',
};

export function PullConflictModal({ show, onClose, conflictGroups = [], context }) {
  if (!show) return null;

  const isPushConflict = conflictGroups.some((g) =>
    g.conflicts?.some((c) => c.status === 'local' || c.status === 'remote')
  );
  const isBranchCreation = context === 'branch-creation';
  const isBranchSwitch = context === 'branch-switch';
  const hideBadges = isBranchCreation || isBranchSwitch;

  const conflictTitles = (() => {
    if (isBranchCreation) return ['Cannot create branch with duplicate data'];
    if (isBranchSwitch) return ['Cannot open branch with duplicate data'];
    if (isPushConflict) return ['Cannot push with duplicate data'];
    return ['Cannot pull with duplicate data'];
  })();

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('pull-conflict-modal-overlay')) {
      onClose();
    }
  };

  const darkMode = localStorage.getItem('darkMode') === 'true';

  return ReactDOM.createPortal(
    <div className="pull-conflict-modal-overlay" onClick={handleOverlayClick}>
      <div className={`pull-conflict-modal${darkMode ? ' theme-dark dark-theme' : ''}`}>
        {/* HEADER */}
        <div className="pull-conflict-modal-header">
          <div className="conflict-warning-icon">
            <SolidIcon name="warning" width="24" fill="var(--orange9)" />
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
            The following resources have the same name or slug on this branch. ToolJet requires unique names & slug for
            apps, data sources, modules, and folders within a branch.
          </p>

          <div className="conflict-groups-list">
            {conflictGroups.map((group, idx) => (
              <div key={idx} className="conflict-group-wrapper">
                <div className="conflict-section">
                  <div className="conflict-section-header">
                    <span>
                      {CONFLICT_SECTION_HEADER_MAP[`${group.type}-${group.conflictField}`] || group.label}
                      {group.conflictKey
                        ? ` - '${group.conflictKey}'`
                        : group.conflicts?.[0]?.name && ` - '${group.conflicts[0].name}'`}
                    </span>
                  </div>

                  <div className="conflict-section-body">
                    {group.conflicts.map((item, itemIdx) => (
                      <div key={itemIdx} className="conflict-item">
                        <SolidIcon name={TYPE_ICON_MAP[group.type] || 'apps'} width="16" fill="var(--slate9)" />

                        <span className="conflict-item-name">
                          {group.conflictField === 'slug'
                            ? item.name
                            : item.coRelationId
                            ? `#${item.coRelationId.slice(0, 8)}`
                            : item.name}
                        </span>

                        {!hideBadges && (
                          <span className={`conflict-badge conflict-badge--${item.status}`}>
                            {STATUS_LABEL_MAP[item.status] || item.status}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="conflict-footer-text">
            {isBranchCreation || isBranchSwitch || isPushConflict
              ? 'Resolve the conflict before trying again. Read our docs for step-by-step instructions on resolving unique constraint conflicts.'
              : 'Rename the conflicting resources before pulling again. Read our docs for step-by-step instructions on resolving naming conflicts.'}
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
            href="https://docs.tooljet.com/docs/beta/unique-constraint/"
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

export default PullConflictModal;
