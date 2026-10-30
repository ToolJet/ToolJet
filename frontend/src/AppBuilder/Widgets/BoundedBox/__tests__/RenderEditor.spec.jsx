import React from 'react';
import { render } from '@testing-library/react';
import { RenderEditor } from '../RenderEditor';

const renderEditor = (geometry, containerSize = { width: 500, height: 500 }) => {
  const view = render(
    <RenderEditor
      annotation={{ geometry }}
      labels={[]}
      setAnnotation={jest.fn()}
      setAnnotations={jest.fn()}
      setExposedVariable={jest.fn()}
      fireEvent={jest.fn()}
      darkMode={false}
      selectElementStyles={() => ({})}
      getExposedAnnotations={jest.fn()}
      containerSize={containerSize}
    />
  );

  return view.container.firstElementChild;
};

describe('RenderEditor annotation label placement', () => {
  it('places the complete label to the left when it would cross the widget right edge', () => {
    expect(renderEditor({ x: 82, y: 20, width: 10, height: 16 })).toHaveStyle({
      left: '335px',
      top: '180px',
      width: '125px',
    });
  });

  it('places the complete label above when it would cross the widget bottom edge', () => {
    expect(renderEditor({ x: 20, y: 84, width: 16, height: 10 })).toHaveStyle({
      left: '100px',
      top: '380px',
      width: '125px',
    });
  });

  it('keeps the complete label inside a widget narrower than its normal minimum width', () => {
    expect(renderEditor({ x: 50, y: 50, width: 10, height: 10 }, { width: 80, height: 100 })).toHaveStyle({
      left: '0px',
      top: '60px',
      width: '80px',
    });
  });
});
