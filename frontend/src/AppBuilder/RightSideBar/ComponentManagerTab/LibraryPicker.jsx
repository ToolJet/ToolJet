import React from 'react';
import TablerIcon from '@/_ui/Icon/TablerIcon';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/Rocket/shadcn/dropdown-menu';
import { ROCKET_1, ROCKET_1_LABEL, UI2, UI2_LABEL, choiceLabel } from './componentLibrary';

// The app's component library, as the Components tab's own label (Rocket 2.0 ▾): ToolJet UI 1.0 and 2.0, the component packs,
// then the other custom component libraries (see componentLibrary.js). Opening it does not switch tabs by itself; the
// tab takes the click as well, so picking from Modules lands on the Components tab.
export const LibraryPicker = ({ value, choices, onChange }) => {
  const item = (choice) => (
    <DropdownMenuItem
      key={choice.value}
      className="component-library-picker-item"
      onSelect={() => onChange(choice.value)}
      data-cy={`component-library-${choice.value.replace(/[^a-z0-9]+/gi, '-')}`}
    >
      <span className="component-library-picker-check">
        {choice.value === value && <TablerIcon iconName="IconCheck" style={{ width: 14, height: 14 }} stroke={2} />}
      </span>
      {choice.label}
    </DropdownMenuItem>
  );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span
          role="button"
          tabIndex={0}
          className="component-library-picker-trigger"
          data-cy="component-library-picker"
        >
          {choiceLabel(value, choices)}
          <TablerIcon iconName="IconChevronDown" style={{ width: 14, height: 14 }} stroke={2} />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="component-library-picker-menu">
        {item({ value: ROCKET_1, label: ROCKET_1_LABEL })}
        {item({ value: UI2, label: UI2_LABEL })}
        {choices.packs.map(item)}
        {choices.custom.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="component-library-picker-group">Custom libraries</DropdownMenuLabel>
            {choices.custom.map(item)}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
