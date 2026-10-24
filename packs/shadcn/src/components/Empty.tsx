import React from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { iconFor } from '../lib/icons';
import { px, styleVars } from '../lib/ui2/display/lists/model';
import { LoadingFrame, blockLook, useLoadingLook } from '../lib/ui2/loading/look';
import '../styles/ui2-display.css';

export const Empty = () => {
  const [title] = ToolJet.useStateString({ name: 'title', label: 'Title', initialValue: 'No results' });
  const [description] = ToolJet.useStateString({ name: 'description', label: 'Description', initialValue: '' });
  const [icon] = ToolJet.useStateString({ name: 'icon', label: 'Icon', description: 'Any lucide or Tabler name.', initialValue: 'inbox', inspector: 'icon' });
  const [actionLabel] = ToolJet.useStateString({ name: 'actionLabel', label: 'Action label', description: 'Empty hides the button.', initialValue: '' });
  const onActionClicked = ToolJet.useEventCallback({ name: 'onActionClicked' });
  const background = ToolJet.useStyleString({ name: 'backgroundColor', label: 'Background', inspector: 'color', initialValue: '' });
  const borderColor = ToolJet.useStyleString({ name: 'borderColor', label: 'Dashed border color', inspector: 'color', initialValue: '' });
  const borderRadius = ToolJet.useStyleNumber({ name: 'borderRadius', label: 'Radius', initialValue: '' });
  const iconBackgroundColor = ToolJet.useStyleString({ name: 'iconBackgroundColor', label: 'Icon background', inspector: 'color', initialValue: '' });
  const iconColor = ToolJet.useStyleString({ name: 'iconColor', label: 'Icon color', inspector: 'color', initialValue: '' });
  const titleColor = ToolJet.useStyleString({ name: 'titleColor', label: 'Title color', inspector: 'color', initialValue: '' });
  const textColor = ToolJet.useStyleString({ name: 'textColor', label: 'Description color', inspector: 'color', initialValue: '' });
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ defaultWidth: 14, defaultHeight: 20 });

  const Glyph = iconFor(icon) ?? iconFor('inbox')!;
  const vars = styleVars([
    [background, '--lk-bg'],
    [borderColor, '--lk-border'],
    [borderRadius, '--lk-radius', px],
    [iconBackgroundColor, '--lk-icon-bg'],
    [iconColor, '--lk-icon'],
    [titleColor, '--lk-title'],
    [textColor, '--lk-fg'],
  ]);
  return (
    <LoadingFrame loading={ld.loading} look={blockLook(ld.skeleton)}>
      <div className="ui ui2-empty" style={vars}>
        <div className="ui2-empty-icon">
          <Glyph size={20} />
        </div>
        <p className="ui2-empty-title">{String(title ?? '')}</p>
        {description ? <p className="ui2-empty-text">{String(description)}</p> : null}
        {actionLabel ? (
          <button type="button" className="ui-btn ui-btn--outline ui-btn--sm ui-btn--auto ui2-empty-action" onClick={onActionClicked}>
            {String(actionLabel)}
          </button>
        ) : null}
      </div>
    </LoadingFrame>
  );
};
