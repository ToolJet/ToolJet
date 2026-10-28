import React from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { displayText } from '../lib/displayText';
import { useThemeRadius } from '../lib/styleDefaults';

// Container: builders drop ToolJet components into the body slot. The look is driven by styles,
// which the builder sets in the Styles tab and which are not exposed to the app.
export const Card = () => {
  const [rawTitle] = ToolJet.useStateString({ name: 'title', label: 'Title', initialValue: 'Card title' });
  const [rawDescription] = ToolJet.useStateString({
    name: 'description',
    label: 'Description',
    initialValue: 'Drop components into the area below.',
  });

  const background = ToolJet.useStyleString({
    name: 'backgroundColor',
    label: 'Background',
    inspector: 'color',
    initialValue: 'var(--cc-surface1-surface)',
  });
  const accent = ToolJet.useStyleString({
    name: 'accentColor',
    label: 'Accent',
    inspector: 'color',
    initialValue: 'var(--cc-primary-brand)',
  });
  const radius = useThemeRadius('borderRadius', 'Border radius');
  const padding = ToolJet.useStyleNumber({ name: 'padding', label: 'Padding', initialValue: 16, section: 'Spacing' });
  ToolJet.useComponentSettings({ role: 'card', fit: false, defaultWidth: 16, defaultHeight: 40 });
  const title = displayText(rawTitle);
  const description = displayText(rawDescription);

  return (
    <div
      className="ui ui-card"
      style={{
        background,
        borderRadius: radius === '' || radius == null ? 'var(--ui-radius)' : radius,
        padding,
        borderTop: `4px solid ${accent}`,
      }}
    >
      <div className="ui-card-title">{title}</div>
      {description && <div className="ui-card-description">{description}</div>}
      <ToolJet.Slot name="body" className="ui-card-body" />
    </div>
  );
};
