/**
 * DataSourceBranchUtil — cloneDataSourceVersions / snapshotDataSourcesForVersion.
 *
 * Pure data-transformation over an EntityManager: id remapping (DSV → new DSV, credential →
 * new credential) and stitching those new ids through the options JSON, then chunked inserts.
 * The manager is a fake; dbTransactionWrap is stubbed to invoke its callback with it. No DB.
 *
 * @group gitsync
 */
jest.mock('@helpers/database.helper', () => ({
  dbTransactionWrap: jest.fn((operation: any) => operation(globalThis.__dsbManager)),
}));

import { DataSourceBranchUtil } from '@ee/app-git/shared/datasource-branch.util';
import { DataSourceVersion } from '@entities/data_source_version.entity';
import { DataSourceVersionOptions } from '@entities/data_source_version_options.entity';
import { Credential } from '@entities/credential.entity';

describe('DataSourceBranchUtil', () => {
  let util: DataSourceBranchUtil;
  let manager: { find: jest.Mock; insert: jest.Mock };
  const inserts: Array<{ entity: any; rows: any[] }> = [];

  const findFor = (map: Map<any, any[]>) => jest.fn((entity: any) => Promise.resolve(map.get(entity) ?? []));

  beforeEach(() => {
    inserts.length = 0;
    manager = {
      find: jest.fn().mockResolvedValue([]),
      insert: jest.fn((entity: any, rows: any[]) => {
        inserts.push({ entity, rows });
        return Promise.resolve(undefined);
      }),
    };
    (globalThis as any).__dsbManager = manager;
    util = new DataSourceBranchUtil();
  });

  const rowsFor = (entity: any) => inserts.filter((i) => i.entity === entity).flatMap((i) => i.rows);

  describe('cloneDataSourceVersions', () => {
    it('is a no-op when the source branch has no datasource versions', async () => {
      manager.find.mockResolvedValue([]); // source DSVs empty
      await util.cloneDataSourceVersions('src', 'tgt', manager as any);
      expect(manager.insert).not.toHaveBeenCalled();
    });

    it('clones DSVs onto the target branch, remapping credential ids inside the options JSON', async () => {
      const srcDsv = { id: 'dsv-1', dataSourceId: 'ds-1', name: 'pg', isActive: true, isSynced: true };
      const srcOpt = {
        id: 'opt-1',
        dataSourceVersionId: 'dsv-1',
        environmentId: 'env-1',
        options: {
          password: { credential_id: 'cred-1', encrypted: true },
          host: { value: 'localhost', encrypted: false },
        },
      };
      const srcCred = { id: 'cred-1', valueCiphertext: 'CIPHER' };
      manager.find = findFor(
        new Map<any, any[]>([
          [DataSourceVersion, [srcDsv]],
          [DataSourceVersionOptions, [srcOpt]],
          [Credential, [srcCred]],
        ])
      );

      await util.cloneDataSourceVersions('src', 'tgt', manager as any);

      // New credential row inserted with a fresh id but the same ciphertext.
      const cred = rowsFor(Credential);
      expect(cred).toHaveLength(1);
      expect(cred[0].valueCiphertext).toBe('CIPHER');
      expect(cred[0].id).not.toBe('cred-1');

      // New DSV points at the TARGET branch and tracks its source via versionFromId.
      const dsv = rowsFor(DataSourceVersion);
      expect(dsv).toHaveLength(1);
      expect(dsv[0]).toMatchObject({ branchId: 'tgt', dataSourceId: 'ds-1', versionFromId: 'dsv-1', isSynced: true });
      expect(dsv[0].id).not.toBe('dsv-1');

      // DSVO stitched to the new DSV id, and the encrypted credential_id remapped to the new credential.
      const dsvo = rowsFor(DataSourceVersionOptions);
      expect(dsvo).toHaveLength(1);
      expect(dsvo[0].dataSourceVersionId).toBe(dsv[0].id);
      expect(dsvo[0].options.password.credential_id).toBe(cred[0].id);
      // Non-encrypted option left untouched.
      expect(dsvo[0].options.host).toEqual({ value: 'localhost', encrypted: false });
    });

    it('inserts no credentials when no option references an encrypted credential', async () => {
      manager.find = findFor(
        new Map<any, any[]>([
          [DataSourceVersion, [{ id: 'dsv-1', dataSourceId: 'ds-1', name: 'rest' }]],
          [DataSourceVersionOptions, [{ id: 'o', dataSourceVersionId: 'dsv-1', options: { url: { value: 'x' } } }]],
        ])
      );
      await util.cloneDataSourceVersions('src', 'tgt', manager as any);
      expect(rowsFor(Credential)).toHaveLength(0);
      expect(rowsFor(DataSourceVersion)).toHaveLength(1);
    });
  });

  describe('snapshotDataSourcesForVersion', () => {
    it('is a no-op when the branch has no active datasource versions', async () => {
      manager.find.mockResolvedValue([]);
      await util.snapshotDataSourcesForVersion('appv-1', 'branch-1');
      expect(manager.insert).not.toHaveBeenCalled();
    });

    it('snapshots active DSVs anchored on the app version, preserving options', async () => {
      const branchDsv = { id: 'dsv-9', dataSourceId: 'ds-9', name: 'pg' };
      const opt = { id: 'o9', dataSourceVersionId: 'dsv-9', environmentId: 'env', options: { a: 1 } };
      manager.find = findFor(
        new Map<any, any[]>([
          [DataSourceVersion, [branchDsv]],
          [DataSourceVersionOptions, [opt]],
        ])
      );

      await util.snapshotDataSourcesForVersion('appv-1', 'branch-1');

      const dsv = rowsFor(DataSourceVersion);
      expect(dsv).toHaveLength(1);
      expect(dsv[0]).toMatchObject({
        appVersionId: 'appv-1',
        dataSourceId: 'ds-9',
        versionFromId: 'dsv-9',
        isActive: true,
      });

      const dsvo = rowsFor(DataSourceVersionOptions);
      expect(dsvo[0].dataSourceVersionId).toBe(dsv[0].id); // stitched to the snapshot DSV
      expect(dsvo[0].options).toEqual({ a: 1 });
    });
  });
});
