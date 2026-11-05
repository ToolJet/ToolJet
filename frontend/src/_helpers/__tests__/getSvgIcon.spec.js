import React from 'react';
import { render } from '@testing-library/react';
import { getSvgIcon } from '../appUtils';
import { resolvePluginKind, isOpenAIKind } from '../pluginKind';
import { Card } from '@/_ui/Card';
import openAILightUrl from '@/AppBuilder/QueryManager/Icons/Icons/openai-light.svg?url';

const OPENAI_ICON_BASE64 = 'PHN2Zz48L3N2Zz4=';

describe('getSvgIcon', () => {
  afterEach(() => {
    localStorage.removeItem('darkMode');
  });

  it('should render the stored plugin icon in light mode', () => {
    localStorage.setItem('darkMode', 'false');
    const { container } = render(<div>{getSvgIcon('openai', 24, 24, OPENAI_ICON_BASE64)}</div>);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe(`data:image/svg+xml;base64,${OPENAI_ICON_BASE64}`);
  });

  it('should render the light OpenAI logo as an image in dark mode instead of the stored dark icon', () => {
    localStorage.setItem('darkMode', 'true');
    const { container } = render(<div>{getSvgIcon('openai', 24, 24, OPENAI_ICON_BASE64)}</div>);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe(openAILightUrl);
  });

  it('should keep other plugin icons unchanged in dark mode', () => {
    localStorage.setItem('darkMode', 'true');
    const { container } = render(<div>{getSvgIcon('github', 24, 24, OPENAI_ICON_BASE64)}</div>);
    expect(container.querySelector('img')).not.toBeNull();
  });
});

describe('resolvePluginKind', () => {
  it('should resolve kind from kind, pluginId and plugin_id fields', () => {
    expect(resolvePluginKind({ kind: 'OpenAI' })).toBe('openai');
    expect(resolvePluginKind({ pluginId: 'openai' })).toBe('openai');
    expect(resolvePluginKind({ plugin_id: 'openai' })).toBe('openai');
    expect(resolvePluginKind({ kind: 'postgresql' })).toBe('postgresql');
    expect(resolvePluginKind({})).toBe('');
    expect(resolvePluginKind(null)).toBe('');
  });

  it('should detect the OpenAI kind case-insensitively', () => {
    expect(isOpenAIKind('openai')).toBe(true);
    expect(isOpenAIKind('OpenAI')).toBe(true);
    expect(isOpenAIKind('OPENAI')).toBe(true);
    expect(isOpenAIKind('github')).toBe(false);
    expect(isOpenAIKind('')).toBe(false);
  });
});

describe('Card data source icon', () => {
  afterEach(() => {
    localStorage.removeItem('darkMode');
  });

  it('should render the light OpenAI logo as an image for marketplace OpenAI in dark mode', () => {
    localStorage.setItem('darkMode', 'true');
    const { container } = render(
      <Card title="OpenAI" src={`data:image/svg+xml;base64,${OPENAI_ICON_BASE64}`} iconKind="openai" />
    );
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe(openAILightUrl);
  });

  it('should keep rendering the stored icon in light mode', () => {
    localStorage.setItem('darkMode', 'false');
    const { container } = render(
      <Card title="OpenAI" src={`data:image/svg+xml;base64,${OPENAI_ICON_BASE64}`} iconKind="openai" />
    );
    expect(container.querySelector('img')).not.toBeNull();
  });
});
