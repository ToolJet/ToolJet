import React from 'react';
import Modal from 'react-bootstrap/Modal';
import { AlertCircle, LayoutGrid, Puzzle, Database, ExternalLink } from 'lucide-react';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { getWorkspaceId } from '@/_helpers/utils';

const TYPE_ICON = {
  app: LayoutGrid,
  module: Puzzle,
  datasource: Database,
};

// Apps and modules share the editor route (slug-based); datasources have their own page.
function resourceUrl(resource) {
  const workspaceId = getWorkspaceId();
  if (resource.type === 'datasource') return `/${workspaceId}/data-sources/${resource.id}`;
  return `/${workspaceId}/apps/${resource.slug || resource.id}`;
}

/**
 * Blocks a workspace pull when any app/module/datasource on the branch has uncommitted
 * changes — see assertNoUncommittedChangesForPull (server/ee/workspace-branches/service.ts).
 * Unlike the single-resource save-version block, a pull can span many resources across types,
 * so this lists all of them instead of offering one auto-commit action.
 */
export function UncommittedChangesPullModal({ show, resources, onClose }) {
  if (!show) return null;

  return (
    <Modal show={show} onHide={onClose} centered size="sm" backdrop="static" contentClassName="home-modal-component">
      <div style={{ padding: '20px', position: 'relative' }}>
        <button
          className="btn-close"
          aria-label="Close"
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px' }}
          data-cy="uncommitted-changes-pull-modal-close-button"
        />
        <div className="d-flex flex-column" style={{ gap: '8px' }}>
          <AlertCircle size={40} className="tw-text-icon-accent" style={{ flexShrink: 0 }} />
          <div className="tj-text-md" style={{ fontWeight: 600 }}>
            Uncommitted changes detected
          </div>
          <div className="tj-text-sm" style={{ color: 'var(--text-placeholder)' }}>
            You cannot pull from git without committing all changes in this branch. Commit changes across the following
            resources and try again.
          </div>
          <div className="d-flex flex-column" style={{ gap: '4px', maxHeight: '220px', overflowY: 'auto' }}>
            {resources.map((resource) => {
              const Icon = TYPE_ICON[resource.type] || LayoutGrid;
              return (
                <div
                  key={`${resource.type}-${resource.id}`}
                  className="d-flex align-items-center justify-content-between"
                  style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-weak)' }}
                >
                  <div className="d-flex align-items-center" style={{ gap: '8px', minWidth: 0 }}>
                    <Icon size={14} className="tw-text-icon-default" style={{ flexShrink: 0 }} />
                    <span
                      className="tj-text-sm"
                      style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {resource.name}
                    </span>
                  </div>
                  <a
                    href={resourceUrl(resource)}
                    target="_blank"
                    rel="noreferrer"
                    className="tj-text-sm d-flex align-items-center"
                    style={{ gap: '4px', flexShrink: 0, color: 'var(--text-accent)' }}
                    data-cy={`open-${resource.type}-${resource.id}`}
                  >
                    Open <ExternalLink size={12} />
                  </a>
                </div>
              );
            })}
          </div>
          <div className="d-flex justify-content-between mt-2">
            <ButtonSolid
              size="lg"
              variant="tertiary"
              as="a"
              href="https://docs.tooljet.com"
              target="_blank"
              rel="noopener noreferrer"
              data-cy="uncommitted-changes-pull-read-docs-button"
            >
              Read docs
            </ButtonSolid>
            <ButtonSolid
              size="lg"
              variant="primary"
              onClick={onClose}
              data-cy="uncommitted-changes-pull-understand-button"
            >
              I understand
            </ButtonSolid>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default UncommittedChangesPullModal;
