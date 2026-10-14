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
});
