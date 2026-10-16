import React, { useEffect, useMemo } from 'react';
import { ModalV2 } from '@/AppBuilder/Widgets/ModalV2/ModalV2';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { openerOf, trapTab, watchOpeners } from './dialogFocus';
import { shadDialogConfig } from '@/AppBuilder/WidgetManager/widgets/shadDialog';
import '@/AppBuilder/Widgets/Ui2/_shared/styles/shadcn.scss';
import '@/AppBuilder/Widgets/Ui2/_shared/styles/shadDialog.scss';

// shadcn/ui pack (experiment): the Dialog is ToolJet's ModalV2 drawn in the pack's look. ModalV2 reads the skin from
// the component type and adds the classes styled in shadDialog.scss; it keeps its own control state, open/close
// actions and canvases.

// A value ModalV2 cannot take (an object as the button label, a number as a colour) is replaced by the definition's
// default before it reaches ModalV2, which renders labels as children and colours through string helpers. ToolJet's
// validation alone does not cover it: a colour that fails its schema falls back to the schema default, which is
// `false` for the trigger button colours.
const definitionDefault = (section, key) => {
  const value = shadDialogConfig.definition?.[section]?.[key]?.value;
  if (typeof value !== 'string') return value;
  const code = value.match(/^\{\{([\s\S]*)\}\}$/);
  if (!code) return value;
  if (/^(true|false)$/.test(code[1].trim())) return code[1].trim() === 'true';
  const n = Number(code[1]);
  return Number.isFinite(n) ? n : undefined;
};
const fits = (type, value) =>
  type === 'string'
    ? typeof value === 'string'
    : type === 'boolean'
    ? typeof value === 'boolean'
    : type === 'number'
    ? typeof value === 'number' && Number.isFinite(value)
    : true;
export const sanitizeDialog = (values, section) => {
  if (!values || typeof values !== 'object') return {};
  const out = { ...values };
  for (const [key, meta] of Object.entries(shadDialogConfig[section] || {})) {
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

/** While the dialog is open in an app (not the editor), Tab stays inside it (dialogFocus.js), and on close focus goes
 *  back to what opened it (a row's button, a trigger), as a dialog should for keyboard and screen reader users. */
const useDialogFocus = (id, currentMode) => {
  const { moduleId } = useModuleContext();
  const show = useStore(
    (state) => state.resolvedStore?.modules?.[moduleId]?.exposedValues?.components?.[id]?.show === true
  );
  useEffect(() => watchOpeners(), []);
  useEffect(() => {
    if (!show || currentMode === 'edit' || typeof document === 'undefined') return undefined;
    const opener = openerOf();
    const root = () => document.querySelector(`.modal-dialog[component-id="${id}"]`)?.closest('.modal');
    const onKey = (e) => trapTab(e, root());
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      if (opener?.isConnected && typeof opener.focus === 'function') opener.focus({ preventScroll: true });
    };
  }, [show, currentMode, id]);
};

export const ShadDialog = (props) => {
  useDialogFocus(props.id, props.currentMode);
  const properties = useMemo(() => sanitizeDialog(props.properties, 'properties'), [props.properties]);
  const styles = useMemo(() => sanitizeDialog(props.styles, 'styles'), [props.styles]);
  return <ModalV2 {...props} properties={properties} styles={styles} />;
};

export default ShadDialog;
