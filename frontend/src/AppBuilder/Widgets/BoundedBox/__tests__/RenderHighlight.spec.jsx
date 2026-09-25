import React from 'react';
import { render } from '@testing-library/react';
import { RenderHighlight } from '../RenderHighlight';

describe('RenderHighlight annotation label placement', () => {
  it('places the complete saved label above and left at the widget bottom-right edge', () => {
    const { container } = render(
      <RenderHighlight
        annotation={{
          geometry: { type: 'RECTANGLE', x: 82, y: 84, width: 10, height: 10 },
          data: { id: 'annotation-1', text: 'Label' },
        }}
        labels={[]}
        setExposedVariable={jest.fn()}
        darkMode={false}
        selectElementStyles={() => ({})}
        setAnnotations={jest.fn()}
        fireEvent={jest.fn()}
        getExposedAnnotations={jest.fn()}
        containerSize={{ width: 500, height: 500 }}
      />
    );

    expect(container.querySelector('.row.m-0')).toHaveStyle({
      left: '335px',
      top: '380px',
      width: '125px',
    });
  });
});
