// Review state is derived from the timeline, never stored: the row keeps only
// what cannot be recomputed (open, released, closed). That way an edit to the
// version after an approval makes the approval stale without any bookkeeping.

export type ReviewEventKind =
  | 'opened'
  | 'comment'
  | 'approved'
  | 'changes_requested'
  | 'dismissed'
  | 'override'
  | 'released'
  | 'closed'
  | 'reopened';

export type ReviewEvent = {
  id: string;
  actorId: string;
  kind: ReviewEventKind;
  body?: string | null;
  anchor?: string | null;
  fingerprint?: string | null;
  createdAt: string | Date;
};

export type ReviewRow = {
  authorId: string;
  requiredApprovals: number;
  status: 'open' | 'released' | 'closed';
};

export type ReviewStatus = 'open' | 'approved' | 'changes_requested' | 'released' | 'closed';

export type ReviewState = {
  status: ReviewStatus;
  approvals: Array<{ actorId: string; at: string | Date }>;
  staleApprovals: Array<{ actorId: string; at: string | Date }>;
  changesRequested: Array<{ actorId: string; at: string | Date; updatedSince: boolean }>;
  needed: number;
  overridden: { actorId: string; reason: string; at: string | Date } | null;
  canRelease: boolean;
  editedSinceOpened: boolean;
};

export function reviewState(review: ReviewRow, events: ReviewEvent[], currentFingerprint: string): ReviewState {
  const ordered = [...events].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const latest = new Map<string, ReviewEvent>();
  let overridden: ReviewState['overridden'] = null;
  for (const event of ordered) {
    if (event.kind === 'approved' || event.kind === 'changes_requested') latest.set(event.actorId, event);
    if (event.kind === 'dismissed') latest.delete(event.actorId);
    if (event.kind === 'override' && event.fingerprint === currentFingerprint)
      overridden = { actorId: event.actorId, reason: event.body ?? '', at: event.createdAt };
    // A reopened review starts its decisions over.
    if (event.kind === 'reopened') {
      latest.clear();
      overridden = null;
    }
  }

  const approvals: ReviewState['approvals'] = [];
  const staleApprovals: ReviewState['staleApprovals'] = [];
  const changesRequested: ReviewState['changesRequested'] = [];
  for (const [actorId, event] of latest) {
    // The author never counts, even if a decision slipped into the timeline.
    if (actorId === review.authorId) continue;
    if (event.kind === 'approved') {
      (event.fingerprint === currentFingerprint ? approvals : staleApprovals).push({ actorId, at: event.createdAt });
    } else {
      changesRequested.push({ actorId, at: event.createdAt, updatedSince: event.fingerprint !== currentFingerprint });
    }
  }

  const opened = ordered.find((event) => event.kind === 'opened');
  const needed = Math.max(0, review.requiredApprovals - approvals.length);
  let status: ReviewStatus;
  if (review.status === 'released' || review.status === 'closed') status = review.status;
  else if (overridden) status = 'approved';
  else if (changesRequested.length) status = 'changes_requested';
  else if (needed === 0) status = 'approved';
  else status = 'open';

  return {
    status,
    approvals,
    staleApprovals,
    changesRequested,
    needed,
    overridden,
    canRelease: status === 'approved',
    editedSinceOpened: !!opened?.fingerprint && opened.fingerprint !== currentFingerprint,
  };
}
