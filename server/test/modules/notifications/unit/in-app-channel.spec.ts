/// <reference types="jest" />
import { InAppChannel } from '@modules/notifications/channels/in-app.channel';
import { NOTIFICATION_REALTIME_CHANNEL } from '@modules/notifications/constants';
import { Notification } from '@entities/notification.entity';
import { NotificationRecipient } from '@entities/notification-recipient.entity';

/** @group notifications */
describe('InAppChannel — realtime publish', () => {
  const publish = jest.fn();
  const redisService = { getClient: () => ({ publish }) } as unknown as ConstructorParameters<typeof InAppChannel>[0];

  let channel: InAppChannel;

  beforeEach(() => {
    publish.mockReset();
    channel = new InAppChannel(redisService);
  });

  const event = {
    id: 'n1',
    organizationId: 'org1',
    type: 'error',
    title: 'Git sync failed',
    body: 'Authentication failed',
    link: 'git-sync-modal',
    metadata: { source: 'git-sync' },
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  } as unknown as Notification;
  const recipient = { id: 'r1', userId: 'u1' } as unknown as NotificationRecipient;

  it('publishes the notification payload to the realtime channel keyed by recipient user', async () => {
    await channel.deliver(event, recipient);

    expect(publish).toHaveBeenCalledTimes(1);
    const [channelName, raw] = publish.mock.calls[0];
    expect(channelName).toBe(NOTIFICATION_REALTIME_CHANNEL);
    const msg = JSON.parse(raw);
    expect(msg.userId).toBe('u1');
    expect(msg.notification).toMatchObject({
      recipientId: 'r1',
      id: 'n1',
      type: 'error',
      title: 'Git sync failed',
      link: 'git-sync-modal',
      readAt: null,
    });
  });

  it('carries the toast flag in the realtime payload, defaulting to false', async () => {
    await channel.deliver(event, recipient, { toast: true });
    await channel.deliver(event, recipient);

    expect(JSON.parse(publish.mock.calls[0][1]).toast).toBe(true);
    expect(JSON.parse(publish.mock.calls[1][1]).toast).toBe(false);
  });
});
