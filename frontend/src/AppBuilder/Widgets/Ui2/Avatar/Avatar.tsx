import React from 'react';
import type { StyleWithVars, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { initials, useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Avatar, AvatarFallback, AvatarImage, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { Shell } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { avatarPeople } from '@/AppBuilder/Widgets/Ui2/_shared/people';

export const ShadAvatar = (props: WidgetProps) => {
  const { properties, setExposedVariables } = props;
  useExposed(setExposedVariables, properties, {});
  const size = Math.max(16, Math.min(256, Number(properties.size) || 32));
  const people = avatarPeople(properties.names, properties.src);
  const max = Math.max(1, Math.min(50, Math.floor(Number(properties.maxVisible)) || 5));
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  // The pack's utilities are !important, so an inline width lost to the Avatar's h-8 w-8 and every avatar drew at
  // 32px. The size, the initials' font and the overlap of a group are variables the classes read, all scaled to the
  // size (a fixed 12px font and 8px overlap hid the second letter of small avatars).
  const ring = 'ring-2 ring-[color:var(--lk-ring,var(--sc-background))]';
  const box = 'h-[var(--av-size)] w-[var(--av-size)]';
  const fill =
    'bg-[color:var(--lk-bg,var(--sc-muted))] text-[color:var(--lk-fg,var(--sc-foreground))] text-[length:var(--av-font)] leading-none';
  const vars: StyleWithVars = {
    '--av-size': `${size}px`,
    '--av-font': `${Math.max(9, Math.round(size * 0.4))}px`,
    '--av-overlap': `${Math.round(size * 0.2)}px`,
  };
  return (
    <Shell {...props}>
      <div className="flex [&>*+*]:ml-[calc(var(--av-overlap)*-1)]" style={vars}>
        {shown.map((person, i) => (
          <Avatar key={`${person.name}-${i}`} className={cn(ring, box)} title={person.name}>
            {person.src ? <AvatarImage src={person.src} alt={person.name} /> : null}
            <AvatarFallback className={fill}>{initials(person.name)}</AvatarFallback>
          </Avatar>
        ))}
        {extra > 0 ? (
          <Avatar className={cn(ring, box)} title={`${extra} more`}>
            <AvatarFallback className={cn(fill, 'font-medium')}>+{extra}</AvatarFallback>
          </Avatar>
        ) : null}
      </div>
    </Shell>
  );
};

export default withControlState(ShadAvatar);
