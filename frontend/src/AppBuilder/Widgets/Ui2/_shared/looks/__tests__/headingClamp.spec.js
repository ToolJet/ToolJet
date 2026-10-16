import { clampLines } from '@/AppBuilder/Widgets/Ui2/_shared/looks/typeLook';

describe('clampLines', () => {
  // Recipe sheet (2026-10-12): "Brown Butter Banana Bread" in a 44px h2 heading wrapped to a second line that covered
  // the description below it. A heading with a fixed height shows the lines that fit and ends in an ellipsis.
  it('fits whole lines in the box', () => {
    expect(clampLines(44, 36)).toBe(1);
    expect(clampLines(80, 36)).toBe(2);
    expect(clampLines(36, 36)).toBe(1);
  });
  it('always shows at least one line, and nothing for unusable input', () => {
    expect(clampLines(20, 36)).toBe(1);
    expect(clampLines(undefined, 36)).toBeNull();
    expect(clampLines(44, NaN)).toBeNull();
    expect(clampLines(44, 0)).toBeNull();
  });
});
