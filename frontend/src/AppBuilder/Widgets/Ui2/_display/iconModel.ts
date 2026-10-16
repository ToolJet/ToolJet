// shadcn/ui pack (experiment): icon lookup for the display widgets (moved out of displayModel.js), kept apart from
// the components so it is tested on its own. Every function accepts junk without throwing.
import type { LucideIcon } from 'lucide-react';
import { isObject, isText } from './displayModel';

// ---- Icon ------------------------------------------------------------------------------------------------------------

/** The PascalCase names to try for a lucide icon given as kebab-case (trending-up), snake or space separated,
 *  camelCase (trendingUp) or PascalCase (TrendingUp, TrendingUpIcon). */
export const iconCandidates = (name: unknown): string[] => {
  if (!isText(name)) return [];
  const raw = String(name).trim();
  if (!raw) return [];
  const pascal = raw
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  const lowerRest = raw
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
  const out = [pascal, lowerRest, pascal.replace(/Icon$/, '')];
  return [...new Set(out.filter(Boolean))];
};

/** The icon component for `name` from a lucide `icons` map (and optionally the module's own exports, which carry
 *  the older alias names), or `fallback`. Never throws. */
// No icon name is this long: a longer one is junk (a bound paragraph) and its word fallback below was quadratic in it
// (a 120k-character string froze the Stat and the Hero for seconds).
const MAX_ICON_NAME = 80;
const MAX_ICON_WORDS = 6;

// Tabler names (ToolJet's own icons, which models write on pack widgets too) whose lucide twin has another name. Keyed
// by the name without its Icon prefix, separators or case. IconDeviceLaptop, IconTool and flask-2 drew the dashed
// placeholder on stat cards (2026-10-14).
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

export const resolveIcon = <T>(name: unknown, maps: unknown, fallback: T): LucideIcon | T => {
  if (typeof name === 'string' && name.length > MAX_ICON_NAME) return fallback;
  const sources = (Array.isArray(maps) ? maps : [maps]).filter(isObject);
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
  // ToolJet's own (Tabler) names, IconCircleCheck: without the prefix, then by their leading words when lucide has no
  // twin (IconListDetails reads List), rather than the placeholder.
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
  // Then as one of a kind: "pills" reads Pill, "IconTicketsStub" reads TicketStub (a pharmacy stat, 2026-10-14).
  const singular = base.replace(/(?:es|s)$/, '');
  if (singular && singular !== base) {
    const found = lookup(singular) || lookup(base.replace(/s$/, ''));
    if (found) return found;
  }
  return fallback;
};
