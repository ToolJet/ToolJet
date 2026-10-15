/** @group platform */
import { reviewState, ReviewEvent } from '@modules/versions/reviews/review-state';
import { contentFingerprint } from '@modules/versions/diff/fingerprint';
import { buildSnapshot, VersionRows } from '@modules/versions/diff/snapshot';

const AUTHOR = 'author';
const RIYA = 'riya';
const SAM = 'sam';
let clock = 0;
const at = () => new Date(Date.UTC(2026, 9, 14, 12, 0, clock++)).toISOString();
const event = (actorId: string, kind: ReviewEvent['kind'], fingerprint = 'v1', body: string = null): ReviewEvent => ({
  id: `e${clock}`,
  actorId,
  kind,
  body,
  fingerprint,
  createdAt: at(),
});
const open = { authorId: AUTHOR, requiredApprovals: 1, status: 'open' as const };

describe('review state', () => {
  it('is open until someone other than the author approves', () => {
    const events = [event(AUTHOR, 'opened')];
    expect(reviewState(open, events, 'v1')).toMatchObject({ status: 'open', needed: 1, canRelease: false });
    events.push(event(AUTHOR, 'approved'));
    expect(reviewState(open, events, 'v1').canRelease).toBe(false);
    events.push(event(RIYA, 'approved'));
    expect(reviewState(open, events, 'v1')).toMatchObject({ status: 'approved', needed: 0, canRelease: true });
  });

  it('makes an approval stale when the version changes afterwards', () => {
    const events = [event(AUTHOR, 'opened'), event(RIYA, 'approved', 'v1')];
    const state = reviewState(open, events, 'v2');
    expect(state.status).toBe('open');
    expect(state.canRelease).toBe(false);
    expect(state.staleApprovals.map((item) => item.actorId)).toEqual([RIYA]);
    expect(state.editedSinceOpened).toBe(true);
  });

  it('blocks on a change request until that reviewer approves', () => {
    const events = [
      event(AUTHOR, 'opened'),
      event(RIYA, 'changes_requested', 'v1', 'Totals are wrong'),
      event(SAM, 'approved', 'v2'),
    ];
    const state = reviewState(open, events, 'v2');
    expect(state.status).toBe('changes_requested');
    expect(state.changesRequested).toEqual([expect.objectContaining({ actorId: RIYA, updatedSince: true })]);
    events.push(event(RIYA, 'approved', 'v2'));
    expect(reviewState(open, events, 'v2')).toMatchObject({ status: 'approved', canRelease: true });
  });

  it('lets a reviewer withdraw a decision', () => {
    const events = [
      event(AUTHOR, 'opened'),
      event(RIYA, 'changes_requested', 'v1', 'Wait for legal'),
      event(RIYA, 'dismissed'),
    ];
    expect(reviewState(open, events, 'v1').status).toBe('open');
  });

  it('counts the required number of approvals', () => {
    const two = { ...open, requiredApprovals: 2 };
    const events = [event(AUTHOR, 'opened'), event(RIYA, 'approved')];
    expect(reviewState(two, events, 'v1')).toMatchObject({ status: 'open', needed: 1 });
    events.push(event(SAM, 'approved'));
    expect(reviewState(two, events, 'v1')).toMatchObject({ status: 'approved', needed: 0 });
  });

  it('accepts an admin override only for the content it was given on', () => {
    const events = [event(AUTHOR, 'opened'), event(SAM, 'override', 'v1', 'Hotfix for the outage')];
    expect(reviewState(open, events, 'v1')).toMatchObject({ status: 'approved', canRelease: true });
    expect(reviewState(open, events, 'v1').overridden).toMatchObject({ actorId: SAM, reason: 'Hotfix for the outage' });
    expect(reviewState(open, events, 'v2')).toMatchObject({ status: 'open', canRelease: false, overridden: null });
  });

  it('keeps released and closed reviews in their final state', () => {
    const events = [event(AUTHOR, 'opened'), event(RIYA, 'approved')];
    expect(reviewState({ ...open, status: 'released' }, events, 'v1').status).toBe('released');
    expect(reviewState({ ...open, status: 'closed' }, events, 'v1').canRelease).toBe(false);
  });

  it('starts decisions over when a review is reopened', () => {
    const events = [
      event(AUTHOR, 'opened'),
      event(RIYA, 'approved'),
      event(AUTHOR, 'closed'),
      event(AUTHOR, 'reopened'),
    ];
    expect(reviewState(open, events, 'v1')).toMatchObject({ status: 'open', approvals: [] });
  });
});

describe('content fingerprint', () => {
  const rows = (ids: string[], label: string): VersionRows => ({
    version: {
      id: ids[0],
      name: 'v',
      status: 'DRAFT',
      homePageId: ids[1],
      showViewerNavigation: true,
      globalSettings: {},
      pageSettings: {},
    },
    pages: [
      {
        id: ids[1],
        name: 'Home',
        handle: 'home',
        index: 0,
        disabled: false,
        hidden: null,
        icon: null,
        isPageGroup: false,
        pageGroupId: null,
        autoComputeLayout: true,
        pageHeader: null,
        pageFooter: null,
        type: 'default',
        url: null,
      },
    ],
    components: [
      {
        id: ids[2],
        name: 'save',
        type: 'Button',
        pageId: ids[1],
        parent: null,
        properties: { text: { value: label } },
        styles: {},
        general: {},
        generalStyles: {},
        displayPreferences: {},
        validation: {},
      },
    ],
    layouts: [{ componentId: ids[2], type: 'desktop', top: 10, left: 1, width: 8, height: 40 }],
    queries: [],
    dataSources: [],
    events: [],
  });
  const a = [
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000003',
  ];
  const b = [
    '20000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000003',
  ];

  it('ignores empty values the editor writes into rows on open', () => {
    const plain = rows(a, 'Save');
    const touched = rows(b, 'Save');
    touched.components[0].properties = { ...touched.components[0].properties, tooltip: { value: '' }, data: {} };
    expect(contentFingerprint(buildSnapshot(touched))).toBe(contentFingerprint(buildSnapshot(plain)));
  });

  it('is the same for a copied version and different after an edit', () => {
    const original = contentFingerprint(buildSnapshot(rows(a, 'Save')));
    expect(contentFingerprint(buildSnapshot(rows(b, 'Save')))).toBe(original);
    expect(contentFingerprint(buildSnapshot(rows(b, 'Save deal')))).not.toBe(original);
  });
});
