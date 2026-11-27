import { Cloud, CircleSlash, CodeXml, Database, Grid2x2, Sparkles, Zap, type LucideIcon } from 'lucide-react';

import type { SectionId } from './catalog';

export type PillId = SectionId | 'all';

interface SectionMeta {
  icon: LucideIcon;
  /** Icon tint token, per Figma. */
  iconClass: string;
}

export const SECTION_META: Record<PillId, SectionMeta> = {
  all: { icon: Grid2x2, iconClass: 'tw-text-icon-success' },
  popular: { icon: Zap, iconClass: 'tw-text-icon-danger' },
  databases: { icon: Database, iconClass: 'tw-text-list-icon-purple' },
  apis: { icon: CodeXml, iconClass: 'tw-text-icon-accent' },
  plugins: { icon: CircleSlash, iconClass: 'tw-text-icon-warning' },
  'cloud-storage': { icon: Cloud, iconClass: 'tw-text-list-icon-yellow' },
  ai: { icon: Sparkles, iconClass: 'tw-text-list-icon-pink' },
};
