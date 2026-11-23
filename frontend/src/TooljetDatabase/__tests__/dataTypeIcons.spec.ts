import {
  Braces,
  CalendarClock,
  CaseSensitive,
  DecimalsArrowRight,
  Hash,
  ArrowUp10,
  ToggleRight,
  Variable,
} from 'lucide-react';
import { dataTypeIcon, hasDataTypeIcon } from '../dataTypeIcons';

describe('dataTypeIcon', () => {
  it.each([
    ['serial', Variable],
    ['character varying', CaseSensitive],
    ['integer', Hash],
    ['bigint', ArrowUp10],
    ['double precision', DecimalsArrowRight],
    ['timestamp with time zone', CalendarClock],
    ['jsonb', Braces],
    ['boolean', ToggleRight],
  ])('gives %s its icon from the design', (type, icon) => {
    expect(dataTypeIcon(type)).toBe(icon);
  });

  it('falls back to the text icon for a type it does not know', () => {
    expect(dataTypeIcon('uuid')).toBe(CaseSensitive);
  });

  it('tells a type with an icon of its own from one that falls back', () => {
    expect(hasDataTypeIcon('jsonb')).toBe(true);
    expect(hasDataTypeIcon('uuid')).toBe(false);
  });
});
