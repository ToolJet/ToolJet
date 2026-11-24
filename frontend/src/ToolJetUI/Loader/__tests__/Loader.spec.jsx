import React from 'react';
import { render } from '@testing-library/react';
import Loader from '../Loader';

// Several loaders on one page must each paint their own colour.
test('[Loader-ID-001] each loader references its own gradients', () => {
  // Break this catches: fixed gradient ids shared by every loader, so all loaders on a page paint the first
  // loader's colour.
  const { container } = render(
    <>
      <Loader width="16" color="#ffffff" />
      <Loader width="16" color="#e63946" />
    </>
  );

  const svgs = [...container.querySelectorAll('svg')];
  const gradientIds = svgs.map((svg) => [...svg.querySelectorAll('linearGradient')].map((g) => g.id));
  expect(new Set(gradientIds.flat()).size).toBe(4);
  svgs.forEach((svg, index) => {
    const strokes = [...svg.querySelectorAll('path[stroke^="url("]')].map((p) => p.getAttribute('stroke'));
    expect(strokes.sort()).toEqual(gradientIds[index].map((id) => `url(#${id})`).sort());
  });
});
