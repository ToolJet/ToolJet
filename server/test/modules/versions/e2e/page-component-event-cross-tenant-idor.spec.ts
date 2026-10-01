/**
 * Regression for tj-ee#5468 (page/component/event IDOR via bare resource id).
 * @group platform
 */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  initTestApp,
  createBuilder,
  createApplication,
  createApplicationVersion,
  closeTestApp,
  saveEntity,
  updateEntity,
  findEntity,
  findEntityOrFail,
} from 'test-helper';
import { Page } from '@entities/page.entity';
import { Component } from '@entities/component.entity';
import { EventHandler, Target } from '@entities/event_handler.entity';
import { AppVersion, AppVersionStatus } from '@entities/app_version.entity';

describe('Page/Component/EventHandler cross-tenant IDOR', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;

    beforeAll(async () => {
      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
    });

    afterAll(async () => {
      await closeTestApp(app);
    }, 60_000);

    async function seedAttacker() {
      const attacker = await createBuilder(app, `attacker-${Date.now()}-${Math.random()}@tooljet.io`);
      const attackerApp = await createApplication(app, { name: 'attacker-app', user: attacker.user as any });
      const attackerVersion = await createApplicationVersion(app, attackerApp as any);
      // status has no DB default (comes back NULL, not undefined) — assertVersionEditable only
      // special-cases `undefined`, so an unset status 400s every mutate route via GitSyncEditGuard.
      await updateEntity(AppVersion, attackerVersion.id, { status: AppVersionStatus.DRAFT } as any);
      attackerVersion.status = AppVersionStatus.DRAFT;
      return { attacker, attackerApp, attackerVersion };
    }

    async function seedVictim() {
      const victim = await createBuilder(app, `victim-${Date.now()}-${Math.random()}@tooljet.io`);
      const victimApp = await createApplication(app, { name: 'victim-app', user: victim.user as any });
      const victimVersion = await createApplicationVersion(app, victimApp as any);
      return { victim, victimApp, victimVersion };
    }

    async function seedComponent(pageId: string, name = 'victim-text') {
      return saveEntity(Component, {
        name,
        type: 'Text',
        pageId,
        properties: { text: { value: 'Welcome, Victim!' } },
        general: {},
        styles: {},
        generalStyles: {},
        validation: {},
      } as any);
    }

    describe('PagesController', () => {
      it('should not allow updatePage across organizations', async () => {
        const { attacker, attackerApp, attackerVersion } = await seedAttacker();
        const { victimVersion } = await seedVictim();
        const victimPage = await findEntityOrFail(Page, { appVersionId: victimVersion.id } as any);

        const res = await request(app.getHttpServer())
          .put(`/api/v2/apps/${attackerApp.id}/versions/${attackerVersion.id}/pages`)
          .set('tj-workspace-id', attacker.user.defaultOrganizationId)
          .set('Cookie', attacker.cookie)
          .send({ pageId: victimPage.id, diff: { name: 'HACKED-BY-ATTACKER' } });
        expect(res.status).not.toBe(200);

        const stillVictim = await findEntityOrFail(Page, { id: victimPage.id } as any);
        expect(stillVictim.name).toBe(victimPage.name);
      });

      it('should not allow deletePage across organizations', async () => {
        const { attacker, attackerApp, attackerVersion } = await seedAttacker();
        const { victimVersion } = await seedVictim();
        const victimPage = await findEntityOrFail(Page, { appVersionId: victimVersion.id } as any);

        const res = await request(app.getHttpServer())
          .delete(`/api/v2/apps/${attackerApp.id}/versions/${attackerVersion.id}/pages`)
          .set('tj-workspace-id', attacker.user.defaultOrganizationId)
          .set('Cookie', attacker.cookie)
          .send({ pageId: victimPage.id, deleteAssociatedPages: false });
        expect(res.status).not.toBe(200);

        const stillThere = await findEntity(Page, { id: victimPage.id } as any);
        expect(stillThere).toBeTruthy();
      });

      it("deletePage's home-page protection isn't bypassed by targeting a different organization's home page", async () => {
        const { attacker, attackerApp, attackerVersion } = await seedAttacker();
        const { victimVersion } = await seedVictim();
        // The seeded default page IS the victim's home page — the pre-fix code compared against
        // the ATTACKER's own homePageId here, so this must stay blocked for the right reason.
        expect(victimVersion.homePageId).toBeTruthy();

        const res = await request(app.getHttpServer())
          .delete(`/api/v2/apps/${attackerApp.id}/versions/${attackerVersion.id}/pages`)
          .set('tj-workspace-id', attacker.user.defaultOrganizationId)
          .set('Cookie', attacker.cookie)
          .send({ pageId: victimVersion.homePageId, deleteAssociatedPages: false });
        expect(res.status).not.toBe(200);

        const stillThere = await findEntity(Page, { id: victimVersion.homePageId } as any);
        expect(stillThere).toBeTruthy();
      });

      it('should not allow reorderPages across organizations', async () => {
        const { attacker, attackerApp, attackerVersion } = await seedAttacker();
        const { victimVersion } = await seedVictim();
        const victimPage = await findEntityOrFail(Page, { appVersionId: victimVersion.id } as any);
        const originalIndex = victimPage.index;
        const originalPageGroupIndex = victimPage.pageGroupIndex;

        await request(app.getHttpServer())
          .put(`/api/v2/apps/${attackerApp.id}/versions/${attackerVersion.id}/pages/reorder`)
          .set('tj-workspace-id', attacker.user.defaultOrganizationId)
          .set('Cookie', attacker.cookie)
          .send({ diff: { [victimPage.id]: { index: originalIndex + 5, pageGroupId: null } } });

        // EE's reorderPages has its own full reimplementation (server/ee/apps/services/page.util.service.ts)
        // that writes `index` or `pageGroupIndex` depending on a license flag — check both regardless
        // of which branch this test env resolves to.
        const stillThere = await findEntityOrFail(Page, { id: victimPage.id } as any);
        expect(stillThere.index).toBe(originalIndex);
        expect(stillThere.pageGroupIndex).toBe(originalPageGroupIndex);
      });

      it('legitimate same-app updatePage still works', async () => {
        const { attacker, attackerApp, attackerVersion } = await seedAttacker();
        const ownPage = await findEntityOrFail(Page, { appVersionId: attackerVersion.id } as any);

        await request(app.getHttpServer())
          .put(`/api/v2/apps/${attackerApp.id}/versions/${attackerVersion.id}/pages`)
          .set('tj-workspace-id', attacker.user.defaultOrganizationId)
          .set('Cookie', attacker.cookie)
          .send({ pageId: ownPage.id, diff: { name: 'renamed-by-owner' } })
          .expect(200);

        const updated = await findEntityOrFail(Page, { id: ownPage.id } as any);
        expect(updated.name).toBe('renamed-by-owner');
      });
    });

    describe('ComponentsController', () => {
      it('should not allow updateComponents across organizations', async () => {
        const { attacker, attackerApp, attackerVersion } = await seedAttacker();
        const { victimVersion } = await seedVictim();
        const victimPage = await findEntityOrFail(Page, { appVersionId: victimVersion.id } as any);
        const victimComponent = await seedComponent(victimPage.id);

        await request(app.getHttpServer())
          .put(`/api/v2/apps/${attackerApp.id}/versions/${attackerVersion.id}/components`)
          .set('tj-workspace-id', attacker.user.defaultOrganizationId)
          .set('Cookie', attacker.cookie)
          .send({
            is_user_switched_version: false,
            pageId: victimPage.id,
            diff: {
              [victimComponent.id]: { component: { definition: { properties: { text: { value: 'HACKED' } } } } },
            },
          });

        const stillThere = await findEntityOrFail(Component, { id: victimComponent.id } as any);
        expect((stillThere.properties as any)?.text?.value).toBe('Welcome, Victim!');
      });

      it('should not allow deleteComponents across organizations', async () => {
        const { attacker, attackerApp, attackerVersion } = await seedAttacker();
        const ownPage = await findEntityOrFail(Page, { appVersionId: attackerVersion.id } as any);
        const { victimVersion } = await seedVictim();
        const victimPage = await findEntityOrFail(Page, { appVersionId: victimVersion.id } as any);
        const victimComponent = await seedComponent(victimPage.id);

        const res = await request(app.getHttpServer())
          .delete(`/api/v2/apps/${attackerApp.id}/versions/${attackerVersion.id}/components`)
          .set('tj-workspace-id', attacker.user.defaultOrganizationId)
          .set('Cookie', attacker.cookie)
          // is_user_switched_version/pageId are DTO-required but unused by the service itself
          // (the controller never forwards pageId downstream) — any valid values satisfy validation.
          .send({
            diff: [victimComponent.id],
            is_component_cut: false,
            is_user_switched_version: false,
            pageId: ownPage.id,
          });
        expect(res.status).not.toBe(400);

        const stillThere = await findEntity(Component, { id: victimComponent.id } as any);
        expect(stillThere).toBeTruthy();
      });

      it('deleteComponents does not delete an in-scope id just because it was batched with an out-of-scope one', async () => {
        const { attacker, attackerApp, attackerVersion } = await seedAttacker();
        const ownPage = await findEntityOrFail(Page, { appVersionId: attackerVersion.id } as any);
        const ownComponent = await seedComponent(ownPage.id, 'attacker-own-component');
        const { victimVersion } = await seedVictim();
        const victimPage = await findEntityOrFail(Page, { appVersionId: victimVersion.id } as any);
        const victimComponent = await seedComponent(victimPage.id);

        const res = await request(app.getHttpServer())
          .delete(`/api/v2/apps/${attackerApp.id}/versions/${attackerVersion.id}/components`)
          .set('tj-workspace-id', attacker.user.defaultOrganizationId)
          .set('Cookie', attacker.cookie)
          .send({
            diff: [ownComponent.id, victimComponent.id],
            is_component_cut: false,
            is_user_switched_version: false,
            pageId: ownPage.id,
          });
        expect(res.status).not.toBe(400);

        const victimStillThere = await findEntity(Component, { id: victimComponent.id } as any);
        expect(victimStillThere).toBeTruthy();
        // And the in-scope one really was deleted — proves this isn't a DTO-validation false pass.
        const ownStillThere = await findEntity(Component, { id: ownComponent.id } as any);
        expect(ownStillThere).toBeFalsy();
      });

      it('legitimate same-app updateComponents still works', async () => {
        const { attacker, attackerApp, attackerVersion } = await seedAttacker();
        const ownPage = await findEntityOrFail(Page, { appVersionId: attackerVersion.id } as any);
        const ownComponent = await seedComponent(ownPage.id, 'attacker-own-component');

        await request(app.getHttpServer())
          .put(`/api/v2/apps/${attackerApp.id}/versions/${attackerVersion.id}/components`)
          .set('tj-workspace-id', attacker.user.defaultOrganizationId)
          .set('Cookie', attacker.cookie)
          .send({
            is_user_switched_version: false,
            pageId: ownPage.id,
            diff: {
              [ownComponent.id]: { component: { definition: { properties: { text: { value: 'self-edit-ok' } } } } },
            },
          })
          .expect(200);

        const updated = await findEntityOrFail(Component, { id: ownComponent.id } as any);
        expect((updated.properties as any)?.text?.value).toBe('self-edit-ok');
      });
    });

    describe('EventsController', () => {
      async function seedEvent(appVersionId: string, sourceComponentId: string) {
        return saveEntity(EventHandler, {
          name: 'victimOnClick',
          sourceId: sourceComponentId,
          target: Target.component,
          event: { actionId: 'show-alert', message: 'hello from victim', alertType: 'info' },
          index: 0,
          appVersionId,
        } as any);
      }

      it('should not allow updateEvent across organizations, and the response does not disclose victim internals', async () => {
        const { attacker, attackerApp, attackerVersion } = await seedAttacker();
        const { victimVersion } = await seedVictim();
        const victimPage = await findEntityOrFail(Page, { appVersionId: victimVersion.id } as any);
        const victimComponent = await seedComponent(victimPage.id);
        const victimEvent = await seedEvent(victimVersion.id, victimComponent.id);

        const res = await request(app.getHttpServer())
          .put(`/api/v2/apps/${attackerApp.id}/versions/${attackerVersion.id}/events`)
          .set('tj-workspace-id', attacker.user.defaultOrganizationId)
          .set('Cookie', attacker.cookie)
          .send({
            events: [
              {
                event_id: victimEvent.id,
                diff: {
                  name: 'HACKED-EVENT',
                  index: 0,
                  event: { actionId: 'show-alert', message: 'pwned', alertType: 'error' },
                },
              },
            ],
            updateType: 'update',
          });
        // updateEvent isolates failures per-event (Promise.all resolves to a BadRequestException
        // object rather than throwing) so the outer HTTP status stays 200 even on a blocked id —
        // that's pre-existing, unrelated to this fix. Assert on the per-event result instead.
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0]?.message).toBe('No event found');
        // Pre-fix, a successful response spread the victim's real sourceId/appVersionId back —
        // guard against that even with the per-event error shape above.
        const body = JSON.stringify(res.body ?? {});
        expect(body).not.toContain(victimComponent.id);
        expect(body).not.toContain(victimVersion.id);
        expect(body).not.toContain('HACKED-EVENT');

        const stillThere = await findEntityOrFail(EventHandler, { id: victimEvent.id } as any);
        expect(stillThere.name).toBe('victimOnClick');
      });

      it('should not allow deleteEvent across organizations', async () => {
        const { attacker, attackerApp, attackerVersion } = await seedAttacker();
        const { victimVersion } = await seedVictim();
        const victimPage = await findEntityOrFail(Page, { appVersionId: victimVersion.id } as any);
        const victimComponent = await seedComponent(victimPage.id);
        const victimEvent = await seedEvent(victimVersion.id, victimComponent.id);

        await request(app.getHttpServer())
          .delete(`/api/v2/apps/${attackerApp.id}/versions/${attackerVersion.id}/events/${victimEvent.id}`)
          .set('tj-workspace-id', attacker.user.defaultOrganizationId)
          .set('Cookie', attacker.cookie)
          .send({});

        const stillThere = await findEntity(EventHandler, { id: victimEvent.id } as any);
        expect(stillThere).toBeTruthy();
      });

      it('legitimate same-app updateEvent still works', async () => {
        const { attacker, attackerApp, attackerVersion } = await seedAttacker();
        const ownPage = await findEntityOrFail(Page, { appVersionId: attackerVersion.id } as any);
        const ownComponent = await seedComponent(ownPage.id, 'attacker-own-component');
        const ownEvent = await seedEvent(attackerVersion.id, ownComponent.id);

        await request(app.getHttpServer())
          .put(`/api/v2/apps/${attackerApp.id}/versions/${attackerVersion.id}/events`)
          .set('tj-workspace-id', attacker.user.defaultOrganizationId)
          .set('Cookie', attacker.cookie)
          .send({
            events: [{ event_id: ownEvent.id, diff: { name: 'self-edit-ok', index: 0, event: ownEvent.event } }],
            updateType: 'update',
          })
          .expect(200);

        const updated = await findEntityOrFail(EventHandler, { id: ownEvent.id } as any);
        expect(updated.name).toBe('self-edit-ok');
      });
    });

    describe('ComponentsController | componentLayoutChange and batchOperations', () => {
      it('should not allow updateComponentLayout (componentLayoutChange) across organizations', async () => {
        const { attacker, attackerApp, attackerVersion } = await seedAttacker();
        const ownPage = await findEntityOrFail(Page, { appVersionId: attackerVersion.id } as any);
        const { victimVersion } = await seedVictim();
        const victimPage = await findEntityOrFail(Page, { appVersionId: victimVersion.id } as any);
        const victimComponent = await seedComponent(victimPage.id);
        expect(victimComponent.parent).toBeFalsy();

        const res = await request(app.getHttpServer())
          .put(`/api/v2/apps/${attackerApp.id}/versions/${attackerVersion.id}/components/layout`)
          .set('tj-workspace-id', attacker.user.defaultOrganizationId)
          .set('Cookie', attacker.cookie)
          .send({
            is_user_switched_version: false,
            pageId: ownPage.id,
            diff: {
              [victimComponent.id]: {
                layouts: { desktop: { top: 999, left: 999, width: 10, height: 10 } },
                component: { parent: 'fake-attacker-supplied-parent' },
              },
            },
          });
        expect(res.status).not.toBe(400);

        const stillThere = await findEntityOrFail(Component, { id: victimComponent.id } as any);
        expect(stillThere.parent).toBeFalsy();
      });

      it('should not allow batch layout updates (updateComponentLayouts) to reach a different organization', async () => {
        const { attacker, attackerApp, attackerVersion } = await seedAttacker();
        const { victimVersion } = await seedVictim();
        const victimPage = await findEntityOrFail(Page, { appVersionId: victimVersion.id } as any);
        const victimComponent = await seedComponent(victimPage.id);
        expect(victimComponent.parent).toBeFalsy();

        await request(app.getHttpServer())
          .put(`/api/v2/apps/${attackerApp.id}/versions/${attackerVersion.id}/components/batch`)
          .set('tj-workspace-id', attacker.user.defaultOrganizationId)
          .set('Cookie', attacker.cookie)
          .send({
            diff: {
              layout: {
                diff: {
                  [victimComponent.id]: {
                    layouts: { desktop: { top: 999, left: 999, width: 10, height: 10 } },
                    component: { parent: 'fake-attacker-supplied-parent' },
                  },
                },
              },
            },
          });

        const stillThere = await findEntityOrFail(Component, { id: victimComponent.id } as any);
        expect(stillThere.parent).toBeFalsy();
      });
    });
  });
});
