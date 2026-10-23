import type { AppItem, FolderItem } from './dashboard.types';

// Placeholder data from the Figma grid view, until the dashboard is wired to the API.
export const PLACEHOLDER_FOLDERS: FolderItem[] = [
  { id: 'folder-1', name: 'Compliance & Risk', description: '12 apps • Edited Sep 18, 2026', isPinned: true },
  { id: 'folder-2', name: 'Customer Onboarding', description: '9 apps • Edited Sep 12, 2026', isPinned: true },
  { id: 'folder-3', name: 'Marketing Campaigns', description: '7 apps • Edited Sep 09, 2026', isPinned: true },
  { id: 'folder-12', name: 'Marketing Campaigns', description: '7 apps • Edited Sep 09, 2026', isPinned: true },
  { id: 'folder-4', name: 'Sales Enablement', description: '5 apps • Edited Aug 15, 2026' },
  { id: 'folder-5', name: 'Customer Success', description: '4 apps • Edited Aug 15, 2026' },
  { id: 'folder-6', name: 'Marketing Ops', description: '6 apps • Edited Aug 14, 2026' },
  { id: 'folder-7', name: 'People Ops', description: '3 apps • Edited Aug 14, 2026' },
  { id: 'folder-8', name: 'Finance Tools', description: '7 apps • Edited Aug 13, 2026' },
  { id: 'folder-9', name: 'IT & Security', description: '8 apps • Edited Aug 12, 2026' },
  { id: 'folder-10', name: 'Product Design', description: '9 apps • Edited Aug 11, 2026' },
  { id: 'folder-11', name: 'Analytics & BI', description: '5 apps • Edited Aug 10, 2026' },
];

export const PLACEHOLDER_APPS: AppItem[] = [
  { id: 'app-1', name: 'SecurePass', description: 'Edited on Sep 15, 2026', icon: 'shield', iconColor: 'red' },
  { id: 'app-2', name: 'CloudPort', description: 'Edited 2 hours ago by user', icon: 'globe', iconColor: 'blue' },
  { id: 'app-3', name: 'TaskPilot', description: 'Edited 2 hours ago by user', icon: 'layers', iconColor: 'pink' },
  { id: 'app-4', name: 'MediaDock', description: 'Edited on Sep 15, 2026', icon: 'table', iconColor: 'green' },
  { id: 'app-5', name: 'ParcelFlow', description: 'Edited on Sep 15, 2026', icon: 'archive', iconColor: 'yellow' },
  { id: 'app-6', name: 'ShopCart', description: 'Edited 2 hours ago by user', icon: 'home', iconColor: 'purple' },
  { id: 'app-7', name: 'FileNest', description: 'Edited 2 hours ago by user', icon: 'folderupload', iconColor: 'red' },
  { id: 'app-8', name: 'GridStack', description: 'Edited on Sep 15, 2026', icon: 'grid', iconColor: 'blue' },
];
