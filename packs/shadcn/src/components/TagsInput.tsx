import React, { useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { X } from 'lucide-react';
import { Field, fieldAria } from '../lib/Field';
import { cn } from '../lib/cn';
import { usePortalContainer } from '../lib/usePortalContainer';
import { TJ } from '../lib/ui2/inputs/sdk';
import { field, useLooks } from '../lib/ui2/inputs/looks';
import type { Look } from '../lib/ui2/inputs/looks';
import { ClearX, isEnter, useReseed, useRuleCheck } from '../lib/ui2/inputs/parts';
import * as M from '../lib/ui2/inputs/model';
import { FieldLoading } from '../lib/ui2/loading/look';
import '../styles/ui2-inputs.css';

const LOOKS: Look[] = [
  ...field({ accentColor: 'Accent (focus ring, checks)' }),
  ['chipBackgroundColor', 'Chip background', '--lk-chip-bg'],
  ['chipTextColor', 'Chip text color', '--lk-chip-fg'],
  ['menuBackgroundColor', 'Menu background', '--lk-menu-bg'],
  ['menuTextColor', 'Menu text color', '--lk-menu-fg'],
  ['optionHoverColor', 'Highlighted option background', '--lk-hl'],
];

export const TagsInput = () => {
  const [label] = TJ.useStateString({ name: 'label', label: 'Label', initialValue: 'Tags' });
  const [description] = TJ.useStateString({ name: 'description', label: 'Help text', initialValue: '' });
  const [placeholder] = TJ.useStateString({ name: 'placeholder', label: 'Placeholder', initialValue: 'Add a tag...' });
  const [defaultValue] = TJ.useStateArray({ name: 'defaultValue', label: 'Default tags', initialValue: [] });
  const [suggestions] = TJ.useStateArray({
    name: 'suggestions',
    label: 'Suggestions',
    placeholder: "['urgent', 'billing'] or [{ label, value }]",
    initialValue: ['react', 'typescript', 'node', 'python', 'design', 'devops'],
  });
  const [allowCustomTags] = TJ.useStateBoolean({ name: 'allowCustomTags', label: 'Allow tags not in suggestions', initialValue: true });
  const [maxTags] = TJ.useStateNumber({ name: 'maxTags', label: 'Max tags (0 for no limit)', initialValue: 0 });
  const [caseSensitive] = TJ.useStateBoolean({ name: 'caseSensitive', label: 'Case-sensitive duplicate check', initialValue: false });
  const [tagPattern] = TJ.useStateString({ name: 'tagPattern', label: 'Tag pattern (regex)', placeholder: '^[a-z0-9-]+$', initialValue: '' });
  const [patternError] = TJ.useStateString({ name: 'patternError', label: 'Pattern error message', initialValue: '' });
  const [addOnBlur] = TJ.useStateBoolean({ name: 'addOnBlur', label: 'Add typed text on blur', initialValue: false });
  const [showClearBtn] = TJ.useStateBoolean({ name: 'showClearBtn', label: 'Show clear button', initialValue: false });
  // Exposed: the tags (values), those not among the suggestions, and the last added and removed.
  const [rawValues, setValues] = TJ.useStateArray({ name: 'values', initialValue: [], inspector: 'hidden' });
  const [, setNewTagsAdded] = TJ.useStateArray({ name: 'newTagsAdded', initialValue: [], inspector: 'hidden' });
  const [, setLastAddedTag] = TJ.useStateString({ name: 'lastAddedTag', initialValue: '', inspector: 'hidden' });
  const [, setLastRemovedTag] = TJ.useStateString({ name: 'lastRemovedTag', initialValue: '', inspector: 'hidden' });
  const [legacyRequired] = TJ.useStateBoolean({ name: 'required', label: 'Required', initialValue: false, inspector: 'hidden' });
  const [legacyDisabled] = TJ.useStateBoolean({ name: 'disabled', label: 'Disable', initialValue: false, inspector: 'hidden' });
  const onChange = TJ.useEventCallback({ name: 'onChange' });
  const onTagAdded = TJ.useEventCallback({ name: 'onTagAdded' });
  const onTagDeleted = TJ.useEventCallback({ name: 'onTagDeleted' });
  const onFocus = TJ.useEventCallback({ name: 'onFocus' });
  const onBlur = TJ.useEventCallback({ name: 'onBlur' });

  const inputRef = useRef<HTMLInputElement>(null);
  const [anchorRef, container] = usePortalContainer();
  const boxRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState('');
  const [tagError, setTagError] = useState('');
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [active, setActive] = useState(-1);
  const rules = { maxTags, caseSensitive: caseSensitive === true, pattern: tagPattern, patternError };
  const tags = M.toTags(rawValues);
  const options = M.toSuggestions(suggestions);
  const known = new Set(options.map((s) => (rules.caseSensitive ? s.tag : s.tag.toLowerCase())));

  const publish = (next: string[]) => {
    setValues(next);
    setNewTagsAdded(next.filter((t) => !known.has(rules.caseSensitive ? t : t.toLowerCase())));
  };
  useReseed(defaultValue, () => publish(M.addTags([], M.toTags(defaultValue).length ? defaultValue : rawValues, rules).tags));

  const commit = (next: string[], event: 'added' | 'deleted', tag: string) => {
    publish(next);
    if (event === 'added') {
      setLastAddedTag(tag);
      onTagAdded();
    } else {
      setLastRemovedTag(tag);
      onTagDeleted();
    }
    onChange();
  };
  /** Adds typed or picked tags; true when at least one was added. */
  const add = (candidates: unknown) => {
    let wanted = M.toTags(candidates);
    const cs = rules.caseSensitive;
    // A candidate is the suggestion whose value it is, else the one whose label it is.
    const resolve = (c: string) =>
      options.find((s) => s.tag === c)?.tag ??
      options.find((s) => M.sameTag(s.tag, c, cs))?.tag ??
      options.find((s) => M.sameTag(s.label, c, cs))?.tag;
    if (allowCustomTags !== false) wanted = wanted.map((c) => resolve(c) ?? c);
    else {
      const found = wanted.map(resolve).filter((t): t is string => !!t);
      if (found.length < wanted.length) setTagError('Pick a tag from the suggestions');
      wanted = found;
      if (!wanted.length) return false;
    }
    const result = M.addTags(tags, wanted, rules);
    if (result.error || allowCustomTags !== false) setTagError(result.error);
    if (result.added.length) commit(result.tags, 'added', result.added[result.added.length - 1]);
    setActive(-1);
    return result.added.length > 0;
  };
  const remove = (index: number) => {
    const tag = tags[index];
    if (tag === undefined) return;
    setTagError('');
    commit(tags.filter((_, i) => i !== index), 'deleted', tag);
  };
  const takeTyped = (typed: string) => {
    setTagError('');
    setDismissed(false);
    const { parts, rest } = M.splitTyped(typed);
    if (parts.length) add(parts);
    setText(rest);
    setActive(-1);
  };

  TJ.useAction({ name: 'setTags', displayName: 'Set tags', params: [{ handle: 'tags', displayName: 'Tags' }] }, (t) =>
    publish(M.addTags([], M.toTags(t), rules).tags)
  );
  TJ.useAction({ name: 'selectTags', displayName: 'Select tags', params: [{ handle: 'tags', displayName: 'Tags' }] }, (t) =>
    publish(M.addTags(tags, M.toTags(t), rules).tags)
  );
  TJ.useAction({ name: 'deselectTags', displayName: 'Deselect tags', params: [{ handle: 'tags', displayName: 'Tags' }] }, (t) => {
    const gone = M.toTags(t);
    publish(tags.filter((tag) => !gone.some((g) => M.sameTag(g, tag, rules.caseSensitive))));
  });
  // Clearing drops the unfinished text too, or leaving the box would add it as a tag.
  TJ.useAction({ name: 'clear', displayName: 'Clear' }, () => {
    publish([]);
    setText('');
    setTagError('');
  });
  TJ.useAction({ name: 'setFocus', displayName: 'Set focus' }, () => inputRef.current?.focus());
  TJ.useAction({ name: 'setBlur', displayName: 'Set blur' }, () => inputRef.current?.blur());
  // The pack's earlier action name, kept for apps that use it.
  TJ.useAction({ name: 'focus', displayName: 'Focus' }, () => inputRef.current?.focus());

  const fieldId = TJ.useFieldId();
  const control = TJ.useControlState();
  const check = TJ.useValidation({ section: 'choice', value: tags, present: tags.length > 0 });
  const rule = useRuleCheck(check, legacyRequired && !tags.length ? 'This field is mandatory' : '');
  const looks = useLooks(LOOKS);
  TJ.useComponentSettings({ defaultWidth: 10, defaultHeight: 7 });

  const disabled = legacyDisabled || control.disabled;
  const limit = M.clampLimit(maxTags);
  // At Max tags the box takes no more: no placeholder, no typing (Backspace still removes the last) and no menu.
  const full = limit > 0 && tags.length >= limit;
  const query = text.trim().toLowerCase();
  const visible = options
    .filter(
      (s) =>
        !tags.some((t) => M.sameTag(t, s.tag, rules.caseSensitive)) &&
        (!query || s.label.toLowerCase().includes(query) || s.tag.toLowerCase().includes(query))
    )
    .slice(0, 50);
  const menuOpen = focused && !dismissed && !disabled && !full && visible.length > 0;
  const chipLabel = (tag: string) =>
    options.find((s) => s.tag === tag)?.label ?? options.find((s) => M.sameTag(s.tag, tag, rules.caseSensitive))?.label ?? tag;
  const error = tagError || rule.error;

  return (
    <div className="ui ui2-in" ref={anchorRef} style={looks}>
      <Field label={label} description={description} htmlFor={fieldId} error={error} required={rule.required}>
        <FieldLoading loading={control.loading}>
          <Popover.Root open={menuOpen}>
            <Popover.Anchor asChild>
              <div
                ref={boxRef}
                className={cn('ui2-box ui2-tags', disabled && 'is-disabled')}
                onClick={() => inputRef.current?.focus()}
              >
                {tags.map((tag, i) => (
                  <span key={tag} className="ui2-chip">
                    <span className="ui2-chip-text">{chipLabel(tag)}</span>
                    {disabled ? null : (
                      <button
                        type="button"
                        className="ui2-chip-x"
                        aria-label={`Remove ${chipLabel(tag)}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(i);
                        }}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </span>
                ))}
                <input
                  ref={inputRef}
                  {...fieldAria(fieldId, error, rule.required, !!description)}
                  type="text"
                  role="combobox"
                  aria-expanded={menuOpen}
                  aria-autocomplete="list"
                  autoComplete="off"
                  className="ui2-tags-input"
                  value={text}
                  disabled={disabled}
                  readOnly={full}
                  placeholder={full ? '' : placeholder}
                  onChange={(e) => {
                    if ((e.nativeEvent as InputEvent).isComposing) setText(e.target.value);
                    else takeTyped(e.target.value);
                  }}
                  onCompositionEnd={(e) => takeTyped(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.nativeEvent.isComposing) return;
                    if (isEnter(e)) {
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
                  }}
                  onFocus={() => {
                    setFocused(true);
                    setDismissed(false);
                    onFocus();
                  }}
                  onBlur={() => {
                    setFocused(false);
                    setActive(-1);
                    rule.touch();
                    if (addOnBlur === true && text.trim() && add([text])) setText('');
                    onBlur();
                  }}
                />
                {showClearBtn && tags.length && !disabled && !control.loading ? (
                  <ClearX
                    label="Clear tags"
                    onClear={() => {
                      setTagError('');
                      commit([], 'deleted', tags[tags.length - 1]);
                    }}
                  />
                ) : null}
              </div>
            </Popover.Anchor>
            {container ? (
              <Popover.Portal container={container}>
                <Popover.Content
                  aria-label="Suggestions"
                  className="ui-popup ui2-in ui2-pop ui2-tags-menu"
                  style={looks}
                  align="start"
                  sideOffset={4}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                  onCloseAutoFocus={(e) => e.preventDefault()}
                  onInteractOutside={(e) => {
                    if (e.target instanceof Node && boxRef.current?.contains(e.target)) e.preventDefault();
                    else setDismissed(true);
                  }}
                  onEscapeKeyDown={() => setDismissed(true)}
                >
                  <div role="listbox" aria-label="Suggestions">
                    {visible.map((s, i) => (
                      <div
                        key={`${s.tag}-${i}`}
                        role="option"
                        aria-selected={i === active}
                        data-active={i === active || undefined}
                        className="ui2-pop-item"
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => {
                          if (add([s.tag])) setText('');
                          inputRef.current?.focus();
                        }}
                      >
                        {s.label}
                      </div>
                    ))}
                  </div>
                </Popover.Content>
              </Popover.Portal>
            ) : null}
          </Popover.Root>
        </FieldLoading>
      </Field>
    </div>
  );
};
