import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, CircleCheck, Copy } from 'lucide-react';
import cx from 'classnames';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ToolTip } from '@/_components/ToolTip';
import OverflowTooltip from '@/_components/OverflowTooltip';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import { buildConflictReport } from './conflictReport';
import '@/_styles/workspace-pull-conflict-modal.scss';

const TYPE_ICON_MAP = {
  app: 'apps',
  module: 'module',
  workflow: 'workflows',
  datasource: 'datasource',
  folder: 'folder',
};

const CONFLICT_SECTION_HEADER_MAP = {
  'app-name': 'App name',
  'app-slug': 'App slug',
  'module-name': 'Module name',
  'module-slug': 'Module slug',
  'workflow-name': 'Workflow name',
  'folder-folder': 'Folder name',
  'datasource-name': 'Data source name',
  // Deleted/deactivated by git but still referenced locally — pull can't proceed
  // until the reference is removed, so these are always manual-resolution only.
  'module-in_use': 'Module in use',
  'datasource-in_use': 'Data source in use',
  // Legacy name containing '/', pushed before name validation existed — always
  // manual-resolution only (nothing to sync, the name must be fixed at the source).
  // Just the resource type: the section heading already says "Invalid name".
  'app-invalid_name': 'App',
  'module-invalid_name': 'Module',
  'workflow-invalid_name': 'Workflow',
  'datasource-invalid_name': 'Data source',
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
  // Push name conflict statuses
  if (item.status === 'unsynced') return { label: 'Unsynced', variant: 'local' };
  if (item.status === 'on-branch')
    return { label: item.targetBranchName ? `On ${item.targetBranchName}` : 'On branch', variant: 'remote' };
  return { label: item.status, variant: item.status };
}

const TYPE_LABEL_MAP = {
  app: 'App',
  module: 'Module',
  workflow: 'Workflow',
  datasource: 'Data source',
  folder: 'Folder',
};

// Modal row → report issue.
function groupToReportIssue(group, { resolution, hideBadges }) {
  const typeLabel = TYPE_LABEL_MAP[group.type] || group.type;
  const fieldLabel = CONFLICT_SECTION_HEADER_MAP[`${group.type}-${group.conflictField}`] || group.label || typeLabel;
  const value = group.conflictKey || group.conflicts?.[0]?.name;
  const conflicts = group.conflicts || [];

  if (group.conflictField === 'in_use') {
    return {
      issue: fieldLabel,
      value,
      details: 'Still used by the local app(s) listed below',
      resolution,
      resources: conflicts.map((c) => ({ type: 'App', name: c.name, id: c.coRelationId })),
    };
  }

  const isInvalidName = group.conflictField === 'invalid_name';
  return {
    issue: isInvalidName ? `Invalid ${typeLabel.toLowerCase()} name` : `Duplicate ${fieldLabel.toLowerCase()}`,
    value,
    details: isInvalidName ? "Resource names cannot include '/'" : undefined,
    resolution,
    resources: conflicts.map((c) => ({
      type: typeLabel,
      name: c.name,
      id: c.coRelationId,
      origin: hideBadges || isInvalidName ? undefined : getConflictItemBadge(c, group).label,
    })),
  };
}

function MultiDraftSection({ resources }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!resources?.length) return null;

  return (
    <div className="conflict-category">
      <div className="conflict-category-header">
        <span className="conflict-category-title">Apps with multiple draft versions</span>
        <span className="conflict-count-badge conflict-count-badge--danger">{resources.length}</span>
      </div>
      <p className="conflict-category-subtext">All resources must have exactly one draft version to pull from git</p>
      <div className="conflict-list-card">
        <div className="conflict-row">
          <button
            type="button"
            className={cx('conflict-row-header', { 'is-open': isExpanded })}
            onClick={() => setIsExpanded((v) => !v)}
          >
            <span className="conflict-row-left">Resources</span>
            <SolidIcon name="cheverondown" width="14" fill="var(--slate9)" />
          </button>
          {isExpanded && (
            <div className="conflict-section-body">
              {resources.map((resource, idx) => (
                <div key={idx} className="conflict-item">
                  <SolidIcon name={TYPE_ICON_MAP[resource.type] || 'apps'} width="16" fill="var(--slate9)" />
                  <span className="conflict-item-name">{resource.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConflictRow({
  group,
  isExpanded,
  isSyncable,
  isChecked,
  isCheckDisabled,
  onToggleExpanded,
  onToggleChecked,
  hideBadges,
}) {
  return (
    <div className="conflict-row">
      <button type="button" className={cx('conflict-row-header', { 'is-open': isExpanded })} onClick={onToggleExpanded}>
        <span className="conflict-row-left">
          {isSyncable && (
            <ToolTip
              message={isCheckDisabled ? 'Resolve multiple drafts before syncing this resource' : ''}
              show={isCheckDisabled}
              placement="top"
            >
              <span
                style={{ display: 'inline-flex', cursor: isCheckDisabled ? 'not-allowed' : undefined }}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  className="conflict-row-checkbox"
                  checked={isChecked}
                  disabled={isCheckDisabled}
                  onClick={(e) => e.stopPropagation()}
                  onChange={isCheckDisabled ? undefined : onToggleChecked}
                  style={isCheckDisabled ? { cursor: 'not-allowed', opacity: 0.4, pointerEvents: 'none' } : undefined}
                />
              </span>
            </ToolTip>
          )}
          <OverflowTooltip placement="top" style={{ flex: 1, minWidth: 0, maxWidth: 260, textAlign: 'left' }}>
            {(() => {
              const label = CONFLICT_SECTION_HEADER_MAP[`${group.type}-${group.conflictField}`] || group.label;
              const name = group.conflictKey || group.conflicts?.[0]?.name;
              return name ? `${label} - '${name}'` : label;
            })()}
          </OverflowTooltip>
        </span>
        <SolidIcon name="cheverondown" width="14" fill="var(--slate9)" />
      </button>

      {isExpanded && (
        <div className="conflict-section-body">
          {group.conflictField === 'in_use'
            ? // In-use conflicts list *consuming apps*, not local/remote copies of the
              // same resource — spell out the relationship directly instead of the
              // generic name + Local/Remote badge used for name/slug conflicts.
              group.conflicts.map((item, itemIdx) => (
                <div key={itemIdx} className="conflict-item">
                  <SolidIcon name="apps" width="16" fill="var(--slate9)" />
                  <span className="conflict-item-name">
                    Used in <strong>{item.name}</strong>
                  </span>
                </div>
              ))
            : group.conflicts.map((item, itemIdx) => {
                const badge = getConflictItemBadge(item, group);
                return (
                  <div key={itemIdx} className="conflict-item">
                    <SolidIcon name={TYPE_ICON_MAP[group.type] || 'apps'} width="16" fill="var(--slate9)" />

                    <span className="conflict-item-name">
                      {/* invalid_name: the whole point is showing the offending name itself, not an id. */}
                      {group.conflictField === 'slug' || group.conflictField === 'invalid_name'
                        ? item.name
                        : item.coRelationId
                          ? `#${item.coRelationId.slice(0, 8)}`
                          : item.name}
                    </span>

                    {/* invalid_name is one-sided — no counterpart for the badge to contrast against. */}
                    {!hideBadges && group.conflictField !== 'invalid_name' && (
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

export function PullConflictModal({
  show,
  onClose,
  conflictGroups = [],
  multiDraftResources = [],
  context,
  onResolve,
  // Defaults to the active branch.
  branchName,
}) {
  const [expandedManual, setExpandedManual] = useState(() => new Set());
  const [expandedSyncable, setExpandedSyncable] = useState(() => new Set([0]));
  const [selectedSyncable, setSelectedSyncable] = useState(() => new Set());
  const currentBranchName = useWorkspaceBranchesStore((state) => state.currentBranch?.name);
  // Copy error dialog state.
  const [copiedReport, setCopiedReport] = useState(null);
  const [reportFormat, setReportFormat] = useState('text');
  const [copiedFormat, setCopiedFormat] = useState('text');
  const [copyFailed, setCopyFailed] = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  const justCopiedTimerRef = useRef(null);

  useEffect(() => () => clearTimeout(justCopiedTimerRef.current), []);

  if (!show) return null;

  const isImport = context === 'import';
  const isBranchCreation = context === 'branch-creation';
  const isBranchSwitch = context === 'branch-switch';
  // Detect the push_name_conflict shape ('unsynced'/'on-branch' statuses) directly, since
  // some push call sites forward this 409 without setting context === 'push-name'.
  const isPushNameConflict =
    context === 'push-name' ||
    conflictGroups.some((g) => g.conflicts?.some((c) => c.status === 'unsynced' || c.status === 'on-branch'));
  const isPushConflict =
    !isImport &&
    !isPushNameConflict &&
    conflictGroups.some((g) => g.conflicts?.some((c) => c.status === 'local' || c.status === 'remote'));
  const isPullOnly = !isBranchCreation && !isBranchSwitch && !isPushConflict && !isImport && !isPushNameConflict;
  // Pull and import both bring in resources from git and can selectively sync a
  // conflicting one; push/branch-creation/branch-switch have no "remote version to
  // take" concept for a name conflict, so they stay manual-only.
  const isSyncEligible = isPullOnly || isImport;
  // Show badges for push-name conflicts so Unsynced/On-branch labels are visible.
  const hideBadges = !isSyncEligible && !isPushNameConflict;

  // Branch-creation/switch/import checked first so the more specific title wins on overlap.
  const title = (() => {
    if (isBranchCreation) return 'Cannot create branch';
    if (isBranchSwitch) return 'Cannot open branch';
    if (isImport) return 'Cannot import resources';
    if (isPushNameConflict || isPushConflict) return 'Cannot push resources';
    return 'Cannot pull branch';
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
  // 'in_use' and 'invalid_name' aren't duplicate-name/slug issues — split them out of
  // the generic "duplicate data" manual bucket so each section's title/subtext stays
  // accurate: 'in_use' is a still-referenced local resource, 'invalid_name' is a
  // legacy '/' in the name (pre-dates name validation) that must be renamed at the
  // source, on either side of a push or pull.
  const manualDuplicateGroups = manualGroups.filter(
    (g) => g.conflictField !== 'in_use' && g.conflictField !== 'invalid_name'
  );
  const manualInUseGroups = manualGroups.filter((g) => g.conflictField === 'in_use');
  const manualInvalidNameGroups = manualGroups.filter((g) => g.conflictField === 'invalid_name');

  const action = (() => {
    if (isBranchCreation) return 'Create branch';
    if (isBranchSwitch) return 'Open branch';
    if (isImport) return 'Import resources';
    if (isPushNameConflict || isPushConflict) return 'Push resources';
    return 'Pull branch';
  })();

  const buildReport = () => {
    const manual = { resolution: 'Manual resolution required', hideBadges };
    const sections = [
      {
        title: 'Apps with multiple draft versions',
        issues: multiDraftResources.map((r) => ({
          issue: 'Multiple draft versions',
          value: r.name,
          details: 'All resources must have exactly one draft version to pull from git',
          resolution: 'Manual resolution required',
          resources: [{ type: TYPE_LABEL_MAP[r.type] || r.type, name: r.name, id: r.coRelationId || r.id }],
        })),
      },
      {
        title: 'Duplicate data (requires manual resolution)',
        issues: manualDuplicateGroups.map((g) => groupToReportIssue(g, manual)),
      },
      {
        title: 'Still in use (requires manual resolution)',
        issues: manualInUseGroups.map((g) => groupToReportIssue(g, manual)),
      },
      {
        title: 'Invalid name (requires manual resolution)',
        issues: manualInvalidNameGroups.map((g) => groupToReportIssue(g, manual)),
      },
      {
        title: 'Duplicate data: Sync from git remote',
        issues: syncableGroups.map((g) =>
          groupToReportIssue(g, { resolution: 'Can be synced from git remote', hideBadges })
        ),
      },
    ];
    return buildConflictReport({ action, branchName: branchName || currentBranchName, sections });
  };

  const writeToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFailed(false);
      return true;
    } catch {
      setCopyFailed(true);
      return false;
    }
  };

  const handleCopyError = async () => {
    const report = buildReport();
    setCopiedReport(report);
    setReportFormat('text');
    setCopiedFormat('text');
    setJustCopied(false);
    await writeToClipboard(report.text);
  };

  const handleCopyAgain = async () => {
    if (!(await writeToClipboard(copiedReport[reportFormat]))) return;
    setCopiedFormat(reportFormat);
    setJustCopied(true);
    clearTimeout(justCopiedTimerRef.current);
    justCopiedTimerRef.current = setTimeout(() => setJustCopied(false), 2500);
  };

  const closeCopiedReport = () => {
    clearTimeout(justCopiedTimerRef.current);
    setJustCopied(false);
    setCopiedReport(null);
  };

  const copyAgainLabel = (() => {
    if (justCopied) return 'Copied!';
    if (!copyFailed && copiedFormat === reportFormat) return 'Copy';
    return reportFormat === 'json' ? 'Copy as JSON' : 'Copy as text';
  })();

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

  return createPortal(
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
            {/* Every category gets one generic line regardless of conflict type — always all-manual, nothing to differentiate. */}
            {isPushNameConflict || isPushConflict
              ? 'The following resources have errors and cannot be pushed to git remote. Read docs to resolve the errors and try again.'
              : (() => {
                  if (isBranchCreation)
                    return 'The following resources have errors and cannot be created. Read docs to resolve the errors and try again.';
                  if (isBranchSwitch)
                    return 'The following resources have errors and cannot be opened. Read docs to resolve the errors and try again.';
                  if (isImport)
                    return 'The following resources have errors and cannot be imported. Read docs to resolve the errors and try again.';
                  return 'The following resources have errors and cannot be pulled from git remote. Read docs to resolve the errors and try again.';
                })()}
          </p>
          {/* Bulleted category summary removed — each category section below already carries its own
              header + subtext conveying the same thing, so the list was pure duplication. */}

          <div className="conflict-categories-list">
            {multiDraftResources.length > 0 && <MultiDraftSection resources={multiDraftResources} />}

            {manualDuplicateGroups.length > 0 && (
              <div className="conflict-category">
                <div className="conflict-category-header">
                  <span className="conflict-category-title">Duplicate data (requires manual resolution)</span>
                  <span className="conflict-count-badge conflict-count-badge--danger">
                    {manualDuplicateGroups.length}
                  </span>
                </div>
                <p className="conflict-category-subtext">Resource name &amp; slug must be unique</p>
                <div className="conflict-list-card">
                  {manualDuplicateGroups.map((group) => {
                    const idx = manualGroups.indexOf(group);
                    return (
                      <ConflictRow
                        key={idx}
                        group={group}
                        isExpanded={expandedManual.has(idx)}
                        isSyncable={false}
                        hideBadges={hideBadges}
                        onToggleExpanded={() => toggleInSet(setExpandedManual, idx)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {manualInUseGroups.length > 0 && (
              <div className="conflict-category">
                <div className="conflict-category-header">
                  <span className="conflict-category-title">Still in use (requires manual resolution)</span>
                  <span className="conflict-count-badge conflict-count-badge--danger">{manualInUseGroups.length}</span>
                </div>
                <p className="conflict-category-subtext">
                  Remove the reference from the local app(s) listed below, then try again
                </p>
                <div className="conflict-list-card">
                  {manualInUseGroups.map((group) => {
                    const idx = manualGroups.indexOf(group);
                    return (
                      <ConflictRow
                        key={idx}
                        group={group}
                        isExpanded={expandedManual.has(idx)}
                        isSyncable={false}
                        hideBadges={hideBadges}
                        onToggleExpanded={() => toggleInSet(setExpandedManual, idx)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {manualInvalidNameGroups.length > 0 && (
              <div className="conflict-category">
                <div className="conflict-category-header">
                  <span className="conflict-category-title">Invalid name (requires manual resolution)</span>
                  <span className="conflict-count-badge conflict-count-badge--danger">
                    {manualInvalidNameGroups.length}
                  </span>
                </div>
                <p className="conflict-category-subtext">Resources cannot include &apos;/&apos; in the name</p>
                <div className="conflict-list-card">
                  {manualInvalidNameGroups.map((group) => {
                    const idx = manualGroups.indexOf(group);
                    return (
                      <ConflictRow
                        key={idx}
                        group={group}
                        isExpanded={expandedManual.has(idx)}
                        isSyncable={false}
                        hideBadges={hideBadges}
                        onToggleExpanded={() => toggleInSet(setExpandedManual, idx)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {syncableGroups.length > 0 && (
              <div className="conflict-category">
                <div className="conflict-category-header">
                  <span className="conflict-category-title">Duplicate data: Sync from git remote</span>
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
                      isCheckDisabled={multiDraftResources.some(
                        (r) => r.name === group.conflictKey && r.type === group.type
                      )}
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
            className="conflict-copy-error-btn"
            onClick={handleCopyError}
            data-cy="conflict-copy-error-button"
          >
            <Copy size={14} color="var(--indigo9)" aria-hidden="true" />
            Copy error
          </ButtonSolid>

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

          {(isSyncEligible || syncableGroups.length > 0) && (
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

      {copiedReport && (
        <div className="conflict-report-overlay">
          <div
            className={`conflict-report-dialog${darkMode ? ' theme-dark dark-theme' : ''}`}
            role="dialog"
            aria-label="Copied error details"
          >
            <div className="conflict-report-header">
              {copyFailed ? (
                <SolidIcon name="warning" width="16" fill="var(--orange9)" />
              ) : (
                <CircleCheck size={16} color="var(--grass9)" aria-hidden="true" />
              )}
              <span className="conflict-report-title">
                {copyFailed ? "Couldn't copy to clipboard" : 'Copied to clipboard'}
              </span>
              <button
                type="button"
                className="conflict-modal-close-btn"
                onClick={closeCopiedReport}
                aria-label="Close copied details"
              >
                <SolidIcon name="remove" width="16" fill="var(--slate11)" />
              </button>
            </div>

            <div className="conflict-report-body">
              <div className="conflict-report-toolbar">
                <div className="conflict-report-format-toggle" role="group" aria-label="Format">
                  {['text', 'json'].map((format) => (
                    <button
                      key={format}
                      type="button"
                      className={cx('conflict-report-format-btn', { 'is-active': reportFormat === format })}
                      aria-pressed={reportFormat === format}
                      onClick={() => setReportFormat(format)}
                    >
                      {format === 'json' ? 'JSON' : 'Text'}
                    </button>
                  ))}
                </div>
                <span className="conflict-report-note">
                  {copyFailed
                    ? 'Select the text below and copy it manually'
                    : `Copied as ${copiedFormat === 'json' ? 'JSON' : 'text'}`}
                </span>
              </div>
              <pre className="conflict-report-preview" tabIndex={0} data-cy="conflict-report-preview">
                {copiedReport[reportFormat]}
              </pre>
            </div>

            <div className="conflict-report-footer">
              <ButtonSolid variant="tertiary" size="md" onClick={handleCopyAgain} data-cy="conflict-report-copy-button">
                {justCopied ? (
                  <Check size={14} color="var(--grass9)" aria-hidden="true" />
                ) : (
                  <Copy size={14} color="var(--indigo9)" aria-hidden="true" />
                )}
                {copyAgainLabel}
              </ButtonSolid>
              <ButtonSolid
                variant="primary"
                size="md"
                onClick={closeCopiedReport}
                data-cy="conflict-report-done-button"
              >
                Done
              </ButtonSolid>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

export default PullConflictModal;
