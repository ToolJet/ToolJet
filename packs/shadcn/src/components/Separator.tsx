import React from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';

export const Separator = () => {
  const [orientation] = ToolJet.useStateEnumeration({ name: 'orientation', label: 'Orientation', enumDefinition: ['horizontal', 'vertical'], initialValue: 'horizontal', inspector: 'switch' });
  const [label] = ToolJet.useStateString({ name: 'label', label: 'Label', description: 'Optional text in the middle.', initialValue: '' });
  const lineColor = ToolJet.useStyleString({ name: 'lineColor', label: 'Line', inspector: 'color', initialValue: 'var(--cc-default-border)' });
  const thickness = ToolJet.useStyleNumber({ name: 'thickness', label: 'Thickness', initialValue: 1 });
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 3 });

  const vertical = orientation === 'vertical';
  const line = <span className="ui-separator-line" style={{ background: lineColor, [vertical ? 'width' : 'height']: Math.max(1, Number(thickness) || 1) }} />;
  return (
    <div className="ui ui-separator" role="separator" aria-orientation={orientation as "horizontal"} style={{ flexDirection: vertical ? 'column' : 'row' }}>
      {line}
      {label && !vertical ? (
        <>
          <span className="ui-description">{label}</span>
          {line}
        </>
      ) : null}
    </div>
  );
};
