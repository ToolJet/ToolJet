import { defaultsOf, installGuards, mountCase, problemsOf, styleDefaultsOf } from './harness';

// The avatar's image: Radix shows it once the browser has loaded it (a window.Image probe), else the initials.
// jsdom never loads images, so the probe image here loads every src at once.
installGuards();

let RealImage;
beforeAll(() => {
  RealImage = window.Image;
  window.Image = class {
    set src(value) {
      this._src = value;
      setTimeout(() => this.onload?.({}), 0);
    }
    get src() {
      return this._src;
    }
    addEventListener(type, fn) {
      if (type === 'load') this.onload = fn;
    }
    removeEventListener() {}
  };
});
afterAll(() => (window.Image = RealImage));

it('ShadAvatar shows its image URL once loaded, and initials without one', async () => {
  const imagesWith = async (src) => {
    const { stats, unmount } = await mountCase({
      name: 'ShadAvatar',
      properties: { ...defaultsOf('ShadAvatar'), names: ['Ada Lovelace'], src },
      styles: styleDefaultsOf('ShadAvatar'),
    });
    const found = { img: document.querySelectorAll('img').length, text: document.body.textContent };
    unmount();
    expect(problemsOf(stats)).toEqual([]);
    return found;
  };
  const without = await imagesWith('');
  const withSrc = await imagesWith('https://example.invalid/ada.png');
  expect(without.img).toBe(0);
  expect(without.text).toContain('AL');
  expect(withSrc.img).toBeGreaterThan(0);
});
