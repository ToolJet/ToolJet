import React from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import type { OverlayTriggerProps } from 'react-bootstrap';
import type { TooltipBinding } from './types';

export type BindingTooltipProps = {
  id?: string;
  title?: string;
  bindings?: TooltipBinding[];
  placement?: OverlayTriggerProps['placement'];
  /** A single element, not ReactNode — OverlayTrigger needs something it can clone. */
  children: React.ReactElement;
};

/**
 * Dark card shown on hover over a relationship row: a sentence describing the
 * relationship, then one `label / expression` pair per binding behind it.
 * Renders the child untouched when there is nothing to explain.
 */
export const BindingTooltip = ({
  id,
  title,
  bindings,
  placement = 'right',
  children,
}: BindingTooltipProps): React.ReactElement => {
  const resolved = (bindings ?? []).filter((binding) => binding.expression);
  if (!title || resolved.length === 0) return children;

  return (
    <OverlayTrigger
      placement={placement}
      trigger={['hover', 'focus']}
      delay={{ show: 200, hide: 100 }}
      overlay={
        <Popover id={id} className="dependency-binding-popover">
          <Popover.Body bsPrefix="dependency-binding-popover-body">
            <div className="dependency-binding-title">{title}</div>
            <div className="dependency-binding-body">
              {resolved.map((binding) => (
                <div className="dependency-binding-entry" key={binding.label}>
                  <div className="dependency-binding-label">{binding.label}</div>
                  <div className="dependency-binding-expression">{binding.expression}</div>
                </div>
              ))}
            </div>
          </Popover.Body>
        </Popover>
      }
    >
      {children}
    </OverlayTrigger>
  );
};

export default BindingTooltip;
