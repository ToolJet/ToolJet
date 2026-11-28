import {
  ArrowUp10,
  Braces,
  CalendarClock,
  CaseSensitive,
  DecimalsArrowRight,
  Hash,
  ToggleRight,
  Variable,
  type LucideIcon,
} from 'lucide-react';

// One icon per column type (Figma data type icons). `int` is Hash: the design's `numbers` icon is not in the installed
// lucide-react yet.
const DATA_TYPE_ICONS: Record<string, LucideIcon> = {
  serial: Variable,
  'character varying': CaseSensitive,
  integer: Hash,
  bigint: ArrowUp10,
  'double precision': DecimalsArrowRight,
  'timestamp with time zone': CalendarClock,
  jsonb: Braces,
  boolean: ToggleRight,
};

export const dataTypeIcon = (dataType: string): LucideIcon => DATA_TYPE_ICONS[dataType] ?? CaseSensitive;

/** Does the type have an icon of its own (the fallback does not count)? */
export const hasDataTypeIcon = (dataType: string): boolean => dataType in DATA_TYPE_ICONS;
