export enum NOTIFICATION_TYPE {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

export const CHANNEL_KEYS = { IN_APP: 'in_app', EMAIL: 'email' } as const;

export const NOTIFICATION_CHANNELS = 'NOTIFICATION_CHANNELS';

export const DEFAULT_CHANNELS = [CHANNEL_KEYS.IN_APP];

// P2 socket rooms — defined now, unused in P1
export const userRoom = (userId: string) => `user:${userId}`;
export const orgRoom = (organizationId: string) => `org:${organizationId}`;
