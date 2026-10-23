import React from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';

// Container: builders drop ToolJet components into the body slot. The look is driven by styles,
// which the builder sets in the Styles tab and which are not exposed to the app.
export const Card = () => {
  const [title] = ToolJet.useStateString({ name: 'title', label: 'Title', initialValue: 'Card title' });
  const [description] = ToolJet.useStateString({
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
  const radius = ToolJet.useStyleNumber({ name: 'borderRadius', label: 'Border radius', initialValue: '' });
  const padding = ToolJet.useStyleNumber({ name: 'padding', label: 'Padding', initialValue: 16, section: 'Spacing' });
  ToolJet.useComponentSettings({ defaultWidth: 16, defaultHeight: 40 });

  return (
    <div
      className="ui ui-card"
      style={{ background, borderRadius: radius === "" || radius == null ? "var(--ui-radius)" : radius, padding, borderTop: `4px solid ${accent}` }}
    >
      <div className="ui-card-title">{title}</div>
      {description && <div className="ui-card-description">{description}</div>}
      <ToolJet.Slot name="body" className="ui-card-body" />
    </div>
  );
};
