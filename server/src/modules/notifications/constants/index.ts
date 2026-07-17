export enum NOTIFICATION_TYPE {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

export const CHANNEL_KEYS = { IN_APP: 'in_app', EMAIL: 'email' } as const;

export const NOTIFICATION_CHANNELS = 'NOTIFICATION_CHANNELS';

export const DEFAULT_CHANNELS = [CHANNEL_KEYS.IN_APP];

// Redis pub/sub channel bridging the producer pod to the ws gateway on every web pod.
export const NOTIFICATION_REALTIME_CHANNEL = 'tj:notifications';
