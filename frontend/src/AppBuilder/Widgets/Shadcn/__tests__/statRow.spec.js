import { joinStatRow } from '../statRow';

// KPI cards side by side came out at different heights (a change chip wrapped in the narrower ones): Stats that share
// a row take the tallest natural height among them as their minimum, and drop back when that one shrinks.
describe('joinStatRow', () => {
  it('gives every member of a row the tallest natural height', () => {
    const row = {};
    const seen = { a: [], b: [] };
    const a = joinStatRow(row, (h) => seen.a.push(h));
    const b = joinStatRow(row, (h) => seen.b.push(h));
    a.report(140);
    b.report(185);
    expect(seen.a.at(-1)).toBe(185);
    expect(seen.b.at(-1)).toBe(185);
  });

  it('drops back when the tallest shrinks or leaves', () => {
    const row = {};
    let last;
    const a = joinStatRow(row, (h) => (last = h));
    const b = joinStatRow(row, () => {});
    a.report(140);
    b.report(185);
    b.report(150);
    expect(last).toBe(150);
    b.leave();
    expect(last).toBe(140);
  });

  it('keeps separate rows apart', () => {
    const one = {};
    const two = {};
    let first;
    joinStatRow(one, (h) => (first = h)).report(100);
    joinStatRow(two, () => {}).report(300);
    expect(first).toBe(100);
  });

  it('ignores heights that are not positive numbers', () => {
    const row = {};
    let last;
    const a = joinStatRow(row, (h) => (last = h));
    a.report(120);
    a.report(NaN);
    a.report(-5);
    expect(last).toBe(120);
  });
});
