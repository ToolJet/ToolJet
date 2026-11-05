import React from 'react';
import { render } from '@testing-library/react';
import { PluginIcon } from '..';
import openAILightUrl from '@/AppBuilder/QueryManager/Icons/Icons/openai-light.svg?url';

const OPENAI_ICON_BASE64 = 'PHN2Zz48L3N2Zz4=';
const SRC = `data:image/svg+xml;base64,${OPENAI_ICON_BASE64}`;

describe('PluginIcon', () => {
  afterEach(() => {
    localStorage.removeItem('darkMode');
  });

  it('should render the light OpenAI logo as an image in dark mode', () => {
    localStorage.setItem('darkMode', 'true');
    const { container } = render(<PluginIcon pluginKind="openai" src={SRC} alt="OpenAI" height={40} width={40} />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe(openAILightUrl);
    expect(img.getAttribute('alt')).toBe('OpenAI');
  });

  it('should render the given image in light mode', () => {
    localStorage.setItem('darkMode', 'false');
    const { container } = render(<PluginIcon pluginKind="openai" src={SRC} alt="OpenAI" height={40} width={40} />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe(SRC);
    expect(img.getAttribute('alt')).toBe('OpenAI');
  });

  it('should render the given image for other plugins in dark mode', () => {
    localStorage.setItem('darkMode', 'true');
    const { container } = render(<PluginIcon pluginKind="github" src={SRC} alt="GitHub" height={40} width={40} />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe(SRC);
  });
});
