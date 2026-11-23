import { displayVersion } from '../displayVersion';

// The settings menu shows the installed version without the "-beta" tag; the full string stays as the server sent it
// for the update check and the Cloud check.
describe('displayVersion', () => {
  test('drops -beta from a beta build', () => {
    expect(displayVersion('4.0.0-beta-ee')).toBe('4.0.0-ee');
    expect(displayVersion('4.0.0-beta-ce')).toBe('4.0.0-ce');
  });

  test('leaves a non-beta version as it is', () => {
    expect(displayVersion('3.16.5-ee-lts')).toBe('3.16.5-ee-lts');
    expect(displayVersion('4.0.0-cloud')).toBe('4.0.0-cloud');
  });

  test('only drops a whole -beta part, not one that merely starts with it', () => {
    expect(displayVersion('4.0.0-betax-ee')).toBe('4.0.0-betax-ee');
  });

  test('passes a missing version through', () => {
    expect(displayVersion(null)).toBeNull();
    expect(displayVersion(undefined)).toBeUndefined();
  });
});
