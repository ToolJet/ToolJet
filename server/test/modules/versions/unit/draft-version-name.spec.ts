import { draftVersionName } from 'src/modules/versions/helpers/draft-version-name.helper';

describe('draftVersionName', () => {
  it('takes the next version number when the app numbers its versions', () => {
    expect(draftVersionName('v1', 0, ['v1'])).toBe('v2');
    expect(draftVersionName('v1', 1, ['v1', 'v2', 'v3'])).toBe('v4');
    expect(draftVersionName('V2', 0, ['V1', 'V2'])).toBe('v3');
  });

  it("keeps the parent's name with a counter for other names", () => {
    expect(draftVersionName('release', 0, ['release'])).toBe('release_1');
    expect(draftVersionName('v1.2', 2, ['v1.2'])).toBe('v1.2_3');
  });
});
