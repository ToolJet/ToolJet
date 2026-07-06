/** @group platform */
import { Test } from '@nestjs/testing';
import { NotificationService } from '@modules/notifications/service';
import { NotificationRepository, PersistedNotification } from '@modules/notifications/repository';
import { NOTIFICATION_CHANNELS, NOTIFICATION_TYPE } from '@modules/notifications/constants';

describe('NotificationService', () => {
  let service: NotificationService;
  let repo: jest.Mocked<NotificationRepository>;
  let inAppDeliver: jest.Mock;

  beforeEach(async () => {
    inAppDeliver = jest.fn().mockResolvedValue(undefined);
    const moduleRef = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: NotificationRepository,
          useValue: {
            createForUser: jest.fn(),
            listForUser: jest.fn(),
            unreadCount: jest.fn(),
            markRead: jest.fn(),
            markAllRead: jest.fn(),
            clearReadForUser: jest.fn(),
          },
        },
        { provide: NOTIFICATION_CHANNELS, useValue: [{ key: 'in_app', deliver: inAppDeliver }] },
      ],
    }).compile();
    service = moduleRef.get(NotificationService);
    repo = moduleRef.get(NotificationRepository);
  });

  afterEach(() => jest.resetAllMocks());

  it('should persist 1 content + 1 recipient row and dispatch in_app channel', async () => {
    repo.createForUser.mockResolvedValue({ notification: { id: 'n1' } as any, recipient: { id: 'r1' } as any });
    await service.notify({
      organizationId: 'org1',
      userId: 'u1',
      type: NOTIFICATION_TYPE.ERROR,
      title: 'Branch creation failed',
      body: 'Push to remote failed',
    });
    expect(repo.createForUser).toHaveBeenCalledTimes(1);
    expect(repo.createForUser).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: 'org1', userId: 'u1', type: 'error' })
    );
    expect(inAppDeliver).toHaveBeenCalledTimes(1);
  });

  it('should default to in_app channel only when channels omitted', async () => {
    repo.createForUser.mockResolvedValue({ notification: { id: 'n1' } as any, recipient: { id: 'r1' } as any });
    await service.notify({ organizationId: 'o', userId: 'u', type: NOTIFICATION_TYPE.INFO, title: 't' });
    expect(inAppDeliver).toHaveBeenCalledTimes(1);
  });

  it('should NOT dispatch any channel when dedupe skips the insert (idempotent)', async () => {
    repo.createForUser.mockResolvedValue(null);
    await service.notify({
      organizationId: 'o',
      userId: 'u',
      type: NOTIFICATION_TYPE.ERROR,
      title: 't',
      dedupeKey: 'job1:3',
    });
    expect(inAppDeliver).not.toHaveBeenCalled();
  });

  it('should mark one recipient read scoped to the user', async () => {
    await service.markRead('r1', 'u1');
    expect(repo.markRead).toHaveBeenCalledWith('r1', 'u1');
  });

  it('should pass the toast flag through to channel deliver', async () => {
    repo.createForUser.mockResolvedValue({
      notification: { id: 'n1' },
      recipient: { id: 'r1' },
    } as unknown as PersistedNotification);
    await service.notify({
      organizationId: 'o',
      userId: 'u',
      type: NOTIFICATION_TYPE.SUCCESS,
      title: 'Sync completed',
      toast: true,
    });
    expect(inAppDeliver).toHaveBeenCalledWith(expect.anything(), expect.anything(), { toast: true });
  });

  it('should clear read notifications scoped to the user', async () => {
    repo.clearReadForUser.mockResolvedValue(3);
    await expect(service.clearRead('u1')).resolves.toBe(3);
    expect(repo.clearReadForUser).toHaveBeenCalledWith('u1');
  });
});
