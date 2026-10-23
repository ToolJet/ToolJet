import { versionHomePageExists, versionSettingsAreObjects } from '@modules/app-validation/rules/version-settings.rules';
import { RuleContext, VersionSettingsWrite } from '@modules/app-validation/types';
import { VersionIndex } from '@modules/app-validation/version-index';

const index = VersionIndex.fromData({
  pages: [
    { id: 'p1', name: 'Home', handle: 'home' },
    { id: 'g1', name: 'Group', handle: 'group', isPageGroup: true },
    { id: 'p2', name: 'Secret', handle: 'secret', hidden: { value: '{{true}}' } },
    { id: 'p3', name: 'Legacy', handle: 'legacy', disabled: true },
    { id: 'p4', name: 'Maybe', handle: 'maybe', hidden: { value: '{{globals.flag}}' } },
  ],
  homePageId: 'p1',
});
const ctx: RuleContext = { appVersionId: 'v1', source: 'pat', index: async () => index };

const write = (data: VersionSettingsWrite['data'], touched = Object.keys(data)): VersionSettingsWrite => ({
  op: 'update',
  id: 'v1',
  data,
  touched,
});

describe('version settings rules', () => {
  describe('version-home-page-exists', () => {
    it('rejects a home page that is not a page of this version', async () => {
      expect(await versionHomePageExists.check(write({ homePageId: 'nope' }), ctx)).toEqual([
        expect.objectContaining({ code: 'VERSION_HOME_PAGE_NOT_FOUND', severity: 'high', confidence: 'certain' }),
      ]);
    });

    it('rejects a page group as home page', async () => {
      expect(await versionHomePageExists.check(write({ homePageId: 'g1' }), ctx)).toEqual([
        expect.objectContaining({ code: 'VERSION_HOME_PAGE_IS_GROUP' }),
      ]);
    });

    it('reports a literally hidden page as home only: the page menu itself allows it', async () => {
      expect(await versionHomePageExists.check(write({ homePageId: 'p2' }), ctx)).toEqual([
        expect.objectContaining({ code: 'VERSION_HOME_PAGE_HIDDEN', severity: 'medium', confidence: 'certain' }),
      ]);
    });

    it('rejects a disabled page as home page', async () => {
      expect(await versionHomePageExists.check(write({ homePageId: 'p3' }), ctx)).toEqual([
        expect.objectContaining({ code: 'VERSION_HOME_PAGE_DISABLED', severity: 'high' }),
      ]);
    });

    it('skips the home page check on create: imports remap page ids after it would run', async () => {
      const create = { ...write({ homePageId: 'nope' }), op: 'create' as const };
      expect(await versionHomePageExists.check(create, ctx)).toEqual([]);
    });

    it('never judges a dynamically hidden page', async () => {
      expect(await versionHomePageExists.check(write({ homePageId: 'p4' }), ctx)).toEqual([]);
    });

    it('accepts a page of the version and skips untouched updates', async () => {
      expect(await versionHomePageExists.check(write({ homePageId: 'p1' }), ctx)).toEqual([]);
      expect(await versionHomePageExists.check(write({ homePageId: 'nope' }, ['globalSettings']), ctx)).toEqual([]);
    });
  });

  describe('version-settings-are-objects', () => {
    it('rejects settings that would spread into corrupt keys', () => {
      expect(versionSettingsAreObjects.check(write({ globalSettings: 'dark' as any }), ctx)).toEqual([
        expect.objectContaining({ code: 'VERSION_SETTINGS_NOT_OBJECT', severity: 'high', path: 'globalSettings' }),
      ]);
      expect(versionSettingsAreObjects.check(write({ pageSettings: [1, 2] as any }), ctx)).toEqual([
        expect.objectContaining({ code: 'VERSION_SETTINGS_NOT_OBJECT', path: 'pageSettings' }),
      ]);
    });

    it('accepts plain objects and absent fields', () => {
      expect(
        versionSettingsAreObjects.check(write({ globalSettings: { canvasMaxWidth: 1200 }, pageSettings: {} }), ctx)
      ).toEqual([]);
      expect(versionSettingsAreObjects.check(write({ homePageId: 'p1' }), ctx)).toEqual([]);
    });
  });
});
