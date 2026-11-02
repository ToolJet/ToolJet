import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Button } from '../Button';

const disabledIconColor = 'color-mix(in srgb, var(--icon-on-solid, #FFFFFF) 50%, transparent)';

describe('Button colors when disabled', () => {
  it('uses the disabled on-solid color for an icon without a custom fill', () => {
    const markup = renderToStaticMarkup(<Button disabled leadingIcon="smilerectangle" />);

    expect(markup).toContain(`fill="${disabledIconColor}"`);
  });

  it('preserves a custom fill for an icon', () => {
    const markup = renderToStaticMarkup(<Button disabled leadingIcon="smilerectangle" fill="var(--icon-brand)" />);

    expect(markup).toContain('fill="var(--icon-brand)"');
    expect(markup).not.toContain(disabledIconColor);
  });

  it('preserves the configured loader color while loading and disabled', () => {
    const markup = renderToStaticMarkup(
      <Button disabled isLoading fill="var(--icon-danger)">
        Loading
      </Button>
    );

    expect(markup).toContain('var(--icon-danger)');
    expect(markup).not.toContain(disabledIconColor);
  });
});
