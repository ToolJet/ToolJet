import { getMaxPageNumbers } from '../Pagination';

const li = (width, { operator = false } = {}) => {
  const el = document.createElement('li');
  if (operator) el.setAttribute('aria-label', 'Next page');
  Object.defineProperty(el, 'offsetWidth', { value: width });
  return el;
};

// The page row must fit its box even when it was measured while only short labels were shown.
test('[Pagination-FIT-001] page slots are sized for the longest page number, not the shortest one on screen', () => {
  // Break this catches: sizing slots from the items rendered at measure time ("1" and "…", 28px), so with 1000
  // pages the four-digit labels need more room than planned and the row overflows the box.
  const operators = [0, 1, 2, 3].map(() => li(28, { operator: true }));
  const shortItems = [li(28), li(28)];

  const fit = getMaxPageNumbers(317, 1000, [...operators, ...shortItems]);

  // A four-digit page needs about 40px: 4 operators (112px) + fit × 40px must stay within 317px.
  expect(112 + fit * 40).toBeLessThanOrEqual(317);
});
