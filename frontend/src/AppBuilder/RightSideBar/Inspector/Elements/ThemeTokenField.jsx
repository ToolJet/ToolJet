import React, { useMemo } from 'react';
import { Box, SquareRoundCorner } from 'lucide-react';
import { Select } from '@/AppBuilder/CodeBuilder/Elements/Select';
import { CUSTOM_STYLE, shadowLabel } from '@/AppBuilder/_helpers/themeStyles';

// A widget's Border radius / Box shadow style in the inspector (Figma "Applying theme to inputs"): a dropdown of the
// app theme's items (name, value) plus Custom. Custom shows the existing control (`children`) under it. A widget with
// no theme style yet (saved before themes had these) reads as Custom. The dropdown is the inspector's own Select (as
// Font Weight), so it has the same states, menu and dark mode.
const KINDS = {
  borderRadius: { Icon: SquareRoundCorner, valueLabel: (item) => `${item.value}px` },
  shadows: { Icon: Box, valueLabel: shadowLabel },
};

/**
 * @param {{ kind: 'borderRadius' | 'shadows', label: string, items: object[], value?: string,
 *   onSelect: (id: string) => void, children?: React.ReactNode }} props
 */
export const ThemeTokenField = ({ kind, label, items, value, onSelect, children }) => {
  const { Icon, valueLabel } = KINDS[kind];
  // No theme style yet, or an item this theme does not have (the previous theme's, or removed): the widget draws its
  // saved custom value, so the field reads Custom. The saved id is kept, so switching back to that theme restores it.
  const isCustom = !value || value === CUSTOM_STYLE || !items.some((item) => item.id === value);
  const selected = isCustom ? CUSTOM_STYLE : value;

  const meta = useMemo(() => {
    const options = items.map((item) => ({ label: item.name, value: item.id, hint: valueLabel(item) }));
    options.push({ label: 'Custom', value: CUSTOM_STYLE });
    return {
      displayName: label,
      options,
      leadingIcon: <Icon className="tw-size-4 tw-shrink-0 tw-text-icon-default" aria-hidden />,
    };
  }, [items, label, valueLabel]);

  return (
    <div role="group" aria-label={label} className="tw-flex tw-flex-col tw-gap-2 tw-mb-2">
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
        <span className="tw-font-body-default tw-text-text-default">{label}</span>
        <Select value={selected} onChange={onSelect} meta={meta} />
      </div>
      {isCustom && children}
    </div>
  );
};
