import React from 'react';
import { render, screen } from '@testing-library/react';
import QrScanner from '../QrScanner';

jest.mock(
  'react-qr-reader',
  () =>
    function MockQrReader({ className, style }) {
      return (
        <section data-testid="qr-reader" className={className} style={style}>
          <section>
            <video />
          </section>
        </section>
      );
    }
);

describe('QrScanner frame', () => {
  it('stretches the camera to full widget width and height without cropping', () => {
    const { container } = render(
      <QrScanner
        styles={{ visibility: true, disabledState: false, boxShadow: 'none' }}
        fireEvent={jest.fn()}
        setExposedVariable={jest.fn()}
        dataCy="qr-scanner"
        height={300}
      />
    );

    expect(container.firstElementChild).toHaveStyle({
      width: '100%',
      height: '300px',
      overflow: 'hidden',
    });
    const reader = screen.getByTestId('qr-reader');
    expect(reader.parentElement).toBe(container.firstElementChild);
    expect(reader).toHaveClass('qr-scanner__reader');
    expect(reader).toHaveStyle({ width: '100%', height: '100%' });
  });
});
