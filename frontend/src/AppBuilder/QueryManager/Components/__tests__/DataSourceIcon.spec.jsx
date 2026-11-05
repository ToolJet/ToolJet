import React from 'react';
import { render } from '@testing-library/react';
import DataSourceIcon from '../DataSourceIcon';
import openAILightUrl from '@/AppBuilder/QueryManager/Icons/Icons/openai-light.svg?url';

const OPENAI_ICON_BASE64 = 'PHN2Zz48L3N2Zz4=';

describe('DataSourceIcon', () => {
  afterEach(() => {
    localStorage.removeItem('darkMode');
  });

  it('should render the light OpenAI logo as an image in dark mode when kind is missing but pluginId is present', () => {
    localStorage.setItem('darkMode', 'true');
    const source = { pluginId: 'openai', plugin: { iconFile: { data: OPENAI_ICON_BASE64 } } };
    const { container } = render(<DataSourceIcon source={source} height={16} />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe(openAILightUrl);
  });

  it('should render the stored icon in light mode', () => {
    localStorage.setItem('darkMode', 'false');
    const source = { kind: 'openai', plugin: { iconFile: { data: OPENAI_ICON_BASE64 } } };
    const { container } = render(<DataSourceIcon source={source} height={16} />);
    expect(container.querySelector('img')).not.toBeNull();
  });
});
