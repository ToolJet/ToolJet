import React from 'react';
import {
  Blocks,
  BriefcaseBusiness,
  FileText,
  Globe,
  Grid2x2,
  GripVertical,
  House,
  Layers,
  FolderUp,
  Rows3,
  Send,
  Share2,
  ShieldCheck,
  Store,
  Sun,
  Table2,
} from 'lucide-react';

import { cn } from '@/lib/utils';

// Keyed by the legacy icon names stored in the DB; remove once icons are migrated to lucide names there.
const ICONS_BY_LEGACY_NAME = {
  apps: Blocks,
  archive: BriefcaseBusiness,
  floppydisk: FileText,
  layers: Layers,
  folderupload: FolderUp,
  grid: Grid2x2,
  home: Store,
  sentfast: Send,
  server: Rows3,
  globe: Globe,
  share: Share2,
  shield: ShieldCheck,
  sun: Sun,
  table: Table2,
  menuhome: House,
  draghandle: GripVertical,
};

// Full class literals so Tailwind can detect them.
const COLOR_CLASSES = {
  purple: 'tw-text-list-icon-purple',
  green: 'tw-text-list-icon-green',
  indigo: 'tw-text-list-icon-indigo',
  yellow: 'tw-text-list-icon-yellow',
  pink: 'tw-text-list-icon-pink',
  blue: 'tw-text-list-icon-blue',
  red: 'tw-text-list-icon-red',
};

export const APP_ICON_COLORS = Object.keys(COLOR_CLASSES);

export default function AppIcon({ icon, color, size = 12, className }) {
  const Icon = ICONS_BY_LEGACY_NAME[icon] ?? Blocks;
  return <Icon size={size} className={cn(COLOR_CLASSES[color] ?? 'tw-text-icon-strong', className)} />;
}
