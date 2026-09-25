/**
 * Copy for the delete pop-over, kept free of React, the store and stylesheets so the
 * wording of every state can be unit-tested on its own.
 *
 * Two states, driven purely by whether anything outside the selection still points at
 * the entities being deleted:
 *  - blocked  → explain what to remove first; the dialog offers only "Got it"
 *  - clear    → plain confirmation with Cancel / Delete
 *
 * The parameter types are structural on purpose — only what the copy actually reads.
 * `DeleteSubject` from entityUsage satisfies them, and so do plain test fixtures.
 */

/** A subject still referenced from outside the selection. */
export type DeleteDialogBlocker = {
  dependents: readonly unknown[];
  viaDescendant?: Record<string, string>;
};

/** Anything the user asked to delete. */
export type DeleteDialogSubject = {
  name?: string;
};

export type DeleteDialogCopy = {
  blocked: boolean;
  title: string;
  subtitle: string;
};

export type DeleteDialogCopyInput = {
  entityLabel?: string;
  subjects?: readonly DeleteDialogSubject[];
  blockers?: readonly DeleteDialogBlocker[];
};

const PLURALS: Record<string, string> = { component: 'components', query: 'queries' };

export const pluralizeEntity = (entityLabel: string, count: number): string =>
  count === 1 ? entityLabel : (PLURALS[entityLabel] ?? `${entityLabel}s`);

/** Card header count, e.g. "Used by 1 entity" / "Used by 4 entities". */
export const usedByLabel = (count: number): string => `Used by ${count} ${count === 1 ? 'entity' : 'entities'}`;

/** Dashed note explaining that the reference points at a child, not at the subject. */
export const nestedChildNote = (descendantName: string, subjectName: string): string =>
  `${descendantName} lives inside ${subjectName}`;

const REMOVE_REFERENCES = 'Remove these references, then try again.';

// True when every dependent of a subject reaches it through a descendant rather than
// through the subject itself — the "a component inside it" case in the design.
const isBlockedOnlyByDescendants = (subject: DeleteDialogBlocker): boolean => {
  const viaDescendant = subject.viaDescendant ?? {};
  const keys = Object.keys(viaDescendant);
  return keys.length > 0 && keys.length === subject.dependents.length;
};

const blockedSubtitle = (
  entityLabel: string,
  subjects: readonly DeleteDialogSubject[],
  blockers: readonly DeleteDialogBlocker[]
): string => {
  const total = subjects.length;

  if (total === 1) {
    const [subject] = blockers;
    if (isBlockedOnlyByDescendants(subject)) return 'A component inside it is still in use elsewhere.';
    const count = subject.dependents.length;
    return `It's used by ${count} other thing${count === 1 ? '' : 's'} in this app. ${REMOVE_REFERENCES}`;
  }

  if (blockers.length === total) {
    const scope = total === 2 ? 'Both are' : `All ${total} are`;
    return `${scope} still in use elsewhere. ${REMOVE_REFERENCES}`;
  }

  const verb = blockers.length === 1 ? 'is' : 'are';
  return `${blockers.length} of ${total} selected ${pluralizeEntity(
    entityLabel,
    total
  )} ${verb} still in use elsewhere.`;
};

/**
 * @param entityLabel 'component' | 'query'
 * @param subjects    everything the user asked to delete: [{ id, name }]
 * @param blockers    the subset still referenced from outside (getDeleteBlockers output)
 * @returns { blocked, title, subtitle }
 */
export function buildDeleteDialogCopy({
  entityLabel = 'component',
  subjects = [],
  blockers = [],
}: DeleteDialogCopyInput = {}): DeleteDialogCopy {
  const total = subjects.length;
  const blocked = blockers.length > 0;
  const noun = pluralizeEntity(entityLabel, total);
  const singleName = subjects[0]?.name ?? '';
  // A subject whose name will not resolve is named by its kind rather than by an empty
  // string or an internal id — quoting a UUID at the user tells them nothing.
  const single = singleName ? `"${singleName}"` : `this ${entityLabel}`;

  if (!blocked) {
    return {
      blocked: false,
      title: total === 1 ? `Delete ${single}?` : `Delete ${total} ${noun}?`,
      subtitle:
        total === 1
          ? 'Nothing outside this selection depends on it.'
          : 'Nothing outside this selection depends on these.',
    };
  }

  return {
    blocked: true,
    title: total === 1 ? `Can't delete ${single}` : `Can't delete ${total} ${noun}`,
    subtitle: blockedSubtitle(entityLabel, subjects, blockers),
  };
}
