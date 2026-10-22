import { BadRequestException } from '@nestjs/common';
import { EventsController } from '@modules/versions/controllers/events.controller';
import { EventsService } from '@modules/apps/services/event.service';
import { AppVersionStatus } from '@entities/app_version.entity';
import { App } from '@entities/app.entity';

/** @group platform */
describe('EventsController on a saved or released version', () => {
  // Event writes must follow the same freeze as components and pages: the released-app viewer cache
  // doesn't watch released content, so an edit there would never reach viewers.
  const makeController = () => {
    const eventService = {
      createEvent: jest.fn(),
      bulkCreateEvents: jest.fn(),
      updateEvent: jest.fn(),
      deleteEvent: jest.fn(),
    };
    return { controller: new EventsController(eventService as unknown as EventsService), eventService };
  };
  const appWithVersion = (status: AppVersionStatus) => ({ appVersions: [{ id: 'ver-1', status }] }) as unknown as App;

  const writes: Array<
    [string, keyof ReturnType<typeof makeController>['eventService'], (c: EventsController, app: App) => unknown]
  > = [
    ['create', 'createEvent', (c, app) => c.createEvent(app, {} as never)],
    ['bulk create', 'bulkCreateEvents', (c, app) => c.bulkCreateEvents(app, {} as never)],
    ['update', 'updateEvent', (c, app) => c.updateEvents(app, { events: [], updateType: 'update' } as never)],
    ['delete', 'deleteEvent', (c, app) => c.deleteEvents(app, 'event-1')],
  ];

  describe.each([AppVersionStatus.PUBLISHED, AppVersionStatus.RELEASED])('%s version', (status) => {
    it.each(writes)('rejects %s', async (_label, method, call) => {
      const { controller, eventService } = makeController();

      await expect(async () => call(controller, appWithVersion(status))).rejects.toThrow(BadRequestException);
      expect(eventService[method]).not.toHaveBeenCalled();
    });
  });

  it.each(writes)('allows %s on a draft', async (_label, method, call) => {
    const { controller, eventService } = makeController();

    await call(controller, appWithVersion(AppVersionStatus.DRAFT));

    expect(eventService[method]).toHaveBeenCalled();
  });
});
