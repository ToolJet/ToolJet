import React, { useState } from 'react';
import cx from 'classnames';
// eslint-disable-next-line import/no-unresolved
import * as Popover from '@radix-ui/react-popover';
import { Copy, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const SHORT_SHA_LENGTH = 7;

export const shortSha = (sha) => (sha ? String(sha).slice(0, SHORT_SHA_LENGTH) : '');

/** "Nov 13, 2026 · 10:42 AM" — null for a missing or unparseable timestamp, so the line is dropped. */
export const formatCommitTimestamp = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${day} · ${time}`;
};

const copySha = async (sha) => {
  try {
    await navigator.clipboard.writeText(sha);
    toast.success('Copied to clipboard!');
  } catch (error) {
    console.error('Failed to copy the commit SHA', error);
  }
};

/** One entry on the vertical timeline: a dot, an optional connector down to the next entry. */
const TimelineEntry = ({ dotClassName, connected = false, title, action, children, dataCy }) => (
  <div className="tw-flex tw-gap-2" data-cy={dataCy}>
    <div className="tw-flex tw-flex-col tw-items-center tw-shrink-0 tw-w-[14px]">
      <span className={cx('tw-mt-[5px] tw-h-[10px] tw-w-[10px] tw-rounded-full tw-shrink-0', dotClassName)} />
      {connected && <span className="tw-flex-1 tw-w-px tw-my-1 tw-border-l tw-border-dashed tw-border-border-weak" />}
    </div>
    <div className={cx('tw-min-w-0 tw-flex-1', { 'tw-pb-3': connected })}>
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
        <span className="tw-font-title-default tw-text-text-default tw-truncate">{title}</span>
        {action}
      </div>
      {children}
    </div>
  </div>
);

/**
 * The git status tag in the app, module and workflow builder headers and on the dashboard.
 *
 * Two states, both opening the same dropdown:
 *   dirty — an orange "Uncommitted changes" tag, over the commit the content was last synced to;
 *   clean — the short SHA of that commit, in green.
 *
 * The dropdown exists to answer "which commit am I looking at", so with no commit recorded there
 * is nothing to open: a dirty resource keeps a plain, non-interactive tag, and a clean one renders
 * nothing at all.
 *
 * @param commit {{ sha, message, at }} from `@/_helpers/gitCommitInfo`, or null when unknown.
 * @param localChangesLabel optional line under "Local changes", e.g. a count of dirty resources.
 */
export function GitCommitStatusTag({
  hasUncommittedChanges = false,
  commit = null,
  localChangesLabel = null,
  darkMode = false,
  dataCy = 'uncommitted-changes-tag',
}) {
  const [open, setOpen] = useState(false);
  const sha = commit?.sha || null;

  if (!hasUncommittedChanges && !sha) return null;

  const label = hasUncommittedChanges ? 'Uncommitted changes' : shortSha(sha);
  const tagContent = (
    <>
      <span
        className={cx(
          'tw-h-2 tw-w-2 tw-rounded-full tw-shrink-0',
          hasUncommittedChanges ? 'tw-bg-icon-warning' : 'tw-bg-icon-success'
        )}
      />
      <span
        className={cx(
          'tw-font-body-small tw-whitespace-nowrap',
          hasUncommittedChanges ? 'tw-text-text-warning' : 'tw-text-text-default'
        )}
      >
        {label}
      </span>
    </>
  );
  const tagClassName = 'tw-flex tw-items-center tw-gap-[6px] tw-px-2 tw-py-1 tw-shrink-0';

  if (!sha) {
    return (
      <div className={tagClassName} data-cy={dataCy}>
        {tagContent}
      </div>
    );
  }

  const timestamp = formatCommitTimestamp(commit.at);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cx(
            tagClassName,
            'tw-rounded tw-border tw-border-border-default tw-bg-background-surface-layer-01 hover:tw-bg-interactive-hover'
          )}
          data-cy={dataCy}
        >
          {tagContent}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          side="bottom"
          sideOffset={8}
          className={cx(
            'tw-z-[1060] tw-w-[320px] tw-rounded-lg tw-border tw-border-border-default tw-bg-background-surface-layer-01 tw-p-4 tw-shadow-lg',
            { 'dark-theme theme-dark': darkMode }
          )}
          data-cy="git-commit-status-popover"
        >
          <div className="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-mb-3">
            <span className="tw-font-title-default tw-text-text-default">
              {hasUncommittedChanges ? 'Uncommitted changes' : 'No uncommitted changes'}
            </span>
            <Popover.Close
              className="tw-flex tw-items-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-icon-default"
              aria-label="Close"
              data-cy="git-commit-status-popover-close"
            >
              <X size={16} />
            </Popover.Close>
          </div>

          {hasUncommittedChanges && (
            <TimelineEntry
              dotClassName="tw-bg-icon-warning"
              connected
              title="Local changes"
              dataCy="git-commit-status-local-changes"
            >
              {localChangesLabel && <div className="tw-font-body-small tw-text-text-default">{localChangesLabel}</div>}
              <div className="tw-font-body-small tw-text-text-placeholder">Not committed yet</div>
            </TimelineEntry>
          )}

          <TimelineEntry
            dotClassName={hasUncommittedChanges ? 'tw-bg-icon-weak' : 'tw-bg-icon-success'}
            title={shortSha(sha)}
            dataCy="git-commit-status-commit"
            action={
              <button
                type="button"
                className="tw-flex tw-items-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-icon-default tw-shrink-0"
                onClick={() => copySha(sha)}
                aria-label="Copy commit SHA"
                data-cy="git-commit-status-copy-sha"
              >
                <Copy size={16} />
              </button>
            }
          >
            {commit.message && (
              <div className="tw-font-body-small tw-text-text-default tw-break-words">{commit.message}</div>
            )}
            {timestamp && <div className="tw-font-body-small tw-text-text-placeholder">{timestamp}</div>}
          </TimelineEntry>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export default GitCommitStatusTag;
