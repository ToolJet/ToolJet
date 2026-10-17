import React, { useEffect, useRef, useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { CONTROL, FormField, controlAria, fieldIdOf } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useFocusEvent, useValidation } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import {
  runNow,
  toOptions,
  useAutoHeight,
  useExposed,
  useLatest,
  useStable,
  withControlState,
} from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { cn, getPortalRoot } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { lookVars } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import * as M from '@/AppBuilder/Widgets/Ui2/_pickers/pickersModel';
import { Chip, ClearButton, MENU_SURFACE } from '@/AppBuilder/Widgets/Ui2/_pickers/pickerParts';
import type { ChangeEvent, KeyboardEvent } from 'react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { isComposing } from '@/AppBuilder/Widgets/Ui2/_shared/keyboard';

// ---- Tags input ----------------------------------------------------------------------------------------------------

export const ShadTagsInput = (props: WidgetProps) => {
  const { properties, styles, setExposedVariables, fireEvent, componentType } = props;
  const ref = useRef<HTMLDivElement>(null);
  useAutoHeight(props, ref);
  const inputRef = useRef<HTMLInputElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const rules = {
    maxTags: properties.maxTags,
    caseSensitive: properties.caseSensitive === true,
    pattern: properties.tagPattern,
    patternError: properties.patternError,
  };
  // A new default starts the tags again; a new limit keeps what the user entered (only cut to fit a lower one).
  const defaultTags = useStable(M.toTags(properties.defaultValue));
  const rulesNow = useLatest(rules);
  const [tags, setTags] = useState(() => M.addTags([], defaultTags, rules).tags);
  useEffect(() => setTags(M.addTags([], defaultTags, rulesNow.current).tags), [defaultTags, rulesNow]);
  const maxTags = M.clampLimit(rules.maxTags);
  useEffect(() => {
    if (maxTags > 0) setTags((t) => (t.length > maxTags ? t.slice(0, maxTags) : t));
  }, [maxTags]);
  const [text, setText] = useState('');
  const [tagError, setTagError] = useState('');
  const [focused, setFocused] = useState(false);
  const focusEvent = useFocusEvent(fireEvent);
  const [dismissed, setDismissed] = useState(false);
  const [active, setActive] = useState(-1);
  const rulesRef = useRef(rules);
  rulesRef.current = rules;
  const suggestions = toOptions(properties.suggestions).map((o) => ({ label: o.label, tag: String(o.value) }));
  // The native Tags input's names: values (the tags), newTagsAdded (those not among the suggestions).
  const known = new Set(suggestions.map((sg) => (rules.caseSensitive ? sg.tag : sg.tag.toLowerCase())));
  const tagNames = (next: string[]) => ({
    values: next,
    newTagsAdded: next.filter((t) => !known.has(rules.caseSensitive ? t : String(t).toLowerCase())),
  });
  useExposed(setExposedVariables, properties, {
    ...tagNames(tags),
    label: String(properties.label ?? ''),
    setTags: async (t: unknown) => setTags(M.addTags([], M.toTags(t), rulesRef.current).tags),
    // selectTags adds tags (within the rules), deselectTags removes them.
    selectTags: async (t: unknown) => setTags((cur) => M.addTags(cur, M.toTags(t), rulesRef.current).tags),
    deselectTags: async (t: unknown) => {
      const gone = M.toTags(t);
      setTags((cur) => cur.filter((tag) => !gone.some((g) => M.sameTag(g, tag, rulesRef.current.caseSensitive))));
    },
    // Clearing drops the unfinished text too, or leaving the box would add it as a tag.
    clear: async () => {
      setTags([]);
      setText('');
      setTagError('');
    },
    setFocus: async () => inputRef.current?.focus(),
    setBlur: async () => inputRef.current?.blur(),
  });
  const check = useValidation(props, tags, () => {
    setTags([]);
    setText('');
    setTagError('');
    setExposedVariables(tagNames([]));
  });
  const disabled = busy(properties);
  const query = text.trim().toLowerCase();
  const visible = suggestions
    .filter(
      (s) =>
        !tags.some((t) => M.sameTag(t, s.tag, rules.caseSensitive)) &&
        (!query || s.label.toLowerCase().includes(query) || s.tag.toLowerCase().includes(query))
    )
    .slice(0, 50);
  const menuOpen = focused && !dismissed && !disabled && visible.length > 0;

  const commit = (next: string[], event: 'onTagAdded' | 'onTagDeleted', tag: string) =>
    runNow(() => {
      setTags(next);
      setExposedVariables({
        ...tagNames(next),
        ...(event === 'onTagAdded' ? { lastAddedTag: tag } : { lastRemovedTag: tag }),
      });
      fireEvent(event);
      fireEvent('onChange');
    });
  /** Adds typed or picked tags; true when at least one was added. */
  const add = (candidates: unknown) => {
    let wanted = M.toTags(candidates);
    if (properties.allowCustomTags === false) {
      const known = wanted
        .map((c) => suggestions.find((s) => M.sameTag(s.tag, c) || M.sameTag(s.label, c))?.tag)
        .filter((t): t is string => !!t);
      if (known.length < wanted.length) setTagError('Pick a tag from the suggestions');
      wanted = known;
      if (!wanted.length) return false;
    }
    const result = M.addTags(tags, wanted, rules);
    if (result.error || properties.allowCustomTags !== false) setTagError(result.error);
    if (result.added.length) commit(result.tags, 'onTagAdded', result.added[result.added.length - 1]);
    setActive(-1);
    return result.added.length > 0;
  };
  const remove = (index: number) => {
    const tag = tags[index];
    if (tag === undefined) return;
    setTagError('');
    commit(
      tags.filter((_, i) => i !== index),
      'onTagDeleted',
      tag
    );
  };
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTagError('');
    setDismissed(false);
    const { parts, rest } = M.splitTyped(e.target.value);
    if (parts.length) add(parts);
    setText(rest);
    setActive(-1);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Keys that belong to an IME composition (the Enter that confirms it) are the input method's, not the field's.
    if (isComposing(e)) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      if (menuOpen && active >= 0 && visible[active]) {
        if (add([visible[active].tag])) setText('');
      } else if (text.trim() && add([text])) setText('');
    } else if (e.key === 'Backspace' && text === '' && tags.length) {
      remove(tags.length - 1);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!visible.length) return;
      e.preventDefault();
      setDismissed(false);
      const dir = e.key === 'ArrowDown' ? 1 : -1;
      setActive((i) => (i + dir + visible.length + (i < 0 && dir < 0 ? 1 : 0)) % visible.length);
    } else if (e.key === 'Escape') {
      setDismissed(true);
      setActive(-1);
    }
  };
  return (
    <FormField props={props} properties={properties} check={check} innerRef={ref} error={tagError || check.error}>
      <PopoverPrimitive.Root open={menuOpen}>
        <PopoverPrimitive.Anchor asChild>
          <div
            ref={anchorRef}
            onClick={() => inputRef.current?.focus()}
            className={cn(
              'tw-flex tw-min-h-9 tw-w-full tw-cursor-text tw-flex-wrap tw-items-center tw-gap-1.5 tw-border tw-px-2 tw-py-1 tw-text-ui2-sm tw-shadow-sm tw-transition-colors focus-within:tw-ring-1 focus-within:tw-ring-ui2-ring',
              CONTROL,
              disabled && 'tw-cursor-not-allowed tw-opacity-50'
            )}
          >
            {tags.map((tag, i) => (
              <Chip
                key={`${tag}-${i}`}
                label={tag}
                removeLabel={`Remove ${tag}`}
                onRemove={disabled ? undefined : () => remove(i)}
              />
            ))}
            <input
              ref={inputRef}
              id={fieldIdOf(props)}
              type="text"
              role="combobox"
              aria-expanded={menuOpen}
              aria-autocomplete="list"
              {...controlAria(props, tagError || check.error)}
              autoComplete="off"
              value={text}
              disabled={disabled}
              placeholder={String(properties.placeholder ?? '')}
              onChange={onChange}
              onKeyDown={onKeyDown}
              onFocus={() => {
                setFocused(true);
                setDismissed(false);
                focusEvent();
              }}
              onBlur={() => {
                setFocused(false);
                setActive(-1);
                check.touch();
                if (properties.addOnBlur === true && text.trim() && add([text])) setText('');
                fireEvent('onBlur');
              }}
              className={cn(
                'tw-h-7 tw-min-w-[6rem] tw-flex-1 tw-border-0 tw-bg-transparent tw-px-1 tw-py-0 tw-text-ui2-sm tw-text-[color:var(--lk-fg,var(--sc-foreground))] tw-shadow-none tw-outline-none focus:tw-outline-none focus:tw-ring-0 disabled:tw-cursor-not-allowed',
                'placeholder:tw-text-[color:var(--lk-placeholder,var(--sc-muted-foreground))]'
              )}
            />
            {properties.showClearBtn === true && tags.length && !disabled && !properties.loadingState ? (
              <ClearButton
                label="Clear tags"
                onClear={() => {
                  setTagError('');
                  commit([], 'onTagDeleted', tags[tags.length - 1]);
                }}
              />
            ) : null}
          </div>
        </PopoverPrimitive.Anchor>
        <PopoverPrimitive.Portal container={getPortalRoot()}>
          <PopoverPrimitive.Content
            aria-label="Suggestions"
            align="start"
            sideOffset={4}
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              if (e.target instanceof Node && anchorRef.current?.contains(e.target)) e.preventDefault();
              else setDismissed(true);
            }}
            onEscapeKeyDown={() => setDismissed(true)}
            className={cn(
              'tw-z-[1060] tw-max-h-60 tw-w-[var(--radix-popover-trigger-width)] tw-min-w-[10rem] tw-overflow-y-auto tw-rounded-ui2-md tw-border tw-border-[color:var(--sc-border)] tw-p-1 tw-shadow-md tw-outline-none',
              MENU_SURFACE
            )}
            style={lookVars(componentType, styles)}
          >
            <div role="listbox" aria-label="Suggestions">
              {visible.map((s, i) => (
                <div
                  key={`${s.tag}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  data-selected={i === active || undefined}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => {
                    if (add([s.tag])) setText('');
                    inputRef.current?.focus();
                  }}
                  className="tw-flex tw-cursor-default tw-select-none tw-items-center tw-rounded-ui2-sm tw-px-2 tw-py-1.5 tw-text-ui2-sm tw-outline-none data-[selected]:tw-bg-[color:var(--lk-hl,var(--sc-accent))] data-[selected]:tw-text-[color:var(--lk-menu-fg,var(--sc-accent-foreground))]"
                >
                  {s.label}
                </div>
              ))}
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    </FormField>
  );
};

export default withControlState(ShadTagsInput);
