import { isPlainObject } from 'lodash';
import { Issue, Rule, RuleContext, VersionSettingsWrite } from '../types';

function touchedField(write: VersionSettingsWrite, field: string): boolean {
  if (write.op !== 'update' || !write.touched) return true;
  return write.touched.includes(field);
}

// The DTO only checks that homePageId is a UUID; nothing checks it is a page of this
// version, and an app whose home page is missing cannot open.
export const versionHomePageExists: Rule<VersionSettingsWrite> = {
  id: 'version-home-page-exists',
  description: 'The home page is a page of this app version',
  async check(write, ctx: RuleContext) {
    // Imports remap page ids after this check would run, so only updates are judged.
    if (write.op !== 'update' || !write.data?.homePageId || !touchedField(write, 'homePageId')) return [];
    const index = await ctx.index();
    const page = index.page(write.data.homePageId);

    if (!page) {
      return [
        {
          code: 'VERSION_HOME_PAGE_NOT_FOUND',
          severity: 'high',
          confidence: 'certain',
          path: 'homePageId',
          message: `home page: no page with id ${write.data.homePageId} exists in this app version`,
          entity: { type: 'version', id: write.id },
          fix: 'Use the id of one of the version\u2019s pages.',
        },
      ];
    }
    if (page.isPageGroup) {
      return [
        {
          code: 'VERSION_HOME_PAGE_IS_GROUP',
          severity: 'high',
          confidence: 'certain',
          path: 'homePageId',
          message: `home page: ${page.name ?? write.data.homePageId} is a page group, not a page`,
          entity: { type: 'version', id: write.id },
        },
      ];
    }
    return [];
  },
};

// updateVersion spreads these into the stored settings; spreading a non-object writes
// corrupt keys ({"0":"f","1":"o",...}) that persist silently.
export const versionSettingsAreObjects: Rule<VersionSettingsWrite> = {
  id: 'version-settings-are-objects',
  description: 'Global and page settings are plain objects',
  check(write) {
    if (write.op === 'delete' || !write.data) return [];
    const issues: Issue[] = [];
    for (const field of ['globalSettings', 'pageSettings'] as const) {
      if (!touchedField(write, field)) continue;
      const value = write.data[field];
      if (value === undefined || value === null || isPlainObject(value)) continue;
      issues.push({
        code: 'VERSION_SETTINGS_NOT_OBJECT',
        severity: 'high',
        confidence: 'certain',
        path: field,
        message: `${field}: must be an object, got ${Array.isArray(value) ? 'an array' : `a ${typeof value}`}`,
        entity: { type: 'version', id: write.id },
      });
    }
    return issues;
  },
};

export const versionSettingsRules: Rule<VersionSettingsWrite>[] = [versionHomePageExists, versionSettingsAreObjects];
