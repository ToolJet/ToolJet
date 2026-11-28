/**
 * @jest-environment node
 */
import { pageWindow } from '../pageWindow';

const ELLIPSIS = '…';

describe('pageWindow', () => {
  it.each([
    [1, 1, [1]],
    [1, 3, [1, 2, 3]],
    [4, 7, [1, 2, 3, 4, 5, 6, 7]],
  ])('lists every page when there are few (page %i of %i)', (page, total, expected) => {
    expect(pageWindow(page, total)).toEqual(expected);
  });

  it.each([
    [1, 20, [1, 2, 3, 4, 5, ELLIPSIS, 20]],
    [4, 20, [1, 2, 3, 4, 5, ELLIPSIS, 20]],
    [5, 20, [1, ELLIPSIS, 4, 5, 6, ELLIPSIS, 20]],
    [10, 20, [1, ELLIPSIS, 9, 10, 11, ELLIPSIS, 20]],
    [16, 20, [1, ELLIPSIS, 15, 16, 17, ELLIPSIS, 20]],
    [17, 20, [1, ELLIPSIS, 16, 17, 18, 19, 20]],
    [20, 20, [1, ELLIPSIS, 16, 17, 18, 19, 20]],
  ])('collapses the far pages behind an ellipsis (page %i of %i)', (page, total, expected) => {
    expect(pageWindow(page, total)).toEqual(expected);
  });

  it('keeps the same number of slots wherever the current page is, so the bar does not jump', () => {
    const lengths = new Set(Array.from({ length: 20 }, (_, i) => pageWindow(i + 1, 20).length));
    expect([...lengths]).toEqual([7]);
  });

  it('returns nothing for no pages', () => {
    expect(pageWindow(1, 0)).toEqual([]);
  });
});
