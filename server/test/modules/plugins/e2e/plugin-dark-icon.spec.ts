/**
 * @group platform
 */

import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { decode } from 'js-base64';
import {
  createAdmin,
  createDataSource,
  createDataSourceOption,
  ensureAppEnvironments,
  getDefaultDataSource,
  initTestApp,
  closeTestApp,
} from 'test-helper';
import { DataSource } from '@entities/data_source.entity';
import { App } from '@entities/app.entity';
import { PluginsUtilService } from '@modules/plugins/util.service';

const ICON = '<svg xmlns="http://www.w3.org/2000/svg"><path fill="#181818" d="M0 0h1v1z"/></svg>';
const DARK_ICON = '<svg xmlns="http://www.w3.org/2000/svg"><path fill="#f5f5f5" d="M0 0h1v1z"/></svg>';
const OTHER_DARK_ICON = '<svg xmlns="http://www.w3.org/2000/svg"><path fill="#ffffff" d="M0 0h1v1z"/></svg>';

const ACME = { id: 'acme', name: 'Acme', repo: '', description: 'A plugin for the tests', version: '1.0.0' };

/** What the marketplace hands over for a plugin: its files, in the order `fetchPluginFiles` returns them. */
function marketplaceFiles(darkIcon?: string) {
  const manifest = JSON.stringify({ source: { name: 'Acme', kind: 'acme' } });
  return ['module.exports = {};', '{}', ICON, manifest, undefined, {}, darkIcon];
}

describe('PluginsController | dark icon', () => {
  let app: INestApplication;
  let cookie: string[];
  let workspaceId: string;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ce' }));
  });

  beforeEach(async () => {
    const admin = await createAdmin(app, 'admin@tooljet.io');
    cookie = admin.cookie;
    workspaceId = admin.workspace.id;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  /** The marketplace is the boundary: stand in for the files it would serve. */
  function marketplaceServes(darkIcon?: string) {
    jest.spyOn(PluginsUtilService.prototype, 'fetchPluginFiles').mockResolvedValue(marketplaceFiles(darkIcon));
  }

  const as = (req: request.Test) => req.set('tj-workspace-id', workspaceId).set('Cookie', cookie);

  async function install() {
    const response = await as(request(app.getHttpServer()).post('/api/plugins/install')).send(ACME);
    expect(response.statusCode).toBe(201);
    return response.body.id as string;
  }

  async function installed() {
    const response = await as(request(app.getHttpServer()).get('/api/plugins'));
    expect(response.statusCode).toBe(200);
    return response.body.find((plugin) => plugin.pluginId === ACME.id);
  }

  describe('POST /api/plugins/install | Install a plugin', () => {
    it('should store the dark icon a plugin ships beside its icon', async () => {
      marketplaceServes(DARK_ICON);

      await install();

      const plugin = await installed();
      expect(decode(plugin.iconFile.data)).toBe(ICON);
      expect(decode(plugin.darkIconFile.data)).toBe(DARK_ICON);
    });

    it('should leave the dark icon empty for a plugin that ships none', async () => {
      marketplaceServes();

      await install();

      const plugin = await installed();
      expect(decode(plugin.iconFile.data)).toBe(ICON);
      expect(plugin.darkIconFileId).toBeNull();
      expect(plugin.darkIconFile).toBeNull();
    });
  });

  describe('a data source that uses the plugin', () => {
    /** An Acme data source with options in every environment, as the UI creates one. */
    async function acmeDataSource(pluginId: string) {
      const environments = await ensureAppEnvironments(app, workspaceId);
      const dataSource = await createDataSource(app, {
        application: { organizationId: workspaceId } as App,
        name: 'acme data source',
        kind: ACME.id,
        type: 'default',
      });
      // The list only shows a data source that has options in the environment.
      for (const environment of environments) {
        await createDataSourceOption(app, { dataSource, environmentId: environment.id, options: [] });
      }
      await getDefaultDataSource().getRepository(DataSource).update(dataSource.id, { pluginId, scope: 'global' });
      return { dataSource, environments };
    }

    it('GET /api/data-sources/:organizationId should list it with the dark icon', async () => {
      marketplaceServes(DARK_ICON);
      const { dataSource } = await acmeDataSource(await install());

      const response = await as(request(app.getHttpServer()).get(`/api/data-sources/${workspaceId}`));

      expect(response.statusCode).toBe(200);
      const listed = response.body.data_sources.find((source) => source.id === dataSource.id);
      expect(decode(listed.plugin.iconFile.data)).toBe(ICON);
      expect(decode(listed.plugin.darkIconFile.data)).toBe(DARK_ICON);
    });

    it('GET /api/data-sources/:id/environment/:environment_id should return it with the dark icon', async () => {
      marketplaceServes(DARK_ICON);
      const { dataSource, environments } = await acmeDataSource(await install());

      const response = await as(
        request(app.getHttpServer()).get(`/api/data-sources/${dataSource.id}/environment/${environments[0].id}`)
      );

      expect(response.statusCode).toBe(200);
      expect(decode(response.body.plugin.iconFile.data)).toBe(ICON);
      expect(decode(response.body.plugin.darkIconFile.data)).toBe(DARK_ICON);
    });

    it('should have no dark icon when the plugin ships none', async () => {
      marketplaceServes();
      const { dataSource } = await acmeDataSource(await install());

      const response = await as(request(app.getHttpServer()).get(`/api/data-sources/${workspaceId}`));

      const listed = response.body.data_sources.find((source) => source.id === dataSource.id);
      expect(decode(listed.plugin.iconFile.data)).toBe(ICON);
      expect(listed.plugin.darkIconFile).toBeNull();
    });
  });

  describe('POST /api/plugins/:id/reload | Reload a plugin', () => {
    it('should pick up a dark icon the plugin has gained', async () => {
      marketplaceServes();
      const id = await install();

      marketplaceServes(DARK_ICON);
      await as(request(app.getHttpServer()).post(`/api/plugins/${id}/reload`)).expect(201);

      expect(decode((await installed()).darkIconFile.data)).toBe(DARK_ICON);
    });

    it('should replace a dark icon that changed, in the same file', async () => {
      marketplaceServes(DARK_ICON);
      const id = await install();
      const before = await installed();

      marketplaceServes(OTHER_DARK_ICON);
      await as(request(app.getHttpServer()).post(`/api/plugins/${id}/reload`)).expect(201);

      const after = await installed();
      expect(decode(after.darkIconFile.data)).toBe(OTHER_DARK_ICON);
      expect(after.darkIconFileId).toBe(before.darkIconFileId);
      expect(decode(after.iconFile.data)).toBe(ICON);
    });

    it('should drop a dark icon the plugin no longer ships', async () => {
      marketplaceServes(DARK_ICON);
      const id = await install();

      marketplaceServes();
      await as(request(app.getHttpServer()).post(`/api/plugins/${id}/reload`)).expect(201);

      const plugin = await installed();
      expect(plugin.darkIconFile).toBeNull();
      expect(decode(plugin.iconFile.data)).toBe(ICON);
    });
  });

  describe('PATCH /api/plugins/:id | Upgrade a plugin', () => {
    it('should pick up a dark icon the new version ships', async () => {
      marketplaceServes();
      const id = await install();

      marketplaceServes(DARK_ICON);
      await as(request(app.getHttpServer()).patch(`/api/plugins/${id}`))
        .send({ pluginId: ACME.id, repo: '', version: '1.1.0' })
        .expect(200);

      const plugin = await installed();
      expect(plugin.version).toBe('1.1.0');
      expect(decode(plugin.darkIconFile.data)).toBe(DARK_ICON);
    });

    it('should drop a dark icon the new version no longer ships', async () => {
      marketplaceServes(DARK_ICON);
      const id = await install();

      marketplaceServes();
      await as(request(app.getHttpServer()).patch(`/api/plugins/${id}`))
        .send({ pluginId: ACME.id, repo: '', version: '1.1.0' })
        .expect(200);

      expect((await installed()).darkIconFile).toBeNull();
    });
  });
});
