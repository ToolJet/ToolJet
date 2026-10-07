/**
 * @group platform
 */

/**
 * Shared version behavior (validation, promote targets, release gate, list filters) is covered in
 * app-versions-v2; this file covers what differs for workflows.
 */

import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import {
  createUser,
  initTestApp,
  closeTestApp,
  createApplication,
  createApplicationVersion,
  getDefaultDataSource,
  saveEntity,
} from 'test-helper';
import { APP_TYPES } from '@modules/apps/constants';
import { App } from '@entities/app.entity';
import { AppVersion, AppVersionStatus } from '@entities/app_version.entity';
import { AppEnvironment } from '@entities/app_environments.entity';
import { WorkflowSchedule } from '@entities/workflow_schedule.entity';

jest.setTimeout(120_000);

let extApiToken: string;
const getExtAuth = () => `Basic ${extApiToken}`;

function base(workspaceId: string, workflowId: string) {
  return `/api/v2/ext/workspaces/${workspaceId}/workflows/${workflowId}/versions`;
}

describe('ExternalApisWorkflowVersionsControllerV2 (EE enterprise)', () => {
  let app: INestApplication;
  let versionRepo: Repository<AppVersion>;
  let envRepo: Repository<AppEnvironment>;
  let appRepo: Repository<App>;
  let scheduleRepo: Repository<WorkflowSchedule>;

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    extApiToken = app.get(ConfigService).get<string>('EXTERNAL_API_ACCESS_TOKEN');
    const ds = getDefaultDataSource();
    versionRepo = ds.getRepository(AppVersion);
    envRepo = ds.getRepository(AppEnvironment);
    appRepo = ds.getRepository(App);
    scheduleRepo = ds.getRepository(WorkflowSchedule);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(app);
  }, 60000);

  async function seedWorkspace(tag: string) {
    const { user } = await createUser(app, { email: `wvv2-${tag}-${Date.now()}@tooljet.io` });
    const workflow = await createApplication(app, {
      name: `Workflow ${tag} ${Date.now()}`,
      user,
      type: APP_TYPES.WORKFLOW,
    });
    const production = await envRepo.findOneOrFail({
      where: { organizationId: user.organizationId, isDefault: true },
    });
    return { user, orgId: user.organizationId, workflow, production };
  }

  async function seedVersion(workflow: App, status: AppVersionStatus): Promise<AppVersion> {
    const version = await createApplicationVersion(app, workflow as App & { organizationId: string }, { name: 'v' });
    await versionRepo.update(version.id, { status });
    return versionRepo.findOneOrFail({ where: { id: version.id } });
  }

  it('should take a workflow version from a new draft through save, promote and release', async () => {
    const { orgId, workflow, production } = await seedWorkspace('lifecycle');
    const source = await seedVersion(workflow, AppVersionStatus.PUBLISHED);

    const created = await request(app.getHttpServer())
      .post(base(orgId, workflow.id))
      .set('Authorization', getExtAuth())
      .send({ name: 'v3.5.0', description: 'Hourly cadence', version_from_id: source.id })
      .expect(201);
    expect(created.body).toMatchObject({ status: 'draft', parent_version_id: source.id });

    const versionPath = `${base(orgId, workflow.id)}/${created.body.id}`;
    await request(app.getHttpServer()).post(`${versionPath}/save`).set('Authorization', getExtAuth()).expect(200);
    await request(app.getHttpServer())
      .post(`${versionPath}/promote`)
      .set('Authorization', getExtAuth())
      .send({ target_environment_id: production.id })
      .expect(200);
    const released = await request(app.getHttpServer())
      .post(`${versionPath}/release`)
      .set('Authorization', getExtAuth())
      .expect(200);

    expect(released.body).toMatchObject({ status: 'released', environment_id: production.id });
    const releasedWorkflow = await appRepo.findOneOrFail({ where: { id: workflow.id } });
    expect(releasedWorkflow.currentVersionId).toBe(created.body.id);
  });

  it('should stop the scheduled runs of a deleted version', async () => {
    const { orgId, workflow, production } = await seedWorkspace('schedules');
    await seedVersion(workflow, AppVersionStatus.PUBLISHED);
    const scheduled = await seedVersion(workflow, AppVersionStatus.PUBLISHED);
    const schedule = await saveEntity(WorkflowSchedule, {
      workflowId: scheduled.id,
      environmentId: production.id,
      active: true,
      type: 'cron',
      timezone: 'UTC',
      details: { cron: '0 * * * *' },
    } as Partial<WorkflowSchedule>);
    const emitSpy = jest.spyOn(app.get(EventEmitter2), 'emit').mockReturnValue(true);

    await request(app.getHttpServer())
      .delete(`${base(orgId, workflow.id)}/${scheduled.id}`)
      .set('Authorization', getExtAuth())
      .expect(204);

    expect(emitSpy).toHaveBeenCalledWith('app.deleted', { appId: workflow.id, scheduleIds: [schedule.id] });
    expect(await scheduleRepo.findOne({ where: { id: schedule.id } })).toBeNull();
  });

  it('should not edit the released version of a workflow', async () => {
    const { orgId, workflow } = await seedWorkspace('released-edit');
    const released = await seedVersion(workflow, AppVersionStatus.DRAFT);
    await appRepo.update(workflow.id, { currentVersionId: released.id });

    await request(app.getHttpServer())
      .patch(`${base(orgId, workflow.id)}/${released.id}`)
      .set('Authorization', getExtAuth())
      .send({ name: 'renamed' })
      .expect(400);

    const unchanged = await versionRepo.findOneOrFail({ where: { id: released.id } });
    expect(unchanged.name).toBe(released.name);
  });

  it('should not address a workflow through the app routes, or an app through the workflow routes', async () => {
    const { user, orgId, workflow } = await seedWorkspace('cross-type');
    const workflowVersion = await seedVersion(workflow, AppVersionStatus.DRAFT);
    const frontEnd = await createApplication(app, { name: `Front end ${Date.now()}`, user });

    await request(app.getHttpServer())
      .get(`/api/v2/ext/workspaces/${orgId}/apps/${workflow.id}/versions/${workflowVersion.id}`)
      .set('Authorization', getExtAuth())
      .expect(404);
    await request(app.getHttpServer()).get(base(orgId, frontEnd.id)).set('Authorization', getExtAuth()).expect(404);
  });
});
