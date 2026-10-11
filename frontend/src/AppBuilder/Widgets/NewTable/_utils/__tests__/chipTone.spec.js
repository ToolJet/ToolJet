import { chipTone } from '../chipTone';

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
