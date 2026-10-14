import { chipLabel, chipTone } from '../chipTone';

describe('chipTone', () => {
  it('reads common states', () => {
    expect(chipTone('Paid')).toBe('success');
    expect(chipTone('In stock')).toBe('success');
    expect(chipTone('Resolved')).toBe('success');
    expect(chipTone('Overdue')).toBe('danger');
    expect(chipTone('Out of stock')).toBe('danger');
    expect(chipTone('Cancelled')).toBe('danger');
    expect(chipTone('Pending')).toBe('warning');
    expect(chipTone('Reorder')).toBe('warning');
    expect(chipTone('Low stock')).toBe('warning');
    expect(chipTone('In progress')).toBe('info');
    expect(chipTone('Open')).toBe('info');
    expect(chipTone('on the way')).toBe('info');
    expect(chipTone('En route')).toBe('info');
    expect(chipTone('Archived')).toBe('neutral');
  });

  it('reads priorities by level', () => {
    expect(chipTone('High')).toBe('danger');
    expect(chipTone('Urgent')).toBe('danger');
    expect(chipTone('Medium')).toBe('warning');
    expect(chipTone('Low')).toBe('neutral');
  });

  it('matches words, not fragments, and tolerates separators and case', () => {
    expect(chipTone('UNPAID')).toBe('warning');
    expect(chipTone('not_started')).toBe('neutral');
    expect(chipTone('on-hold')).toBe('warning');
    expect(chipTone('Inactive')).toBe('neutral');
    expect(chipTone('Not paid')).toBe('warning');
  });

  it('is neutral for junk', () => {
    expect(chipTone(null)).toBe('neutral');
    expect(chipTone(undefined)).toBe('neutral');
    expect(chipTone(42)).toBe('neutral');
    expect(chipTone({})).toBe('neutral');
  });
});

describe('chipLabel', () => {
  // Blind reviews marked down chips that showed raw stored values ("completed", "in_progress"): a value written all
  // in lowercase reads as a label in sentence case. Anything with a capital letter is shown exactly as written.
  it('puts a lowercase stored value in sentence case', () => {
    expect(chipLabel('completed')).toBe('Completed');
    expect(chipLabel('in_progress')).toBe('In progress');
    expect(chipLabel('due-soon')).toBe('Due soon');
    expect(chipLabel('on   hold')).toBe('On hold');
  });

  it('keeps any value that already has a capital letter, a digit-led code or no letters', () => {
    expect(chipLabel('Paid')).toBe('Paid');
    expect(chipLabel('SEV1')).toBe('SEV1');
    expect(chipLabel('In Progress')).toBe('In Progress');
    expect(chipLabel('2fa required')).toBe('2fa required');
    expect(chipLabel('---')).toBe('---');
    expect(chipLabel('')).toBe('');
  });

  it('turns anything that is not text into text', () => {
    expect(chipLabel(42)).toBe('42');
    expect(chipLabel(null)).toBe('');
    expect(chipLabel(undefined)).toBe('');
  });
});

// States from tonight's internal tools that read as plain grey chips: a missing receipt beside an attached one looked
// the same (expense approvals, 2026-10-14), as did present and absent students, and vans in service or in repair.
describe('chipTone, everyday operations states', () => {
  it.each([
    ['Missing', 'warning'],
    ['Incomplete', 'warning'],
    ['In repair', 'warning'],
    ['In workshop', 'warning'],
    ['Waiting parts', 'warning'],
    ['Absent', 'danger'],
    ['No-show', 'danger'],
    ['Attached', 'success'],
    ['Received', 'success'],
    ['Present', 'success'],
    ['In service', 'success'],
    ['Returned', 'success'],
    ['Checked out', 'info'],
    ['On loan', 'info'],
    ['In use', 'info'],
  ])('%s reads as %s', (value, tone) => {
    expect(chipTone(value)).toBe(tone);
  });
  it('reads New as a state, not the start of a place name', () => {
    expect(chipTone('New')).toBe('info');
    expect(chipTone('New lead')).toBe('info');
    expect(chipTone('New York, NY')).toBe('neutral');
    expect(chipTone('New Zealand')).toBe('neutral');
  });
  it('reads any Needs state as needing attention (a dental recall list, 2026-10-14)', () => {
    expect(chipTone('Needs contact')).toBe('warning');
    expect(chipTone('Needs review')).toBe('warning');
    expect(chipTone('Follow up')).toBe('warning');
  });
  it('reads In review as work under way, a bare Review as needing attention', () => {
    expect(chipTone('In Review')).toBe('info');
    expect(chipTone('Under review')).toBe('info');
    expect(chipTone('Review')).toBe('warning');
  });
  it('reads Verified and Cleared as done (a claim file, 2026-10-14)', () => {
    expect(chipTone('Verified')).toBe('success');
    expect(chipTone('Cleared')).toBe('success');
    expect(chipTone('Not verified')).toBe('warning');
  });
  it('reads Out and On hire as items out with someone', () => {
    expect(chipTone('Out')).toBe('info');
    expect(chipTone('On hire')).toBe('info');
    expect(chipTone('Out of stock')).toBe('danger');
  });
  it('reads Expiring soon as needing attention and Expired as danger (pharmacy stock, 2026-10-14)', () => {
    expect(chipTone('Expiring soon')).toBe('warning');
    expect(chipTone('Expired')).toBe('danger');
  });
  it('reads courier, call centre, waitlist and subscription states (2026-10-14 night reviews)', () => {
    expect(chipTone('Out for delivery')).toBe('info');
    expect(chipTone('On call')).toBe('info');
    expect(chipTone('Waitlist')).toBe('warning');
    expect(chipTone('Churn')).toBe('danger');
    expect(chipTone('Expansion')).toBe('success');
    expect(chipTone('Contraction')).toBe('warning');
  });
  it('reads Occupied as a room or unit in use, not a warning (hotel and property apps, 2026-10-14)', () => {
    expect(chipTone('Occupied')).toBe('info');
    expect(chipTone('Vacant')).toBe('success');
    expect(chipTone('Busy')).toBe('warning');
  });
  it('reads alerts and watch states (cold chain and billing apps, 2026-10-14)', () => {
    expect(chipTone('OUT OF RANGE')).toBe('danger');
    expect(chipTone('Alert')).toBe('danger');
    expect(chipTone('Watch · 31-60')).toBe('warning');
    expect(chipTone('In range')).toBe('success');
  });
  it('reads Reserved as held for someone (blood bank, 2026-10-14)', () => {
    expect(chipTone('Reserved')).toBe('info');
    // An aircraft out on a lesson (flight school, 2026-10-14).
    expect(chipTone('Flying')).toBe('info');
  });
});
