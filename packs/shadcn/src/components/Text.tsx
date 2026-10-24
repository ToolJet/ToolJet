import React from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { cn } from '../lib/cn';
import { CASE_LABELS, CASE_VALUES, FONT_LABELS, FONT_VALUES, WEIGHT_LABELS, WEIGHT_VALUES, typeStyle } from '../lib/ui2/display/type';
import { LoadingBox, LoadingFrame, TextSkel, useLoadingLook } from '../lib/ui2/loading/look';
import '../styles/ui2-display.css';

export const Text = () => {
  const [text, setText] = ToolJet.useStateString({ name: 'text', label: 'Text', initialValue: 'Text' });
  const [tone] = ToolJet.useStateEnumeration({
    name: 'tone',
    label: 'Style',
    enumDefinition: ['paragraph', 'lead', 'muted', 'small', 'large'],
    enumLabels: { paragraph: 'Paragraph', lead: 'Lead', muted: 'Muted', small: 'Small', large: 'Large' },
    initialValue: 'paragraph',
  });
  const onClick = ToolJet.useEventCallback({ name: 'onClick' });
  const onHover = ToolJet.useEventCallback({ name: 'onHover' });
  const textColor = ToolJet.useStyleString({ name: 'textColor', label: 'Text color', inspector: 'color', initialValue: '' });
  const textAlign = ToolJet.useStyleEnumeration({ name: 'textAlign', label: 'Text alignment (left, center, right)', enumDefinition: ['left', 'center', 'right'], initialValue: 'left', inspector: 'switch' });
  const fontFamily = ToolJet.useStyleEnumeration({ name: 'fontFamily', label: 'Typeface', enumDefinition: FONT_VALUES, enumLabels: FONT_LABELS, initialValue: 'theme' });
  const fontWeight = ToolJet.useStyleEnumeration({ name: 'fontWeight', label: 'Weight', enumDefinition: WEIGHT_VALUES, enumLabels: WEIGHT_LABELS, initialValue: '' });
  const letterSpacing = ToolJet.useStyleString({ name: 'letterSpacing', label: 'Letter spacing (px, or em like 0.12em)', initialValue: '' });
  const textTransform = ToolJet.useStyleEnumeration({ name: 'textTransform', label: 'Casing', enumDefinition: CASE_VALUES, enumLabels: CASE_LABELS, initialValue: 'none' });
  const fontSize = ToolJet.useStyleNumber({ name: 'fontSize', label: 'Font size (px)', initialValue: '' });
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ defaultWidth: 16, defaultHeight: 3 });

  ToolJet.useAction(
    { name: 'setText', displayName: 'Set text', params: [{ handle: 'text', displayName: 'Text', defaultValue: 'New text' }] },
    (t) => setText(t === null || t === undefined || typeof t === 'object' ? '' : String(t))
  );
  ToolJet.useAction({ name: 'clear', displayName: 'Clear' }, () => setText(''));

  const looks = typeStyle({ fontFamily, fontWeight, letterSpacing, textTransform, fontSize }, Math.round((Number(fontSize) || 14) * 1.5));
  return (
    <LoadingFrame loading={ld.loading} look={ld.skeleton ? <TextSkel /> : <LoadingBox />}>
      <div className="ui ui-text-wrap">
        <p
          className={cn('ui2-text', `is-${['paragraph', 'lead', 'muted', 'small', 'large'].includes(tone) ? tone : 'paragraph'}`)}
          style={{ textAlign: textAlign as 'left', ...(textColor ? { color: textColor } : {}), ...looks }}
          onClick={onClick}
          onMouseEnter={onHover}
        >
          {String(text ?? '')}
        </p>
      </div>
    </LoadingFrame>
  );
};
