import React, { useLayoutEffect, useRef, useState } from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { cn } from '../lib/cn';
import { initials, isSet, styleVars } from '../lib/ui2/display/lists/model';
import { AvatarSkel, LoadingBox, LoadingFrame, useLoadingLook } from '../lib/ui2/loading/look';
import { TOKEN, useThemeColor } from '../lib/styleDefaults';
import '../styles/ui2-display.css';

type Person = { name: string; src: string };

// UI 2.0's avatarPeople: one name, a comma-separated list, or an array of names or { name, src }.
const avatarPeople = (names: unknown, src?: unknown): Person[] => {
  const people = (Array.isArray(names) ? (names as unknown[]) : String(names ?? '').split(',').map((n) => n.trim()).filter(Boolean)).flatMap(
    (entry): Person[] => {
      if (entry !== null && typeof entry === 'object' && !Array.isArray(entry)) {
        const person = entry as Record<string, unknown>;
        const name = person.name ?? person.label ?? person.title ?? '';
        const image = typeof person.src === 'string' ? person.src : typeof person.image === 'string' ? person.image : '';
        return [{ name: String(name), src: image }];
      }
      return entry === null || entry === undefined || entry === '' ? [] : [{ name: String(entry), src: '' }];
    }
  );
  // The single-avatar image applies when there is one person without their own photo.
  if (people.length === 1 && !people[0].src && src) people[0].src = String(src);
  return people;
};

// The pack's older named sizes, read as px.
const NAMED: Record<string, number> = { sm: 32, md: 40, lg: 56 };

export const Avatar = () => {
  const [names] = ToolJet.useStateString({ name: 'names', label: 'Names (one or many; or [{ name, src }])', initialValue: 'Ada Lovelace' });
  const [src] = ToolJet.useStateString({ name: 'src', label: 'Image URL (single avatar)', initialValue: '' });
  const [size] = ToolJet.useStateString({ name: 'size', label: 'Size (px)', initialValue: '32' });
  const [maxVisible] = ToolJet.useStateNumber({ name: 'maxVisible', label: 'Most avatars shown (rest as +N)', initialValue: 5 });
  // The pack's own single-person card: a name and subtitle beside one avatar. Used when Names is empty.
  const [imageUrl] = ToolJet.useStateString({ name: 'imageUrl', label: 'Image URL (when Names is empty)', initialValue: '' });
  const [name] = ToolJet.useStateString({ name: 'name', label: 'Name (when Names is empty)', initialValue: '' });
  const [subtitle] = ToolJet.useStateString({ name: 'subtitle', label: 'Subtitle', initialValue: '' });
  const [showDetails] = ToolJet.useStateBoolean({ name: 'showDetails', label: 'Show name and subtitle', initialValue: false });
  const [shape] = ToolJet.useStateEnumeration({
    name: 'shape',
    label: 'Shape',
    enumDefinition: ['circle', 'square'],
    enumLabels: { circle: 'Circle', square: 'Square' },
    initialValue: 'circle',
    inspector: 'switch',
    section: 'Appearance',
  });
  const onClick = ToolJet.useEventCallback({ name: 'onClick' });
  const backgroundColor = useThemeColor('backgroundColor', 'Initials background', TOKEN.muted);
  const textColor = useThemeColor('textColor', 'Initials color', TOKEN.text);
  const ringColor = useThemeColor('ringColor', 'Ring color (between stacked avatars)', TOKEN.surface);
  const fallbackColor = ToolJet.useStyleString({ name: 'fallbackColor', label: 'Initials background (old name)', inspector: 'color', initialValue: '' });
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ defaultWidth: 6, defaultHeight: 4 });

  // Drawn inside the box: an avatar never grows past the widget's height, nor a lone avatar past its width (a narrow
  // Kanban card cut it).
  const ref = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState(0);
  const [roomWide, setRoomWide] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => {
      setRoom(el.clientHeight);
      setRoomWide(el.clientWidth);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const key = String(size ?? '').trim();
  const asked = Math.max(16, Math.min(256, NAMED[key] ?? (Number(key) || 32)));
  const people = isSet(names) && !(Array.isArray(names) && !names.length) ? avatarPeople(names, src || imageUrl) : name ? [{ name: String(name), src: String(imageUrl || src || '') }] : [];
  const max = Math.max(1, Math.min(50, Math.floor(Number(maxVisible)) || 5));
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  const single = people.length === 1 ? people[0] : null;
  const fit = Math.min(room > 0 ? room : asked, single && !showDetails && roomWide > 0 ? roomWide : asked);
  const px = Math.max(12, Math.min(asked, fit));
  const vars = {
    ['--av-size' as string]: `${px}px`,
    ['--av-font' as string]: `${Math.max(9, Math.round(px * 0.4))}px`,
    ['--av-overlap' as string]: `${Math.round(px * 0.2)}px`,
    ...styleVars([
      [backgroundColor || fallbackColor, '--lk-bg'],
      [textColor, '--lk-fg'],
      [ringColor, '--lk-ring'],
    ]),
  };
  const avatarClass = cn('ui2-avatar', shape === 'square' && 'is-square');
  return (
    <LoadingFrame loading={ld.loading} look={ld.skeleton ? <AvatarSkel size={px} count={people.length} /> : <LoadingBox />}>
      <div ref={ref} className="ui ui2-avatar-row" style={vars} onClick={onClick}>
        <div className="ui2-avatar-stack">
          {shown.map((person, i) => (
            <AvatarPrimitive.Root key={`${person.name}-${i}`} className={avatarClass} title={person.name}>
              {person.src ? <AvatarPrimitive.Image className="ui-avatar-img" src={person.src} alt={person.name} /> : null}
              <AvatarPrimitive.Fallback className="ui2-avatar-fallback" delayMs={person.src ? 400 : 0}>
                {initials(person.name)}
              </AvatarPrimitive.Fallback>
            </AvatarPrimitive.Root>
          ))}
          {extra > 0 ? (
            <span className={avatarClass} title={`${extra} more`}>
              <span className="ui2-avatar-fallback is-more">+{extra}</span>
            </span>
          ) : null}
        </div>
        {showDetails && single ? (
          <div className="ui-min0">
            <div className="ui-avatar-name">{single.name}</div>
            {subtitle ? <div className="ui-avatar-sub">{subtitle}</div> : null}
          </div>
        ) : null}
      </div>
    </LoadingFrame>
  );
};
