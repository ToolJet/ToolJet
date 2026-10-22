import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * A blank UI 2.0 colour showed a swatch and the word "Theme"; only once a colour was picked did the field name it
 * (Surface/Surface1), and its popover opened on the colour picker. A blank colour the widget draws in one of the
 * theme's colours now shows that token's name (else its hex), with a muted "Theme" beside it. Nothing is saved until a
 * colour is picked.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import BaseColorSwatches from '@/modules/common/components/BaseColorSwatches';
import { ThemeDefaultContext } from '../themeDefault';

jest.mock('@/modules/common/helpers/onboardingStoreHelper', () => ({ __esModule: true, default: undefined }));
jest.mock('@/modules/common/helpers/invitationStoreHelper', () => ({ __esModule: true, default: undefined }));

const colorMap = { 'var(--cc-surface1-surface)': 'surface/surface1', 'var(--cc-primary-text)': 'text/primary' };
const swatches = (themeDefault, value = '') =>
  render(
    <ThemeDefaultContext.Provider value={themeDefault}>
      <BaseColorSwatches value={value} colorMap={colorMap} onChange={() => {}} cyLabel="field" />
    </ThemeDefaultContext.Provider>
  );

describe('a blank colour drawn in a theme colour', () => {
  it('names the token, with a muted Theme beside it', () => {
    const { container } = swatches(
      { value: 'rgb(255, 255, 255)', token: 'var(--cc-surface1-surface)' },
      'var(--cc-surface1-surface)'
    );
    expect(screen.getByText('Surface/Surface1')).toBeInTheDocument();
    expect(screen.getByText('Theme')).toBeInTheDocument();
    expect(container.querySelector('.color-icon').style.backgroundColor).toBe('rgb(255, 255, 255)');
  });

  it('shows the hex where no theme token draws it', () => {
    swatches({ value: 'rgb(67, 104, 227)', token: null });
    expect(screen.getByText('#4368E3')).toBeInTheDocument();
    expect(screen.getByText('Theme')).toBeInTheDocument();
  });

  it('a picked token shows as before, without the Theme mark', () => {
    swatches(null, 'var(--cc-primary-text)');
    expect(screen.getByText('Text/Primary')).toBeInTheDocument();
    expect(screen.queryByText('Theme')).toBeNull();
  });
});
