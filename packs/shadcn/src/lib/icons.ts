import { icons, type LucideIcon } from 'lucide-react';
import * as Lucide from 'lucide-react';

// Every lucide icon by name, in any spelling: kebab (trending-up), snake or spaced, camel (trendingUp), Pascal
// (TrendingUp, TrendingUpIcon), lucide's older aliases (AlertTriangle) and ToolJet's Tabler names (IconCurrencyDollar).
// Ported from UI 2.0's resolveIcon (Ui2/_display/iconModel.ts). The pack is one bundle, so the full map loads once.

const isRecord = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);

/** The PascalCase names to try for a lucide icon given as kebab-case, snake or space separated, camelCase or PascalCase. */
export const iconCandidates = (name: unknown): string[] => {
  if (typeof name !== 'string' && typeof name !== 'number') return [];
  const raw = String(name).trim();
  if (!raw) return [];
  const parts = raw.split(/[-_\s]+/).filter(Boolean);
  const pascal = parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('');
  const lowerRest = parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join('');
  return [...new Set([pascal, lowerRest, pascal.replace(/Icon$/, '')].filter(Boolean))];
};

// No icon name is this long: a longer one is junk (a bound paragraph), and the word fallback below is quadratic in it.
const MAX_ICON_NAME = 80;
const MAX_ICON_WORDS = 6;

// Tabler names (ToolJet's own icons, which models write on pack widgets too) whose lucide twin has another name. Keyed
// by the name without its Icon prefix, separators or case.
const TABLER_TWINS: Record<string, string> = {
  tool: 'Wrench',
  tools: 'Wrench',
  flask: 'FlaskConical',
  flask2: 'FlaskConical',
  devicemobile: 'Smartphone',
  devicedesktop: 'Monitor',
  devicefloppy: 'Save',
  alerttriangle: 'TriangleAlert',
  alertcircle: 'CircleAlert',
  reportmoney: 'Receipt',
  cash: 'Banknote',
  currencydollar: 'DollarSign',
  currencyeuro: 'Euro',
  currencypound: 'PoundSterling',
  currencyrupee: 'IndianRupee',
  buildingstore: 'Store',
  buildingwarehouse: 'Warehouse',
  truckdelivery: 'Truck',
  usersgroup: 'Users',
  calendarevent: 'Calendar',
  calendartime: 'CalendarClock',
  chartbar: 'ChartColumn',
  chartline: 'ChartLine',
  chartpie: 'ChartPie',
  checklist: 'ListChecks',
  listdetails: 'List',
  mailopened: 'MailOpen',
  speakerphone: 'Megaphone',
  dashboard: 'LayoutDashboard',
  firstaidkit: 'BriefcaseMedical',
  heartbeat: 'HeartPulse',
  barbell: 'Dumbbell',
  vaccine: 'Syringe',
  vaccinebottle: 'Syringe',
  paw: 'PawPrint',
  alertoctagon: 'OctagonAlert',
  infocircle: 'Info',
  helpcircle: 'CircleHelp',
  squarecheck: 'SquareCheck',
  checkbox: 'SquareCheck',
  motorbike: 'Bike',
  reportmedical: 'ClipboardPlus',
  rosettediscountcheck: 'BadgeCheck',
  shoppingcart: 'ShoppingCart',
  messagedots: 'MessageSquare',
  chartbarpopular: 'ChartNoAxesColumn',
  clockhour3: 'Clock',
  clockhour4: 'Clock',
  hourglass: 'Timer',
  percentage: 'Percent',
  toolskitchen: 'UtensilsCrossed',
  toolskitchen2: 'UtensilsCrossed',
  toolskitchen3: 'UtensilsCrossed',
  calendarcheck: 'CalendarCheck',
  clipboardlist: 'ClipboardList',
  clipboardcheck: 'ClipboardCheck',
  glassfull: 'Wine',
  news: 'Newspaper',
  books: 'Library',
};

/** The icon component for `name` from lucide icon maps, or `fallback`. Never throws. */
export const resolveIcon = <T>(name: unknown, maps: unknown, fallback: T): LucideIcon | T => {
  if (typeof name === 'string' && name.length > MAX_ICON_NAME) return fallback;
  const sources = (Array.isArray(maps) ? maps : [maps]).filter(isRecord);
  const lookup = (candidate: string): LucideIcon | null => {
    if (!candidate || candidate === 'Icon') return null; // lucide's base component, not an icon
    for (const source of sources) {
      const found = Object.prototype.hasOwnProperty.call(source, candidate) ? source[candidate] : undefined;
      // A function or an object (a forwardRef) in an icon map is an icon component.
      if (found && (typeof found === 'function' || typeof found === 'object')) return found as LucideIcon;
    }
    return null;
  };
  const candidates = iconCandidates(name);
  for (const candidate of candidates) {
    const found = lookup(candidate);
    if (found) return found;
  }
  // Tabler names, IconCircleCheck: without the prefix, then by their leading words when lucide has no twin
  // (IconListDetails reads List), rather than nothing.
  const base = (candidates[0] || '').replace(/^Icon(?=[A-Z])/, '');
  const twin = TABLER_TWINS[base.toLowerCase()];
  const twinIcon = twin ? lookup(twin) : null;
  if (twinIcon) return twinIcon;
  const words = (base.match(/[A-Z][a-z0-9]*/g) || []).slice(0, MAX_ICON_WORDS);
  for (let n = words.length; n >= 1; n -= 1) {
    const found = lookup(words.slice(0, n).join(''));
    if (found) return found;
  }
  // Then by the trailing words, where Tabler groups its names (IconDeviceLaptop reads Laptop).
  for (let n = 1; n < words.length; n += 1) {
    const found = lookup(words.slice(n).join(''));
    if (found) return found;
  }
  // Then as one of a kind: "pills" reads Pill, "IconTicketsStub" reads TicketStub.
  const singular = base.replace(/(?:es|s)$/, '');
  if (singular && singular !== base) {
    const found = lookup(singular) || lookup(base.replace(/s$/, ''));
    if (found) return found;
  }
  return fallback;
};

// The pack's earlier short names, which saved apps use, where lucide's own name differs.
const SHORT_NAMES: Record<string, string> = {
  dollar: 'DollarSign',
  card: 'CreditCard',
  cart: 'ShoppingCart',
  trash: 'Trash2',
  help: 'CircleHelp',
  message: 'MessageSquare',
  dashboard: 'LayoutDashboard',
  'bar-chart': 'BarChart3',
  'check-circle': 'CheckCircle2',
};

// lucide's `icons` holds each icon once under its current name; the module's own exports add the older aliases.
const MAPS = [icons, Lucide];

export const iconFor = (name: unknown): LucideIcon | null => {
  const key = typeof name === 'string' ? name.trim() : '';
  if (!key || key.toLowerCase() === 'none') return null;
  return resolveIcon(SHORT_NAMES[key.toLowerCase()] ?? key, MAPS, null);
};
