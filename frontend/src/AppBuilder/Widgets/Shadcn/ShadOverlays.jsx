import React, { useMemo } from 'react';
import { ModalV2 } from '@/AppBuilder/Widgets/ModalV2/ModalV2';
import { shadDialogConfig } from '@/AppBuilder/WidgetManager/widgets/shadDialog';
import './shadcn.scss';
import './shadDialog.scss';

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

export const ShadDialog = (props) => {
  const properties = useMemo(() => sanitizeDialog(props.properties, 'properties'), [props.properties]);
  const styles = useMemo(() => sanitizeDialog(props.styles, 'styles'), [props.styles]);
  return <ModalV2 {...props} properties={properties} styles={styles} />;
};
