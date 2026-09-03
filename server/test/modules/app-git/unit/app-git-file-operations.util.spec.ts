/**
 * AppGitFileOperationsUtil — the pure, host-free pieces:
 *   - static resource-layout resolvers (apps/ vs modules/, meta filename)
 *   - validateAppJsonForImport (appV2 unwrap, name guard, single→multi-page normalization)
 *
 * The heavy fs/DB methods (readAppJson, UpdateGitApp, …) are exercised by the
 * git-sync e2e lifecycle specs, not here. `convertSinglePageSchemaToMultiPageSchema`
 * is stubbed (via requireActual spread, so the module's other exports still load) so
 * the test asserts the branch decision, not the converter's internals.
 *
 * @group gitsync
 */
jest.mock('@modules/apps/services/app-import-export.service', () => ({
  ...jest.requireActual('@modules/apps/services/app-import-export.service'),
  convertSinglePageSchemaToMultiPageSchema: jest.fn((params) => ({ ...params, __convertedFromSinglePage: true })),
}));

import { BadRequestException } from '@nestjs/common';
import { AppGitFileOperationsUtil } from '@ee/app-git/shared/app-git-file-operations.util';
import { convertSinglePageSchemaToMultiPageSchema } from '@modules/apps/services/app-import-export.service';

// The validate method does not touch `this`, so a no-arg instance is sufficient.
const util = new (AppGitFileOperationsUtil as any)();
const convertMock = convertSinglePageSchemaToMultiPageSchema as unknown as jest.Mock;

describe('AppGitFileOperationsUtil (pure)', () => {
  beforeEach(() => convertMock.mockClear());

  describe('static resourceFolderForApp', () => {
    it('routes modules under modules/ and everything else under apps/', () => {
      expect(AppGitFileOperationsUtil.resourceFolderForApp({ type: 'module' })).toBe('modules');
      expect(AppGitFileOperationsUtil.resourceFolderForApp({ type: 'front-end' })).toBe('apps');
      expect(AppGitFileOperationsUtil.resourceFolderForApp({})).toBe('apps');
      expect(AppGitFileOperationsUtil.resourceFolderForApp(undefined as any)).toBe('apps');
    });
  });

  describe('static metaFileForApp', () => {
    it('picks moduleMeta.json for modules and appMeta.json otherwise', () => {
      expect(AppGitFileOperationsUtil.metaFileForApp({ type: 'module' })).toBe('moduleMeta.json');
      expect(AppGitFileOperationsUtil.metaFileForApp({ type: 'workflow' })).toBe('appMeta.json');
      expect(AppGitFileOperationsUtil.metaFileForApp(undefined as any)).toBe('appMeta.json');
    });
  });

  describe('validateAppJsonForImport', () => {
    // The name to assign comes from the on-disk directory (the `appName` arg), not an
    // app.json `name` field (no longer carried) — so import fails when that directory
    // name is missing, regardless of the payload.
    it('throws BadRequestException when there is no directory name to assign', () => {
      expect(() => util.validateAppJsonForImport({ schemaDetails: { multiPages: true } }, '')).toThrow(
        BadRequestException
      );
      expect(convertMock).not.toHaveBeenCalled();
    });

    it('unwraps the appV2 envelope before validating', () => {
      const result = util.validateAppJsonForImport(
        { appV2: { name: 'inner', schemaDetails: { multiPages: true } } },
        'renamed'
      );
      // appV2 payload was used (multiPages passthrough, no conversion) and name overridden.
      expect(convertMock).not.toHaveBeenCalled();
      expect(result.name).toBe('renamed');
    });

    it('passes a multi-page schema through untouched (except the name override)', () => {
      const result = util.validateAppJsonForImport(
        { name: 'orig', schemaDetails: { multiPages: true }, pages: [{ id: 'p1' }] },
        'target-name'
      );
      expect(convertMock).not.toHaveBeenCalled();
      expect(result.name).toBe('target-name');
      expect(result.pages).toEqual([{ id: 'p1' }]);
    });

    it('converts a single-page schema and stamps the requested name', () => {
      const result = util.validateAppJsonForImport({ name: 'orig' }, 'target-name');
      expect(convertMock).toHaveBeenCalledTimes(1);
      expect(result.__convertedFromSinglePage).toBe(true);
      expect(result.name).toBe('target-name');
    });
  });
});
