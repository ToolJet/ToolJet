import React, { useState } from 'react';
import cx from 'classnames';
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
import { reviewService } from './reviewService';

export const REVIEW_STATUS = {
  open: { label: 'Waiting for review', tone: 'neutral' },
  changes_requested: { label: 'Changes requested', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  released: { label: 'Released', tone: 'accent' },
  closed: { label: 'Closed', tone: 'muted' },
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

const hue = (id = '') => [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 6;

const Avatar = ({ person }) => (
  <span className={cx('rv-avatar', `rv-avatar--${hue(person?.id)}`)} title={person?.email}>
    {initials(person?.name ?? person?.email)}
  </span>
);

export const StatusPill = ({ status }) => {
  const meta = REVIEW_STATUS[status] ?? REVIEW_STATUS.open;
  return <span className={cx('rv-pill', `rv-pill--${meta.tone}`)}>{meta.label}</span>;
};

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

const Timeline = ({ review, onAnchor }) => (
  <ol className="rv-timeline">
    {review.timeline.map((event) => {
      const person = review.people?.[event.actorId];
      const Icon = EVENT_ICON[event.kind];
      const hasBubble = event.body && ['comment', 'changes_requested', 'approved', 'override'].includes(event.kind);
      return (
        <li key={event.id} className={cx('rv-event', `rv-event--${event.kind}`)}>
          <div className="rv-event__line">
            {event.kind === 'comment' ? (
              <Avatar person={person} />
            ) : (
              <span className="rv-event__icon">{Icon && <Icon size={13} strokeWidth={2} />}</span>
            )}
            <p>
              <strong>{person?.name ?? 'Someone'}</strong> {EVENT_TEXT[event.kind] ?? event.kind}
              {event.anchor && (
                <>
                  {' on '}
                  <button type="button" className="rv-anchor" onClick={() => onAnchor(event.anchor)}>
                    {anchorName(event.anchor)}
                  </button>
                </>
              )}
              <span className="rv-event__time"> {ago(event.createdAt)}</span>
              {event.superseded && ['approved', 'changes_requested', 'override'].includes(event.kind) && (
                <span className="rv-stale" title="The review was reopened after this">
                  before reopening
                </span>
              )}
              {!event.superseded && event.stale && ['approved', 'changes_requested'].includes(event.kind) && (
                <span className="rv-stale" title="The version changed after this">
                  earlier state
                </span>
              )}
            </p>
          </div>
          {hasBubble && <div className="rv-bubble">{event.body}</div>}
        </li>
      );
    })}
  </ol>
);

const Meter = ({ review }) => {
  const { state, requiredApprovals, people } = review;
  const slots = Array.from({ length: Math.max(requiredApprovals, state.approvals.length) });
  return (
    <div className="rv-meter">
      <div className="rv-meter__head">
        <span>Approvals</span>
        <span className="rv-meter__count">
          {state.approvals.length} of {requiredApprovals}
        </span>
      </div>
      <div className="rv-meter__bar" aria-hidden="true">
        {slots.map((_, index) => (
          <span key={index} className={cx({ 'rv-meter__seg--on': index < state.approvals.length })} />
        ))}
      </div>
      <ul className="rv-meter__notes">
        {state.approvals.map((item) => (
          <li key={`a-${item.actorId}`} className="rv-note rv-note--ok">
            <Check size={12} strokeWidth={2.5} /> {people?.[item.actorId]?.name} approved this exact version
          </li>
        ))}
        {state.staleApprovals.map((item) => (
          <li key={`s-${item.actorId}`} className="rv-note rv-note--stale">
            <RotateCcw size={12} strokeWidth={2.25} /> {people?.[item.actorId]?.name} approved an earlier state. The
            version changed since.
          </li>
        ))}
        {state.changesRequested.map((item) => (
          <li key={`c-${item.actorId}`} className="rv-note rv-note--warn">
            <XCircle size={12} strokeWidth={2.25} /> {people?.[item.actorId]?.name} asked for changes
            {item.updatedSince ? ' (updated since)' : ''}
          </li>
        ))}
        {state.overridden && (
          <li className="rv-note rv-note--danger">
            <ShieldAlert size={12} strokeWidth={2.25} /> {people?.[state.overridden.actorId]?.name} allowed release
            without approval
          </li>
        )}
      </ul>
    </div>
  );
};

const Gate = ({ review }) => {
  if (review.state.status === 'released' || review.state.status === 'closed') return null;
  return review.state.canRelease ? (
    <p className="rv-gate rv-gate--open">
      <Check size={14} strokeWidth={2.25} /> Ready to release
    </p>
  ) : (
    <p className="rv-gate">
      <Lock size={14} strokeWidth={2} /> Release stays locked until this is approved
    </p>
  );
};

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
    <form className="rv-panel rv-form" onSubmit={submit}>
      <div className="rv-panel__head">
        <h3>Request a review</h3>
        <button type="button" className="rv-icon-button" onClick={onCancel} aria-label="Cancel">
          <X size={16} />
        </button>
      </div>
      <div className="rv-form__body">
        <p className="rv-muted">
          A teammate who can promote versions reviews what changes from {baseVersion?.name ?? 'the released version'} to{' '}
          {targetVersion?.name}. Release stays locked until they approve this exact version.
        </p>
        <label className="rv-field">
          <span>Title</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} required />
        </label>
        <label className="rv-field">
          <span>What changed and why</span>
          <textarea
            rows={5}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Context for the reviewer: the request behind it, what to check, anything risky."
          />
        </label>
        {error && <p className="rv-error">{String(error)}</p>}
      </div>
      <div className="rv-composer__actions">
        <button type="submit" className="rv-btn rv-btn--primary" disabled={busy || !title.trim()}>
          Request review
        </button>
      </div>
    </form>
  );
};

export const ReviewPanel = ({ appId, review, currentUser, anchor, onClearAnchor, onAnchor, onChange, onClose }) => {
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
    } finally {
      setBusy(false);
    }
  };

  const comment = () => run(() => reviewService.comment(appId, review.id, text, anchor?.key));
  const decide = (decision) => run(() => reviewService.decide(appId, review.id, decision, text));
  const override = () => run(() => reviewService.override(appId, review.id, text));

  return (
    <aside className="rv-panel" aria-label="Review">
      <div className="rv-panel__head">
        <StatusPill status={review.state.status} />
        <button type="button" className="rv-icon-button" onClick={onClose} aria-label="Hide review">
          <X size={16} />
        </button>
      </div>

      <div className="rv-panel__scroll">
        <h3 className="rv-title">{review.title}</h3>
        <p className="rv-byline">
          <Avatar person={review.author} />
          <span>
            <strong>{review.author?.name}</strong> wants to release {review.versionName}
            {review.baseVersionName ? ` in place of ${review.baseVersionName}` : ''}
          </span>
        </p>
        {review.description && <p className="rv-description">{review.description}</p>}
        {review.state.editedSinceOpened && isLive && (
          <p className="rv-note rv-note--stale rv-edited">
            <CircleDot size={12} strokeWidth={2.5} /> Edited since the review was opened
          </p>
        )}
        <Meter review={{ ...review, people }} />
        <Gate review={review} />
        <Timeline review={review} onAnchor={onAnchor} />
      </div>

      {isLive ? (
        <div className="rv-composer">
          {anchor && (
            <span className="rv-chip">
              <MessageSquare size={12} strokeWidth={2} /> On {anchor.name}
              <button type="button" onClick={onClearAnchor} aria-label="Comment on the whole version instead">
                <X size={12} />
              </button>
            </span>
          )}
          <textarea
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
          />
          {error && <p className="rv-error">{String(error)}</p>}
          {overriding ? (
            <div className="rv-composer__actions">
              <button type="button" className="rv-btn" onClick={() => setOverriding(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="rv-btn rv-btn--danger"
                disabled={busy || text.trim().length < 10}
                onClick={override}
              >
                Allow release without approval
              </button>
            </div>
          ) : (
            <div className="rv-composer__actions">
              <button type="button" className="rv-btn" disabled={busy || !text.trim()} onClick={comment}>
                Comment
              </button>
              <span className="rv-spacer" />
              {isAuthor ? (
                <span className="rv-muted rv-small">You opened this review, so a teammate approves it</span>
              ) : (
                <>
                  <button
                    type="button"
                    className="rv-btn rv-btn--warn"
                    disabled={busy || !text.trim()}
                    onClick={() => decide('request_changes')}
                  >
                    Request changes
                  </button>
                  <button
                    type="button"
                    className="rv-btn rv-btn--primary"
                    disabled={busy}
                    onClick={() => decide('approve')}
                  >
                    <Check size={14} strokeWidth={2.5} /> Approve
                  </button>
                </>
              )}
            </div>
          )}
          {!overriding && (
            <div className="rv-composer__foot">
              {currentUser?.isAdmin && !review.state.canRelease && (
                <button type="button" className="rv-link rv-link--danger" onClick={() => setOverriding(true)}>
                  Release without approval
                </button>
              )}
              {(isAuthor || currentUser?.isAdmin) && (
                <button
                  type="button"
                  className="rv-link"
                  onClick={() => run(() => reviewService.close(appId, review.id))}
                >
                  Close review
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="rv-composer rv-composer--done">
          <p className="rv-muted">
            {review.status === 'released' ? `${review.versionName} is live.` : 'This review is closed.'}
          </p>
          {review.status === 'closed' && (isAuthor || currentUser?.isAdmin) && (
            <button type="button" className="rv-btn" onClick={() => run(() => reviewService.reopen(appId, review.id))}>
              Reopen
            </button>
          )}
        </div>
      )}
    </aside>
  );
};

export default ReviewPanel;
