import React, { useEffect, useMemo } from 'react';
import { ModalV2 } from '@/AppBuilder/Widgets/Ui2/_shared/ModalV2';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { useOwnContextPath } from '@/AppBuilder/Widgets/Ui2/_shared/SubcontainerContext';
import { modalOf, openerOf, trapTab, watchOpeners } from './dialogFocus';
import { toText } from '@/AppBuilder/Widgets/Ui2/_shared/values';
import { shadDialogConfig } from '@/AppBuilder/WidgetManager/widgets/shadDialog';
import type { Resolved, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import '@/AppBuilder/Widgets/Ui2/_shared/styles/shadcn.scss';
import '@/AppBuilder/Widgets/Ui2/_shared/styles/shadDialog.scss';

// ToolJet UI 2.0: the Dialog is ToolJet's ModalV2 drawn in the pack's look. ModalV2 reads the skin from
// the component type and adds the classes styled in shadDialog.scss; it keeps its own control state, open/close
// actions and canvases.

// A value ModalV2 cannot take (an object as the button label, a number as a colour) is replaced by the definition's
// default before it reaches ModalV2, which renders labels as children and colours through string helpers. ToolJet's
// validation alone does not cover it: a colour that fails its schema falls back to the schema default, which is
// `false` for the trigger button colours.
type DialogSection = 'properties' | 'styles';

/** What sanitizeDialog reads of an inspector entry in the config: its schema type, else its control type. */
type InspectorMeta = { type?: string; validation?: { schema?: { type?: string } } };

const definitionDefault = (section: DialogSection, key: string) => {
  const defaults: Record<string, { value?: unknown } | undefined> = shadDialogConfig.definition?.[section] ?? {};
  const value = defaults[key]?.value;
  if (typeof value !== 'string') return value;
  const code = value.match(/^\{\{([\s\S]*)\}\}$/);
  if (!code) return value;
  if (/^(true|false)$/.test(code[1].trim())) return code[1].trim() === 'true';
  const n = Number(code[1]);
  return Number.isFinite(n) ? n : undefined;
};
const fits = (type: string | undefined, value: unknown): boolean =>
  type === 'string'
    ? typeof value === 'string'
    : type === 'boolean'
    ? typeof value === 'boolean'
    : type === 'number'
    ? typeof value === 'number' && Number.isFinite(value)
    : true;
export const sanitizeDialog = (values: unknown, section: DialogSection): Resolved => {
  if (!values || typeof values !== 'object') return {};
  const out: Resolved = { ...values };
  const metas: Record<string, InspectorMeta | undefined> = shadDialogConfig[section] || {};
  for (const [key, meta] of Object.entries(metas)) {
    // The schema's type, else the one the inspector control edits (toggles have no schema).
    const type =
      meta?.validation?.schema?.type ||
      (meta?.type === 'toggle' ? 'boolean' : /^color/i.test(meta?.type || '') ? 'string' : undefined);
    if (!(key in out) || fits(type, out[key])) continue;
    const fallback = definitionDefault(section, key);
    if (fits(type, fallback)) out[key] = fallback;
    else if (type === 'boolean') out[key] = !!out[key];
    else if (type === 'string') out[key] = '';
    else delete out[key];
  }
  return out;
};

/** While the dialog is open in an app (not the editor), Tab stays inside it (dialogFocus.ts), and on close focus goes
 *  back to what opened it (a row's button, a trigger), as a dialog should for keyboard and screen reader users. */
/** What the dialog reads from the app store: whether it is open. */
type DialogStore = {
  resolvedStore?: { modules?: Record<string, { exposedValues?: { components?: Record<string, unknown> } }> };
};

/** The text of the first heading in an open dialog, its header's before its body's ('' for none). */
const headingOf = (modal: Element): string => {
  const HEADING = 'h1, h2, h3, h4, h5, h6, [role="heading"]';
  const el = modal.querySelector(`.modal-header :is(${HEADING})`) || modal.querySelector(HEADING);
  return (el?.textContent || '').trim().slice(0, 120);
};

const useDialogFocus = (
  id: string,
  currentMode?: string,
  name = 'Dialog',
  subContainerIndex?: unknown,
  parentId?: string
) => {
  const { moduleId } = useModuleContext();
  // In a List view row (or a nested one) the dialog's values are kept per row, components[id][row]: whether it is open
  // is read from its own row, as its open action writes it. The flat entry is never `show` there.
  const path = useOwnContextPath(subContainerIndex, parentId);
  const show = useStore((state: DialogStore) => {
    let own: unknown = state.resolvedStore?.modules?.[moduleId]?.exposedValues?.components?.[id];
    for (const { index } of path) if (Array.isArray(own)) own = own[index];
    return (own as { show?: unknown } | undefined)?.show === true;
  });
  useEffect(() => watchOpeners(), []);
  useEffect(() => {
    if (!show || currentMode === 'edit' || typeof document === 'undefined') return undefined;
    const opener = openerOf();
    const onKey = (e: KeyboardEvent) => trapTab(e, modalOf(id));
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      if (opener?.isConnected && typeof opener.focus === 'function') opener.focus({ preventScroll: true });
    };
  }, [show, currentMode, id]);
  // ModalV2 gives the open dialog role="dialog" and no name, so a screen reader announces an unnamed dialog: it reads
  // as the heading its header holds (a Heading widget, as a new Dialog has), else the Dialog's title. The modal and its
  // canvases mount a few commits after `show` turns on, so this looks again for 20 frames.
  useEffect(() => {
    if (!show) return undefined;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const label = () => {
      const modal = modalOf(id);
      const heading = modal ? headingOf(modal) : '';
      if (modal) modal.setAttribute('aria-label', heading || name);
      if (!heading && (tries += 1) < 20) timer = setTimeout(label, 16);
    };
    label();
    return () => clearTimeout(timer);
  }, [show, id, name]);
};

export const ShadDialog = (props: WidgetProps) => {
  useDialogFocus(
    props.id,
    props.currentMode,
    toText(props.properties?.title) || 'Dialog',
    props.subContainerIndex,
    props.parentId
  );
  const properties = useMemo(() => sanitizeDialog(props.properties, 'properties'), [props.properties]);
  const styles = useMemo(() => sanitizeDialog(props.styles, 'styles'), [props.styles]);
  return <ModalV2 {...props} properties={properties} styles={styles} />;
};

export default ShadDialog;
