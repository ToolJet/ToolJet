import { canShowBuildModeTag, canShowPreviewButton } from '../appCardActions';

describe('canShowPreviewButton', () => {
  const viewer = { canUpdate: false, canView: true, hasNonReleasedPreviewAccess: true };

  it('offers Preview on an app card to someone who can view but not edit it', () => {
    expect(canShowPreviewButton({ ...viewer, appType: 'front-end' })).toBe(true);
  });

  it.each(['workflow', 'module'])('never offers Preview on a %s card, which has nothing to preview', (appType) => {
    expect(canShowPreviewButton({ ...viewer, appType })).toBe(false);
  });

  it.each([
    ['can edit it (they get Edit instead)', { canUpdate: true }],
    ['cannot view it', { canView: false }],
    ['has no pre-release environment access', { hasNonReleasedPreviewAccess: false }],
  ])('does not offer Preview on an app card to someone who %s', (_case, override) => {
    expect(canShowPreviewButton({ ...viewer, appType: 'front-end', ...override })).toBe(false);
  });
});

describe('canShowBuildModeTag', () => {
  it.each(['admin', 'builder'])('shows the build mode tag on an app card to a workspace %s', (role) => {
    expect(canShowBuildModeTag({ role: { name: role } })).toBe(true);
  });

  it('hides the build mode tag from an end user, who only opens released apps', () => {
    expect(canShowBuildModeTag({ role: { name: 'end-user' } })).toBe(false);
  });
});
