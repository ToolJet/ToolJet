import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { ImageRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/ImageRenderer';
import { ImageField } from '@/AppBuilder/Widgets/KeyValuePair/_components/FieldAdapters/ImageFieldAdapter';

// A Key Value image field whose URL fails to load must not render as an empty cell.
describe('[KeyValuePair-IMG-001] image that fails to load', () => {
  // Break this catches: no onError fallback, so a broken image renders as a 0×0 <img> with nothing visible.
  test('[KeyValuePair-IMG-001] shows a labelled fallback instead of the broken image', () => {
    render(<ImageRenderer value="data:image/png;base64,bm90LWFuLWltYWdl" />);
    fireEvent.error(document.querySelector('img'));

    expect(document.querySelector('img')).toBeNull();
    expect(screen.getByRole('img', { name: 'Image failed to load' })).toBeInTheDocument();
  });

  // Break this catches: the adapter's '100%' default reaching the renderer, which writes the invalid '100%px'.
  test('[KeyValuePair-IMG-001] a Key Value image field without a width writes a valid width', () => {
    render(<ImageField value="data:image/png;base64,AAAA" field={{}} />);

    expect(document.querySelector('img').style.width).toBe('auto');
  });
});
