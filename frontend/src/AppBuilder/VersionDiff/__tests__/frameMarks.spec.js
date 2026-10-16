import { markFrame, markState } from '../frameMarks';

const page = () => {
  document.body.innerHTML = `
    <div class="ele-c1"></div>
    <div class="ele-c2"></div>
    <div class="ele-c3"></div>
    <div class="ele-other"></div>`;
  return document;
};
const highlights = [
  { id: 'c1', key: 'home/a', name: 'a', status: 'added' },
  { id: 'c2', key: 'home/b', name: 'b', status: 'changed', weak: true },
  { id: 'c3', key: 'home/c', name: 'c', status: 'changed' },
];

describe('marking changed widgets in a compare frame', () => {
  it('marks each changed widget with its status, key and name, and reports what it found', () => {
    const d = page();
    const found = markFrame(d, highlights, {});
    expect([...found]).toEqual(['home/a', 'home/b', 'home/c']);
    expect(d.querySelector('.ele-c1').getAttribute('data-vd')).toBe('added');
    expect(d.querySelector('.ele-c2').hasAttribute('data-vd-weak')).toBe(true);
    expect(d.querySelector('.ele-other').hasAttribute('data-vd')).toBe(false);
  });

  it('reads each widget’s style once, not on every pass', () => {
    const d = page();
    const spy = jest.spyOn(d.defaultView, 'getComputedStyle');
    markFrame(d, highlights, {});
    markFrame(d, highlights, {});
    markFrame(d, highlights, {});
    expect(spy).toHaveBeenCalledTimes(3);
    spy.mockRestore();
  });

  it('moves the hover and selection without re-marking the frame', () => {
    const d = page();
    markFrame(d, highlights, {});
    const spy = jest.spyOn(d, 'querySelectorAll');
    markState(d, 'home/b', 'home/c');
    expect(d.querySelector('.ele-c2').hasAttribute('data-vd-selected')).toBe(true);
    expect(d.querySelector('.ele-c3').hasAttribute('data-vd-hover')).toBe(true);
    markState(d, null, 'home/a');
    expect(d.querySelector('.ele-c2').hasAttribute('data-vd-selected')).toBe(false);
    expect(d.querySelector('.ele-c3').hasAttribute('data-vd-hover')).toBe(false);
    expect(d.querySelector('.ele-c1').hasAttribute('data-vd-hover')).toBe(true);
    // One lookup of the marked widgets per change, never one per highlight.
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls.every(([selector]) => selector === '[data-vd-key]')).toBe(true);
    spy.mockRestore();
  });
});
