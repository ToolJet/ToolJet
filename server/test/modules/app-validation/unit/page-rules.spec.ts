import { inputsByArea, toIndexData } from '@modules/app-validation/export-reader';
import {
  pageDeleteSafe,
  pageHandleFormat,
  pageHandleUnique,
  pageHomeStaysVisible,
  pageInVersion,
  pageModuleSinglePage,
  pageNameUnique,
  pageRules,
} from '@modules/app-validation/rules/page.rules';
import { runRules } from '@modules/app-validation/runner';
import { PageWrite, RuleContext } from '@modules/app-validation/types';
import { VersionIndex } from '@modules/app-validation/version-index';
import { templateAppVersions } from '../helpers/templates';

const index = VersionIndex.fromData({
  pages: [
    { id: 'p1', name: 'Home', handle: 'home' },
    { id: 'p2', name: 'Orders', handle: 'orders' },
    { id: 'g1', name: 'Admin', handle: 'admin', isPageGroup: true },
    { id: 'p3', name: 'Settings', handle: 'settings', pageGroupId: 'g1' },
  ],
  homePageId: 'p1',
});
const ctx: RuleContext = { appVersionId: 'v1', source: 'pat', index: async () => index };

const write = (overrides: Partial<PageWrite> = {}): PageWrite => ({
  op: 'create',
  id: 'new',
  data: { name: 'Reports', handle: 'reports', index: 4 },
  ...overrides,
});

describe('page rules', () => {
  describe('page-handle-format', () => {
    it('rejects a handle that is not a URL segment', () => {
      for (const handle of ['Order Details', 'order--details', '-orders', 'orders-', 'orders/today', '']) {
        expect(pageHandleFormat.check(write({ data: { name: 'Reports', handle } }), ctx)).toEqual([
          expect.objectContaining({ code: 'PAGE_HANDLE_INVALID', severity: 'high', confidence: 'certain' }),
        ]);
      }
    });

    it('rejects a create with no handle at all', () => {
      expect(pageHandleFormat.check(write({ data: { name: 'Reports' } }), ctx)).toEqual([
        expect.objectContaining({ code: 'PAGE_HANDLE_INVALID' }),
      ]);
    });

    it('reports instead of blocking when bulk data reproduces a bad handle', () => {
      const importCtx = { ...ctx, source: 'import' as const };
      expect(
        pageHandleFormat.check(write({ data: { name: 'Reports', handle: 'Product Inventory' } }), importCtx)
      ).toEqual([expect.objectContaining({ code: 'PAGE_HANDLE_INVALID', severity: 'medium' })]);
    });

    it('accepts kebab-case and skips updates that do not touch the handle', () => {
      expect(pageHandleFormat.check(write(), ctx)).toEqual([]);
      expect(
        pageHandleFormat.check(write({ op: 'update', id: 'p2', data: { name: 'Orders 2' }, touched: ['name'] }), ctx)
      ).toEqual([]);
    });
  });

  describe('page-handle-unique', () => {
    it('rejects a handle already used in the version', async () => {
      expect(await pageHandleUnique.check(write({ data: { name: 'Home 2', handle: 'home' } }), ctx)).toEqual([
        expect.objectContaining({ code: 'PAGE_HANDLE_TAKEN', severity: 'high', confidence: 'certain' }),
      ]);
    });

    it('accepts a page keeping its own handle', async () => {
      expect(
        await pageHandleUnique.check(
          write({ op: 'update', id: 'p1', data: { handle: 'home' }, touched: ['handle'] }),
          ctx
        )
      ).toEqual([]);
    });
  });

  describe('page-name-unique', () => {
    it('warns on a duplicate name without blocking', async () => {
      expect(await pageNameUnique.check(write({ data: { name: 'Home', handle: 'home-2' } }), ctx)).toEqual([
        expect.objectContaining({ code: 'PAGE_NAME_TAKEN', severity: 'medium', confidence: 'certain' }),
      ]);
    });

    it('accepts a fresh name', async () => {
      expect(await pageNameUnique.check(write(), ctx)).toEqual([]);
    });
  });

  describe('page-in-version', () => {
    it('rejects an update to a page of another app version', async () => {
      expect(
        await pageInVersion.check(write({ op: 'update', id: 'foreign', data: { name: 'x' }, touched: ['name'] }), ctx)
      ).toEqual([expect.objectContaining({ code: 'PAGE_NOT_IN_VERSION', severity: 'high', confidence: 'certain' })]);
    });

    it('accepts writes to the version own pages and ignores creates', async () => {
      expect(await pageInVersion.check(write({ op: 'delete', id: 'p2', data: {} }), ctx)).toEqual([]);
      expect(await pageInVersion.check(write(), ctx)).toEqual([]);
    });
  });

  describe('page-delete-safe', () => {
    it('rejects deleting the home page', async () => {
      expect(await pageDeleteSafe.check(write({ op: 'delete', id: 'p1', data: {} }), ctx)).toEqual([
        expect.objectContaining({ code: 'PAGE_HOME_DELETE', severity: 'high', confidence: 'certain' }),
      ]);
    });

    it('rejects deleting a group together with the home page inside it', async () => {
      const grouped = VersionIndex.fromData({
        pages: [
          { id: 'g1', name: 'Admin', handle: 'admin', isPageGroup: true },
          { id: 'p1', name: 'Home', handle: 'home', pageGroupId: 'g1' },
        ],
        homePageId: 'p1',
      });
      const groupedCtx = { ...ctx, index: async () => grouped };
      expect(
        await pageDeleteSafe.check(write({ op: 'delete', id: 'g1', data: { deleteAssociatedPages: true } }), groupedCtx)
      ).toEqual([expect.objectContaining({ code: 'PAGE_GROUP_CONTAINS_HOME', severity: 'high' })]);
      // Unlinking the children instead of deleting them is fine.
      expect(await pageDeleteSafe.check(write({ op: 'delete', id: 'g1', data: {} }), groupedCtx)).toEqual([]);
    });

    it('rejects deleting the only page', async () => {
      const single = VersionIndex.fromData({ pages: [{ id: 'p1', name: 'Home', handle: 'home' }] });
      expect(
        await pageDeleteSafe.check(write({ op: 'delete', id: 'p1', data: {} }), { ...ctx, index: async () => single })
      ).toEqual([expect.objectContaining({ code: 'PAGE_LAST_DELETE', severity: 'high' })]);
    });

    it('accepts a normal delete', async () => {
      expect(await pageDeleteSafe.check(write({ op: 'delete', id: 'p2', data: {} }), ctx)).toEqual([]);
    });
  });

  describe('page-module-single-page', () => {
    const moduleIndex = VersionIndex.fromData({
      components: [{ id: 'mc', name: 'container', type: 'ModuleContainer', parent: null, pageId: 'p1' }],
      pages: [{ id: 'p1', name: 'Home', handle: 'home' }],
    });
    const moduleCtx = { ...ctx, index: async () => moduleIndex };

    it('rejects a second page in a module, detected via appType or content', async () => {
      expect(await pageModuleSinglePage.check(write(), moduleCtx)).toEqual([
        expect.objectContaining({ code: 'PAGE_MODULE_EXTRA', severity: 'high', confidence: 'certain' }),
      ]);
      expect(await pageModuleSinglePage.check(write(), { ...ctx, appType: 'module' })).toEqual([
        expect.objectContaining({ code: 'PAGE_MODULE_EXTRA' }),
      ]);
    });

    it('accepts the module own single page and apps with any number of pages', async () => {
      expect(await pageModuleSinglePage.check(write({ id: 'p1' }), moduleCtx)).toEqual([]);
      expect(await pageModuleSinglePage.check(write(), ctx)).toEqual([]);
    });
  });

  describe('page-home-stays-visible', () => {
    const update = (id: string, data: PageWrite['data']): PageWrite => ({
      op: 'update',
      id,
      data,
      touched: Object.keys(data),
    });

    it('rejects literally hiding or disabling the home page', async () => {
      expect(await pageHomeStaysVisible.check(update('p1', { hidden: { value: '{{true}}' } }), ctx)).toEqual([
        expect.objectContaining({ code: 'PAGE_HOME_HIDDEN', severity: 'high', confidence: 'certain' }),
      ]);
      expect(await pageHomeStaysVisible.check(update('p1', { hidden: true }), ctx)).toEqual([
        expect.objectContaining({ code: 'PAGE_HOME_HIDDEN' }),
      ]);
      expect(await pageHomeStaysVisible.check(update('p1', { disabled: true }), ctx)).toEqual([
        expect.objectContaining({ code: 'PAGE_HOME_DISABLED' }),
      ]);
    });

    it('never judges dynamic values and ignores other pages', async () => {
      expect(await pageHomeStaysVisible.check(update('p1', { hidden: { value: '{{globals.flag}}' } }), ctx)).toEqual(
        []
      );
      expect(await pageHomeStaysVisible.check(update('p2', { hidden: true }), ctx)).toEqual([]);
    });
  });

  // Calibration: every ToolJet template must import without blocking problems. The
  // inventory-management and supply-chain templates ship a page whose handle is the raw
  // name ("Product Inventory"), so PAGE_HANDLE_INVALID warnings are expected there, but
  // nothing may rise to a blocking error and no other code may fire at all.
  it('finds no blocking problem in any ToolJet template', async () => {
    const errors = [];
    const unexpectedWarnings = [];
    for (const version of templateAppVersions()) {
      const versionCtx: RuleContext = {
        appVersionId: version.appVersionId,
        appType: version.appType,
        source: 'import',
        index: async () => VersionIndex.fromData(toIndexData(version)),
      };
      const result = await runRules(pageRules, inputsByArea(version).pages ?? [], versionCtx);
      errors.push(...result.errors);
      unexpectedWarnings.push(...result.warnings.filter((issue) => issue.code !== 'PAGE_HANDLE_INVALID'));
    }
    expect(errors).toEqual([]);
    expect(unexpectedWarnings).toEqual([]);
  });
});
