import { isSizedBox } from '../boxFit';

const inWrapper = (style) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'flex-child-wrapper';
  Object.assign(wrapper.style, style);
  const inner = document.createElement('div');
  wrapper.appendChild(inner);
  return inner;
};

describe('isSizedBox', () => {
  it('treats a grid-placed widget as sized', () => {
    expect(isSizedBox(document.createElement('div'))).toBe(true);
  });

  it('treats a fixed-width flex child as sized, in a row or a column', () => {
    expect(isSizedBox(inWrapper({ flex: '0 0 112px' }))).toBe(true);
    expect(isSizedBox(inWrapper({ flex: '0 0 36px', width: '160px' }))).toBe(true);
  });

  it('treats a flex fill child as unsized, in a row or a column', () => {
    expect(isSizedBox(inWrapper({ flex: '1 1 0px' }))).toBe(false);
    expect(isSizedBox(inWrapper({ flex: '0 0 36px', width: '100%' }))).toBe(false);
  });

  it('never throws without an element', () => {
    expect(isSizedBox(null)).toBe(true);
    expect(isSizedBox(undefined)).toBe(true);
  });
});
