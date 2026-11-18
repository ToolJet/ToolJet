import { waitFor } from '@testing-library/react';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA board "Pack Components Full QA", Ant Design Avatar. The pack's Avatar, the inline SDK and the host renderer are the
// real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

const IMAGE = 'https://example.com/a.png';
const image = async (v) => {
  await waitFor(() => expect(v.root().querySelector('.ant-avatar img')).toBeTruthy());
  return v.root().querySelector('.ant-avatar img');
};

// PF-192: an Avatar showing an image with Alt and Text both empty drew an img with no alt attribute, so a screen
// reader read out the image's file name. It now has alt="" (a decorative image), as ToolJet's own Image does.
describe('Ant Design Avatar image alt', () => {
  test('[PackComponent-AVATAR-001] with Alt and Text empty the image has an empty alt', async () => {
    const v = await mountPack('antd', 'Avatar', { src: IMAGE, children: '', alt: '' });

    expect((await image(v)).getAttribute('alt')).toBe('');
  });

  test('[PackComponent-AVATAR-002] Alt, else Text, still labels the image', async () => {
    const withAlt = await mountPack('antd', 'Avatar', { src: IMAGE, children: 'Ada Lovelace', alt: 'Profile photo' });
    const withText = await mountPack('antd', 'Avatar', { src: IMAGE, children: 'Ada Lovelace', alt: '' });

    expect((await image(withAlt)).getAttribute('alt')).toBe('Profile photo');
    expect((await image(withText)).getAttribute('alt')).toBe('Ada Lovelace');
  });
});

// PKB-41: Primary color, Container background, Border color and Border radius did nothing on an Avatar. Ant fills it
// with colorTextPlaceholder, draws a transparent 1px border and rounds it by its Shape, none of them those Styles. Set,
// Container background (else Primary color) fills the avatar, Border color draws its border and Border radius rounds
// its corners, whatever the Shape; unset, Ant's grey circle.
describe('Ant Design Avatar: Styles', () => {
  const avatar = (v) => v.root().querySelector('.ant-avatar');

  test('[PackComponent-AVATAR-003] Container background fills the avatar', async () => {
    const v = await mountPack('antd', 'Avatar', {}, { styles: { colorBgContainer: '#00aa00' } });

    expect(avatar(v).style.backgroundColor).toMatch(/#00aa00|rgb\(0, 170, 0\)/);
  });

  test('[PackComponent-AVATAR-004] Primary color fills the avatar when Container background is not set', async () => {
    const primary = await mountPack('antd', 'Avatar', {}, { styles: { colorPrimary: '#ff0000' } });
    const both = await mountPack(
      'antd',
      'Avatar',
      {},
      { styles: { colorPrimary: '#ff0000', colorBgContainer: '#00aa00' } }
    );

    expect(avatar(primary).style.backgroundColor).toMatch(/#ff0000|rgb\(255, 0, 0\)/);
    expect(avatar(both).style.backgroundColor).toMatch(/#00aa00|rgb\(0, 170, 0\)/);
  });

  test('[PackComponent-AVATAR-005] Border color draws the avatar’s border', async () => {
    const v = await mountPack('antd', 'Avatar', {}, { styles: { colorBorder: '#0000ff' } });

    expect(avatar(v).style.borderColor).toMatch(/#0000ff|rgb\(0, 0, 255\)/);
  });

  test.each([
    ['circle', 0, '0px'],
    ['circle', 8, '8px'],
    ['square', 12, '12px'],
  ])('[PackComponent-AVATAR-006] Border radius on a %s avatar: %s rounds it to %s', async (shape, radius, expected) => {
    const v = await mountPack('antd', 'Avatar', { shape }, { styles: { borderRadius: radius } });

    expect(avatar(v).style.borderRadius).toBe(expected);
  });

  test('[PackComponent-AVATAR-007] left unset, the avatar keeps Ant’s look', async () => {
    const v = await mountPack('antd', 'Avatar', {});

    expect(avatar(v).style.backgroundColor).toBe('');
    expect(avatar(v).style.borderColor).toBe('');
    expect(avatar(v).style.borderRadius).toBe('');
  });
});
