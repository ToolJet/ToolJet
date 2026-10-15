import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Check,
  CircleDot,
  GitPullRequestArrow,
  Lock,
  MessageSquare,
  RotateCcw,
  ShieldAlert,
  Rocket,
  X,
  XCircle,
  CircleSlash,
} from 'lucide-react';
import { Avatar, Button, Input, Textarea } from '@/components/ui/Rocket';
import { reviewService } from './reviewService';
import { Tag } from './ui';

export const REVIEW_STATUS = {
  open: { label: 'Waiting for review', tone: 'neutral' },
  changes_requested: { label: 'Changes requested', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  released: { label: 'Released', tone: 'accent' },
  closed: { label: 'Closed', tone: 'neutral' },
};

export const StatusPill = ({ status }) => {
  const meta = REVIEW_STATUS[status] ?? REVIEW_STATUS.open;
  return <Tag tone={meta.tone}>{meta.label}</Tag>;
};

const ago = (when) => {
  const seconds = Math.max(1, Math.round((Date.now() - new Date(when).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(when).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const initials = (name = '?') =>
  name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

const Person = ({ person, size = 'sm' }) => (
  <Avatar size={size} fallback={initials(person?.name ?? person?.email)} title={person?.email} />
);

const anchorName = (anchor) => anchor?.split('/').slice(1).join('/') || anchor;

const EVENT_TEXT = {
  opened: 'opened this review',
  comment: 'commented',
  approved: 'approved',
  changes_requested: 'requested changes',
  dismissed: 'withdrew their decision',
  override: 'allowed release without approval',
  released: 'released this version',
  closed: 'closed this review',
  reopened: 'reopened this review',
};

const EVENT_ICON = {
  approved: Check,
  changes_requested: XCircle,
  override: ShieldAlert,
  released: Rocket,
  closed: CircleSlash,
  reopened: RotateCcw,
  opened: GitPullRequestArrow,
  dismissed: X,
};

const EVENT_ICON_TONE = {
  approved: 'tw-text-icon-success',
  changes_requested: 'tw-text-icon-warning',
  override: 'tw-text-icon-danger',
  released: 'tw-text-icon-brand',
};

const Timeline = ({ review, onAnchor }) => (
  <ol className="rv-timeline tw-m-0 tw-p-0 tw-list-none tw-flex tw-flex-col tw-gap-3">
    {review.timeline.map((event) => {
      const person = review.people?.[event.actorId];
      const Icon = EVENT_ICON[event.kind];
      const hasBody = event.body && ['comment', 'changes_requested', 'approved', 'override'].includes(event.kind);
      const earlier =
        (event.superseded &&
          ['approved', 'changes_requested', 'override'].includes(event.kind) &&
          'before reopening') ||
        (!event.superseded && event.stale && ['approved', 'changes_requested'].includes(event.kind) && 'earlier state');
      return (
        <li key={event.id} className="tw-flex tw-flex-col tw-gap-1.5">
          <div className="tw-flex tw-items-start tw-gap-2">
            {event.kind === 'comment' ? (
              <Person person={person} size="xs" />
            ) : (
              <span className="tw-grid tw-place-items-center tw-w-4 tw-h-4 tw-shrink-0">
                {Icon && (
                  <Icon size={13} strokeWidth={2} className={EVENT_ICON_TONE[event.kind] ?? 'tw-text-icon-weak'} />
                )}
              </span>
            )}
            <p className="tw-m-0 tw-font-body-small tw-text-text-medium">
              <span className="tw-font-title-small tw-text-text-default">{person?.name ?? 'Someone'}</span>{' '}
              {EVENT_TEXT[event.kind] ?? event.kind}
              {event.anchor && (
                <>
                  {' on '}
                  <button
                    type="button"
                    className="vd-plain tw-font-title-small tw-text-text-brand hover:tw-underline"
                    onClick={() => onAnchor(event.anchor)}
                  >
                    {anchorName(event.anchor)}
                  </button>
                </>
              )}
              <span className="tw-text-text-placeholder"> {ago(event.createdAt)}</span>
              {earlier && <Tag className="tw-ml-1.5">{earlier}</Tag>}
            </p>
          </div>
          {hasBody && (
            <div className="tw-ml-6 tw-px-3 tw-py-2 tw-rounded-md tw-bg-background-surface-layer-02 tw-font-body-default tw-text-text-default tw-whitespace-pre-wrap">
              {event.body}
            </div>
          )}
        </li>
      );
    })}
  </ol>
);

const Note = ({ icon: Icon, tone, children }) => (
  <li className="tw-flex tw-items-start tw-gap-1.5 tw-font-body-small tw-text-text-medium">
    <Icon size={12} strokeWidth={2.25} className={cn('tw-shrink-0 tw-mt-[3px]', tone)} />
    <span>{children}</span>
  </li>
);

const Approvals = ({ review }) => {
  const { state, requiredApprovals, people } = review;
  const notes = [
    ...state.approvals.map((item) => (
      <Note key={`a-${item.actorId}`} icon={Check} tone="tw-text-icon-success">
        {people?.[item.actorId]?.name} approved this exact version
      </Note>
    )),
    ...state.staleApprovals.map((item) => (
      <Note key={`s-${item.actorId}`} icon={RotateCcw} tone="tw-text-icon-warning">
        {people?.[item.actorId]?.name} approved an earlier state. The version changed since.
      </Note>
    )),
    ...state.changesRequested.map((item) => (
      <Note key={`c-${item.actorId}`} icon={XCircle} tone="tw-text-icon-warning">
        {people?.[item.actorId]?.name} asked for changes{item.updatedSince ? ' (updated since)' : ''}
      </Note>
    )),
    ...(state.overridden
      ? [
          <Note key="o" icon={ShieldAlert} tone="tw-text-icon-danger">
            {people?.[state.overridden.actorId]?.name} allowed release without approval
          </Note>,
        ]
      : []),
  ];
  return (
    <section className="rv-meter tw-flex tw-flex-col tw-gap-2 tw-p-3 tw-rounded-lg tw-border tw-border-solid tw-border-border-weak">
      <div className="tw-flex tw-items-center tw-justify-between">
        <span className="tw-font-title-default tw-text-text-default">Approvals</span>
        <span className="tw-font-body-default tw-text-text-placeholder">
          {state.approvals.length} of {requiredApprovals}
        </span>
      </div>
      {notes.length > 0 && <ul className="tw-m-0 tw-p-0 tw-list-none tw-flex tw-flex-col tw-gap-1">{notes}</ul>}
      {review.state.status !== 'released' && review.state.status !== 'closed' && (
        <p
          className={cn(
            'rv-gate tw-m-0 tw-flex tw-items-center tw-gap-1.5 tw-font-body-small',
            review.state.canRelease ? 'tw-text-text-success' : 'tw-text-text-placeholder'
          )}
        >
          {review.state.canRelease ? (
            <Check size={12} strokeWidth={2.25} />
          ) : (
            <Lock size={12} strokeWidth={2} className="tw-text-icon-weak" />
          )}
          {review.state.canRelease ? 'Ready to release' : 'Release stays locked until this is approved'}
        </p>
      )}
    </section>
  );
};

const PanelShell = ({ label, head, children, foot, as: As = 'aside', ...props }) => (
  <As
    className="rv-panel tw-flex tw-flex-col tw-min-h-0 tw-bg-background-surface-layer-01 tw-border-0 tw-border-l tw-border-solid tw-border-border-weak"
    aria-label={label}
    {...props}
  >
    <div className="tw-flex tw-items-center tw-gap-2 tw-h-12 tw-shrink-0 tw-px-4 tw-border-0 tw-border-b tw-border-solid tw-border-border-weak">
      {head}
    </div>
    <div className="tw-flex-1 tw-min-h-0 tw-overflow-y-auto tw-p-4 tw-flex tw-flex-col tw-gap-4">{children}</div>
    {foot && (
      <div className="tw-shrink-0 tw-p-4 tw-flex tw-flex-col tw-gap-2 tw-border-0 tw-border-t tw-border-solid tw-border-border-weak">
        {foot}
      </div>
    )}
  </As>
);

const CloseButton = ({ onClick, label }) => (
  <Button variant="ghost" size="medium" iconOnly className="tw-ml-auto" onClick={onClick} aria-label={label}>
    <X size={14} strokeWidth={1.75} className="tw-text-icon-default" />
  </Button>
);

export const RequestReviewForm = ({ appId, targetVersion, baseVersion, onCreated, onCancel }) => {
  const [title, setTitle] = useState(`Release ${targetVersion?.name ?? ''}`.trim());
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await reviewService.open(appId, targetVersion.id, {
        title,
        description,
        baseVersionId: baseVersion?.id,
      });
      onCreated(result.review);
    } catch (err) {
      setError(err?.error ?? err?.message ?? 'The review could not be opened');
    } finally {
      setBusy(false);
    }
  };
  return (
    <PanelShell
      as="form"
      label="Request a review"
      onSubmit={submit}
      head={
        <>
          <span className="tw-font-title-large tw-text-text-default">Request a review</span>
          <CloseButton onClick={onCancel} label="Cancel" />
        </>
      }
      foot={
        <>
          {error && <p className="tw-m-0 tw-font-body-small tw-text-text-danger">{String(error)}</p>}
          <div className="tw-flex tw-justify-end tw-gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={busy} disabled={!title.trim()}>
              Request review
            </Button>
          </div>
        </>
      }
    >
      <p className="tw-m-0 tw-font-body-default tw-text-text-medium">
        A teammate who can promote versions reviews what changes from {baseVersion?.name ?? 'the released version'} to{' '}
        {targetVersion?.name}. Release stays locked until they approve this exact version.
      </p>
      <label className="tw-m-0 tw-flex tw-flex-col tw-gap-1.5">
        <span className="tw-font-title-default tw-text-text-default">Title</span>
        <Input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} required />
      </label>
      <label className="tw-m-0 tw-flex tw-flex-col tw-gap-1.5">
        <span className="tw-font-title-default tw-text-text-default">What changed and why</span>
        <Textarea
          rows={5}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Context for the reviewer: the request behind it, what to check, anything risky."
        />
      </label>
    </PanelShell>
  );
};

export const ReviewPanel = ({
  appId,
  review,
  currentUser,
  anchor,
  reviewedFingerprint,
  onStale,
  onClearAnchor,
  onAnchor,
  onChange,
  onClose,
}) => {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [overriding, setOverriding] = useState(false);
  const isAuthor = currentUser?.id === review.authorId;
  const isLive = review.status === 'open';
  const people = review.people ?? {};

  const run = async (action) => {
    setBusy(true);
    setError(null);
    try {
      const result = await action();
      onChange(result.review);
      setText('');
      setOverriding(false);
    } catch (err) {
      setError(err?.error ?? err?.message ?? 'That did not work');
      // The version changed while it was on screen: show the reviewer the new changes.
      if (err?.statusCode === 409) onStale?.();
    } finally {
      setBusy(false);
    }
  };

  const comment = () => run(() => reviewService.comment(appId, review.id, text, anchor?.key));
  const decide = (decision) => run(() => reviewService.decide(appId, review.id, decision, text, reviewedFingerprint));
  const override = () => run(() => reviewService.override(appId, review.id, text));

  const composer = isLive ? (
    <div className="rv-composer tw-flex tw-flex-col tw-gap-2">
      {anchor && (
        <span className="tw-inline-flex tw-self-start tw-items-center tw-gap-1 tw-h-6 tw-pl-2 tw-pr-1 tw-rounded tw-bg-background-accent-weak tw-font-title-small tw-text-text-brand">
          <MessageSquare size={12} strokeWidth={2} /> On {anchor.name}
          <button
            type="button"
            className="vd-plain tw-grid tw-place-items-center tw-w-4 tw-h-4 tw-rounded hover:tw-bg-interactive-hover"
            onClick={onClearAnchor}
            aria-label="Comment on the whole version instead"
          >
            <X size={11} />
          </button>
        </span>
      )}
      <Textarea
        rows={3}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={
          overriding
            ? 'Why does this need to go out without approval? This stays on the record.'
            : anchor
            ? `Comment on ${anchor.name}`
            : isAuthor
            ? 'Reply to your reviewers'
            : 'Leave a comment, or say what needs to change'
        }
        aria-label="Comment"
        className="tw-resize-none"
      />
      {error && <p className="tw-m-0 tw-font-body-small tw-text-text-danger">{String(error)}</p>}
      {overriding ? (
        <div className="tw-flex tw-justify-end tw-gap-2">
          <Button variant="outline" size="medium" onClick={() => setOverriding(false)}>
            Cancel
          </Button>
          <Button variant="primary" danger size="medium" disabled={busy || text.trim().length < 10} onClick={override}>
            Allow release without approval
          </Button>
        </div>
      ) : (
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
          <Button variant="outline" size="medium" disabled={busy || !text.trim()} onClick={comment}>
            Comment
          </Button>
          <span className="tw-flex-1" />
          {isAuthor ? (
            <span className="tw-font-body-small tw-text-text-placeholder">A teammate approves your review</span>
          ) : (
            <>
              <Button
                variant="outline"
                size="medium"
                disabled={busy || !text.trim()}
                onClick={() => decide('request_changes')}
              >
                Request changes
              </Button>
              <Button
                variant="primary"
                size="medium"
                className="rv-approve"
                disabled={busy}
                leadingVisual={<Check size={14} strokeWidth={2.25} />}
                onClick={() => decide('approve')}
              >
                Approve
              </Button>
            </>
          )}
        </div>
      )}
      {!overriding && ((currentUser?.isAdmin && !review.state.canRelease) || isAuthor || currentUser?.isAdmin) && (
        <div className="tw-flex tw-items-center tw-gap-1 tw--ml-2">
          {currentUser?.isAdmin && !review.state.canRelease && (
            <Button
              variant="ghost"
              size="small"
              danger
              className="tw-text-text-danger"
              onClick={() => setOverriding(true)}
            >
              Release without approval
            </Button>
          )}
          {(isAuthor || currentUser?.isAdmin) && (
            <Button variant="ghost" size="small" onClick={() => run(() => reviewService.close(appId, review.id))}>
              Close review
            </Button>
          )}
        </div>
      )}
    </div>
  ) : (
    <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
      <p className="tw-m-0 tw-font-body-default tw-text-text-placeholder">
        {review.status === 'released' ? `${review.versionName} is live.` : 'This review is closed.'}
      </p>
      {review.status === 'closed' && (isAuthor || currentUser?.isAdmin) && (
        <Button variant="outline" size="medium" onClick={() => run(() => reviewService.reopen(appId, review.id))}>
          Reopen
        </Button>
      )}
    </div>
  );

  return (
    <PanelShell
      label="Review"
      head={
        <>
          <StatusPill status={review.state.status} />
          <CloseButton onClick={onClose} label="Hide review" />
        </>
      }
      foot={composer}
    >
      <div className="tw-flex tw-flex-col tw-gap-2">
        <h3 className="rv-title tw-m-0 tw-font-title-heavy-large tw-text-text-default">{review.title}</h3>
        <p className="tw-m-0 tw-flex tw-items-center tw-gap-2 tw-font-body-default tw-text-text-medium">
          <Person person={review.author} size="xs" />
          <span>
            <span className="tw-font-title-default tw-text-text-default">{review.author?.name}</span> wants to release{' '}
            {review.versionName}
            {review.baseVersionName ? ` in place of ${review.baseVersionName}` : ''}
          </span>
        </p>
        {review.description && (
          <p className="tw-m-0 tw-font-body-default tw-text-text-default tw-whitespace-pre-wrap">
            {review.description}
          </p>
        )}
        {review.state.editedSinceOpened && isLive && (
          <p className="tw-m-0 tw-flex tw-items-center tw-gap-1.5 tw-font-body-small tw-text-text-warning">
            <CircleDot size={12} strokeWidth={2.5} /> Edited since the review was opened
          </p>
        )}
      </div>
      <Approvals review={{ ...review, people }} />
      <Timeline review={review} onAnchor={onAnchor} />
    </PanelShell>
  );
};

export default ReviewPanel;
