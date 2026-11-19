import type { StatusDotTone } from '@/components/ui/Rocket/StatusDot/StatusDot';

const ENVIRONMENT_TONES: Record<string, StatusDotTone> = {
  development: 'info',
  staging: 'warning',
  production: 'warning',
};

// The status dot colour for an environment, by name. Names outside the three defaults get the neutral ring.
export const environmentTone = (name: string | undefined): StatusDotTone =>
  ENVIRONMENT_TONES[name?.toLowerCase() ?? ''] ?? 'neutral';
