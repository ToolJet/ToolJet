import { INestApplication } from '@nestjs/common';
import {
  createUser,
  initTestApp,
  closeTestApp,
  createApplication,
  createApplicationVersion,
  createDataSource,
  createDataQuery,
  saveEntity,
} from 'test-helper';
import { Page } from '@entities/page.entity';
import { Component } from '@entities/component.entity';
import { VersionRepository } from '@modules/versions/repository';

/**
 * Regression coverage for VersionRepository.countVersionEntities — the background-job
 * threshold check (tj-ee#5486) needs a single COUNT query: components across all pages
 * of a version + that version's data queries, scoped strictly to the given version.
 */
/** @group platform */
describe('VersionRepository.countVersionEntities', () => {
  let nestApp: INestApplication;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  it('counts components across all pages plus data queries of the version, and does not leak across versions', async () => {
    const adminData = await createUser(nestApp, { email: 'cve-admin1@tooljet.io', groups: ['all_users', 'admin'] });
    const app = await createApplication(nestApp, { name: 'CVE-App', user: adminData.user });

    const version = await createApplicationVersion(nestApp, app as any);

    const page1 = await saveEntity(Page, {
      name: 'Page 1',
      handle: 'page-1',
      appVersionId: version.id,
      index: 2,
    });
    const page2 = await saveEntity(Page, {
      name: 'Page 2',
      handle: 'page-2',
      appVersionId: version.id,
      index: 3,
    });

    for (let i = 0; i < 3; i++) {
      await saveEntity(Component, { name: `p1-c${i}`, type: 'Text', pageId: page1.id });
    }
    for (let i = 0; i < 4; i++) {
      await saveEntity(Component, { name: `p2-c${i}`, type: 'Text', pageId: page2.id });
    }

    const dataSource = await createDataSource(nestApp, { appVersion: version, name: 'restapi1', kind: 'restapi' });
    for (let i = 0; i < 5; i++) {
      await createDataQuery(nestApp, { name: `query${i}`, dataSource, appVersion: version });
    }

    const versionRepository = nestApp.get(VersionRepository);

    await expect(versionRepository.countVersionEntities(version.id)).resolves.toBe(12);

    // Second version with its own entity should not leak into the first version's count.
    const otherVersion = await createApplicationVersion(nestApp, app as any, { name: 'v-other' });
    await saveEntity(Page, {
      name: 'Other Page',
      handle: 'other-page',
      appVersionId: otherVersion.id,
      index: 1,
    }).then((otherPage) => saveEntity(Component, { name: 'o-c0', type: 'Text', pageId: otherPage.id }));

    await expect(versionRepository.countVersionEntities(version.id)).resolves.toBe(12);
  });
});
