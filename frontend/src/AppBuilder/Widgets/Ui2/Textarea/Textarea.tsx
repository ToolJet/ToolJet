import React, { useLayoutEffect, useRef, useState } from 'react';
import { useAutoHeight, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Textarea } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { Shell } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { Field, fieldIdOf } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { useTextField } from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { isEnter } from '@/AppBuilder/Widgets/Ui2/_shared/keyboard';

export const ShadTextarea = (props: WidgetProps) => {
  const { properties, height, fireEvent } = props;
  const { check, fieldProps } = useTextField<HTMLTextAreaElement>(props);
  // The label, help text and message take what they draw and the text area the rest of the box. A one-line estimate
  // (22px label, 24px help) let a label or help text that wraps push the text area past the box's bottom edge.
  const estimate = (properties.label ? 22 : 0) + (properties.description || check.error ? 24 : 0);
  const [chrome, setChrome] = useState(estimate);
  const fieldRef = useRef<HTMLDivElement>(null);
  // When the label and help text leave the text area less than its 60px, the box grows to fit them (in view, with
  // dynamic height on); the text area itself is sized from the authored height, so the box comes back down.
  useAutoHeight(props, fieldRef);
  useLayoutEffect(() => {
    const field = fieldRef.current;
    const area = field?.querySelector('textarea');
    if (!field || !area) return undefined;
    const measure = () => {
      const next = Math.max(0, field.scrollHeight - area.offsetHeight);
      setChrome((current) => (Math.abs(current - next) < 1 ? current : next));
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    [...(field.children[0]?.children ?? [])].forEach((part) => part !== area && observer?.observe(part));
    return () => observer?.disconnect();
  }, [properties.label, properties.description, check.error]);
  return (
    <Shell {...props}>
      <div ref={fieldRef}>
        <Field
          id={fieldIdOf(props)}
          label={properties.label}
          description={properties.description}
          error={check.error}
          required={check.required}
        >
          <Textarea
            {...fieldProps}
            style={{ height: Math.max(60, (Number(height) || 96) - chrome) }}
            onKeyDown={(e) => isEnter(e) && !e.shiftKey && fireEvent('onEnterPressed')}
          />
        </Field>
      </div>
    </Shell>
  );
};

export default withControlState(ShadTextarea);
