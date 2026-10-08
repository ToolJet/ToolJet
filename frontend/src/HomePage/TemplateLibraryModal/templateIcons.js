import {
  Activity,
  Briefcase,
  Building2,
  CalendarCheck,
  ConciergeBell,
  Factory,
  FileSignature,
  GraduationCap,
  Handshake,
  HardHat,
  Headset,
  KeyRound,
  LayoutGrid,
  Monitor,
  Package,
  Server,
  ShieldCheck,
  ShoppingCart,
  Store,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';

// Keys are the category ids in server/templates/categories.json
const CATEGORY_ICONS = {
  'construction-and-installation': HardHat,
  contracts: FileSignature,
  'customer-service': Headset,
  'education-and-training': GraduationCap,
  'field-services': Wrench,
  'finance-and-accounting': Wallet,
  'hospitality-and-events': ConciergeBell,
  'inventory-orders-and-fleet': Package,
  'it-assets-and-access': Monitor,
  'it-operations': Server,
  'local-services': Store,
  'manufacturing-and-production': Factory,
  'people-and-hr': Users,
  'procurement-and-suppliers': ShoppingCart,
  'productivity-and-community': CalendarCheck,
  'projects-and-resourcing': Briefcase,
  'property-and-facilities': Building2,
  rentals: KeyRound,
  'risk-and-compliance': ShieldCheck,
  'sales-and-bids': Handshake,
  'status-pages': Activity,
};

export const categoryIcon = (categoryId) => CATEGORY_ICONS[categoryId] ?? LayoutGrid;

// Icon colours chosen by product; they are the same in light and dark mode
export const ICON_COLORS = ['#C1A1FC', '#7FBF92', '#97AEFC', '#CEAD69', '#E998C8', '#86B9FB', '#FFB8B9'];

export const iconColor = (index) => ICON_COLORS[index % ICON_COLORS.length];
