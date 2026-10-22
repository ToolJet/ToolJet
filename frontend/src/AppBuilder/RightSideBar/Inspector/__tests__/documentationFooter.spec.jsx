/**
 * The inspector's footer names the selected component's type: a native widget's "Read documentation for Button", with
 * its page. UI 2.0 widgets had no footer, so a builder could not tell which component they had selected (a Dialog, or
 * a container holding components). Every UI 2.0 widget now has the same footer, naming its display name; the UI 2.0
 * widgets have no documentation pages yet, so it names the type without a link.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';
import { DocumentationFooter } from '../Components/DocumentationFooter';

jest.mock('react-i18next', () => ({
  ...jest.requireActual('react-i18next'),
  useTranslation: () => ({
    t: (_key, fallback, values) => fallback.replace('{{componentMeta}}', values.componentMeta),
  }),
}));

const packConfigs = Object.values(componentTypeDefinitionMap).filter((config) => config.component?.startsWith('Shad'));

describe('the inspector footer', () => {
  it('covers every UI 2.0 widget', () => {
    expect(packConfigs.length).toBeGreaterThan(70);
  });

  test.each(packConfigs.map((config) => [config.displayName, config]))(
    'names a UI 2.0 %s by its display name',
    (name, config) => {
      const { unmount } = render(<DocumentationFooter componentMeta={config} />);
      const footer = document.querySelector('[data-cy="widget-documentation-footer"]');
      expect(footer).toHaveTextContent(`${name} · ToolJet UI 2.0`);
      expect(footer).not.toHaveTextContent(config.component);
      // No documentation page yet: no link to a page that is not there.
      expect(footer.querySelector('a[href]')).toBeNull();
      unmount();
    }
  );

  it('names and links a native widget as before', () => {
    render(<DocumentationFooter componentMeta={componentTypeDefinitionMap.Button} />);
    expect(screen.getByText('Read documentation for Button')).toBeInTheDocument();
    expect(document.querySelector('[data-cy="widget-documentation-link"]')).toHaveAttribute(
      'href',
      'https://docs.tooljet.io/docs/widgets/button'
    );
  });
});
