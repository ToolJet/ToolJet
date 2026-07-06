import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import cx from 'classnames';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import '@/_styles/workspace-pull-conflict-modal.scss';

const TYPE_ICON_MAP = {
  app: 'apps',
  module: 'module',
  datasource: 'datasource',
  folder: 'folder',
};

const CONFLICT_SECTION_HEADER_MAP = {
  'app-name': 'Conflicting app name',
  'app-slug': 'Conflicting app slug',
  'module-name': 'Conflicting module name',
  'module-slug': 'Conflicting module slug',
  'folder-folder': 'Conflicting folder name',
  'datasource-name': 'Conflicting data source name',
};

const LOCAL_STATUSES = ['existing', 'local'];
const REMOTE_STATUSES = ['incoming', 'remote'];

// "existing"/"local" is always the local side, so it's always labeled "Local".
// "incoming"/"remote" is only genuinely "Remote" when the group also has a local
// counterpart to contrast it with. When a group is entirely one-sided (two
// entries colliding with each other, neither one local), calling either "Remote"
// would wrongly imply the other is local — pull's incoming-vs-incoming case keeps
// "Incoming pull", and push/import's remote-vs-remote case shows plain "Incoming".
function getConflictItemBadge(item, group) {
  const hasLocalCounterpart = group.conflicts.some((c) => LOCAL_STATUSES.includes(c.status));

  if (item.status === 'existing' || item.status === 'local') return { label: 'Local', variant: 'local' };
  if (item.status === 'incoming') {
    return hasLocalCounterpart ? { label: 'Remote', variant: 'remote' } : { label: 'Incoming pull', variant: 'local' };
  }
  if (item.status === 'remote') {
    return hasLocalCounterpart ? { label: 'Remote', variant: 'remote' } : { label: 'Incoming', variant: 'local' };
  }
  return { label: item.status, variant: item.status };
}

function ConflictRow({ group, isExpanded, isSyncable, isChecked, onToggleExpanded, onToggleChecked, hideBadges }) {
  return (
    <div className="conflict-row">
      <button type="button" className={cx('conflict-row-header', { 'is-open': isExpanded })} onClick={onToggleExpanded}>
        <span className="conflict-row-left">
          {isSyncable && (
            <input
              type="checkbox"
              className="conflict-row-checkbox"
              checked={isChecked}
              onClick={(e) => e.stopPropagation()}
              onChange={onToggleChecked}
            />
          )}
          <span>
            {CONFLICT_SECTION_HEADER_MAP[`${group.type}-${group.conflictField}`] || group.label}
            {group.conflictKey
              ? ` - '${group.conflictKey}'`
              : group.conflicts?.[0]?.name && ` - '${group.conflicts[0].name}'`}
          </span>
        </span>
        <SolidIcon name="cheverondown" width="14" fill="var(--slate9)" />
      </button>

      {isExpanded && (
        <div className="conflict-section-body">
          {group.conflicts.map((item, itemIdx) => {
            const badge = getConflictItemBadge(item, group);
            return (
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
                  <span className={`conflict-badge conflict-badge--${badge.variant}`}>{badge.label}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function PullConflictModal({ show, onClose, conflictGroups = [], context, onResolve }) {
  const [expandedManual, setExpandedManual] = useState(() => new Set());
  const [expandedSyncable, setExpandedSyncable] = useState(() => new Set([0]));
  const [selectedSyncable, setSelectedSyncable] = useState(() => new Set());

  if (!show) return null;

  const isImport = context === 'import';
  const isPushConflict =
    !isImport && conflictGroups.some((g) => g.conflicts?.some((c) => c.status === 'local' || c.status === 'remote'));
  const isBranchCreation = context === 'branch-creation';
  const isBranchSwitch = context === 'branch-switch';
  const isPullOnly = !isBranchCreation && !isBranchSwitch && !isPushConflict && !isImport;
  // Pull and import both bring in resources from git and can selectively sync a
  // conflicting one; push/branch-creation/branch-switch have no "remote version to
  // take" concept for a name conflict, so they stay manual-only.
  const isSyncEligible = isPullOnly || isImport;
  const hideBadges = !isSyncEligible;

  const title = (() => {
    if (isBranchCreation) return 'Cannot create branch with duplicate data';
    if (isBranchSwitch) return 'Cannot open branch with duplicate data';
    if (isImport) return 'Cannot import duplicate data';
    if (isPushConflict) return 'Cannot push duplicate data';
    return 'Cannot pull branch with duplicate data';
  })();

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('pull-conflict-modal-overlay')) {
      onClose();
    }
  };

  const darkMode = localStorage.getItem('darkMode') === 'true';

  // A name conflict is only syncable when it's local-vs-remote (has a real local
  // row to merge identity with or deactivate). "Remote vs remote" — two entries in
  // the same git payload sharing a name, neither one local — has nothing on our
  // side to resolve; both items are on the remote side with no local counterpart,
  // so it must be renamed in git and stays in the manual-resolution bucket.
  const isSyncableGroup = (g) =>
    g.conflictField !== 'slug' &&
    g.conflicts?.some((c) => LOCAL_STATUSES.includes(c.status)) &&
    g.conflicts?.some((c) => REMOTE_STATUSES.includes(c.status));

  const manualGroups = isSyncEligible ? conflictGroups.filter((g) => !isSyncableGroup(g)) : conflictGroups;
  const syncableGroups = isSyncEligible ? conflictGroups.filter(isSyncableGroup) : [];

  const toggleInSet = (setState, idx) => {
    setState((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const handleSyncSelected = async () => {
    const resolutions = syncableGroups
      .filter((_, idx) => selectedSyncable.has(idx))
      .map((group) => {
        const remoteItem = group.conflicts.find((c) => REMOTE_STATUSES.includes(c.status));
        const localItem = group.conflicts.find((c) => LOCAL_STATUSES.includes(c.status));
        return {
          type: group.type,
          existingCoRelationId: localItem?.coRelationId,
          incomingCoRelationId: remoteItem?.coRelationId,
        };
      })
      .filter((r) => r.existingCoRelationId && r.incomingCoRelationId);

    if (resolutions.length === 0) return;

    await onResolve?.(resolutions);
  };

  return ReactDOM.createPortal(
    <div className="pull-conflict-modal-overlay" onClick={handleOverlayClick}>
      <div className={`pull-conflict-modal${darkMode ? ' theme-dark dark-theme' : ''}`}>
        {/* HEADER */}
        <div className="pull-conflict-modal-header">
          <div className="conflict-warning-icon">
            <SolidIcon name="warning" width="24" fill="var(--orange9)" />
          </div>
          <button type="button" className="conflict-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <SolidIcon name="remove" width="16" fill="var(--slate11)" />
          </button>
        </div>

        {/* BODY */}
        <div className="pull-conflict-modal-body">
          <h3 className="conflict-title">{title}</h3>

          <p className="conflict-description">
            The following resources have the <strong>same data</strong> on this branch. ToolJet requires unique names &
            slug for apps, data sources, modules, and folders within a branch.
          </p>

          <div className="conflict-categories-list">
            {manualGroups.length > 0 && (
              <div className="conflict-category">
                <div className="conflict-category-header">
                  <span className="conflict-category-title">Requires manual resolution</span>
                  <span className="conflict-count-badge conflict-count-badge--danger">{manualGroups.length}</span>
                </div>
                <p className="conflict-category-subtext">Read docs to resolve the conflict before trying again</p>
                <div className="conflict-list-card">
                  {manualGroups.map((group, idx) => (
                    <ConflictRow
                      key={idx}
                      group={group}
                      isExpanded={expandedManual.has(idx)}
                      isSyncable={false}
                      hideBadges={hideBadges}
                      onToggleExpanded={() => toggleInSet(setExpandedManual, idx)}
                    />
                  ))}
                </div>
              </div>
            )}

            {syncableGroups.length > 0 && (
              <div className="conflict-category">
                <div className="conflict-category-header">
                  <span className="conflict-category-title">Sync from git remote</span>
                  <span className="conflict-count-badge conflict-count-badge--primary">{syncableGroups.length}</span>
                </div>
                <p className="conflict-category-subtext">
                  Selected resources will be synced from git. Unselected ones will have to be resolved manually before
                  trying again
                </p>
                <div className="conflict-list-card">
                  {syncableGroups.map((group, idx) => (
                    <ConflictRow
                      key={idx}
                      group={group}
                      isExpanded={expandedSyncable.has(idx)}
                      isSyncable
                      isChecked={selectedSyncable.has(idx)}
                      hideBadges={hideBadges}
                      onToggleExpanded={() => toggleInSet(setExpandedSyncable, idx)}
                      onToggleChecked={() => toggleInSet(setSelectedSyncable, idx)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="pull-conflict-modal-footer">
          <ButtonSolid
            variant="tertiary"
            size="md"
            as="a"
            href="https://docs.tooljet.com/docs/beta/unique-constraint/"
            target="_blank"
            rel="noopener noreferrer"
            data-cy="conflict-read-docs-button"
          >
            Read docs
          </ButtonSolid>

          {isSyncEligible && syncableGroups.length > 0 && (
            <ButtonSolid
              variant="primary"
              size="md"
              disabled={selectedSyncable.size === 0}
              onClick={handleSyncSelected}
              data-cy="conflict-sync-selected-button"
            >
              Sync selected ({selectedSyncable.size})
            </ButtonSolid>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default PullConflictModal;
