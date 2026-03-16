import {
  LayoutPanelLeft,
  MailOpen,
  Save,
  Layers,
  FolderUp,
  LayoutPanelTop,
  House,
  SendHorizonal,
  HardDrive,
  Globe,
  Share2,
  ShieldEllipsis,
  Sun,
  Sheet,
  HouseWifi,
  Grip,
} from 'lucide-react';

import { validateName } from '@/_helpers/utils';

export const appIconNameMappingForLucideIcon = {
  apps: LayoutPanelLeft,
  archive: MailOpen,
  floppydisk: Save,
  layers: Layers,
  folderupload: FolderUp,
  grid: LayoutPanelTop,
  home: House, // TODO: Actual icon in design is HouseHeart, but for that will need to update the lucide-icon package
  sentfast: SendHorizonal,
  server: HardDrive,
  globe: Globe,
  share: Share2,
  shield: ShieldEllipsis,
  sun: Sun,
  table: Sheet,
  menuhome: HouseWifi,
  draghandle: Grip,
};

export const isValidSlug = (slug) => {
  const validate = validateName(slug, 'slug', true, false, false, false);
  return validate.status;
};
