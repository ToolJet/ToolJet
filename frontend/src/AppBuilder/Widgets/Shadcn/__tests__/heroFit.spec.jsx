import React from 'react';
import { render } from '@testing-library/react';
import { shadHeroConfig } from '../../../WidgetManager/shadcnSource.sections';
import { ShadHero } from '../ShadSections';

// A Hero taller than its saved box drew past its bottom edge and over the widget under it: a task board's column
// headers sat under a 236px hero in a 200px box (Daymark, 2026-10-15). The viewer grows the box and moves the widgets
// below (dynamic height); the editor draws every widget at its saved size, so there the hero's panel stops at its box
// and its content scrolls inside the panel.

global.ResizeObserver =
  global.ResizeObserver ||
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

const defaultsOf = (config) =>
  Object.fromEntries(
    Object.entries(config.definition.properties).map(([key, { value }]) => {
      const m = typeof value === 'string' && value.match(/^\{\{([\s\S]*)\}\}$/);
      // eslint-disable-next-line no-new-func
      return [key, m ? new Function(`return (${m[1]});`)() : value];
    })
  );
const mount = (currentMode, properties = {}) =>
  render(
    <ShadHero
      id="h1"
      componentType="ShadHero"
      height={200}
      width={900}
      currentMode={currentMode}
      properties={{
        ...defaultsOf(shadHeroConfig),
        eyebrow: 'A little more clarity',
        title: 'Make room for what matters',
        subtitle: 'A calm place to keep the next step in view.',
        meta: ['Your task space'],
        actionLabel: 'New task',
        asideValue: 19,
        asideLabel: 'Open tasks',
        ...properties,
      }}
      styles={{}}
      setExposedVariables={() => {}}
      setExposedVariable={() => {}}
      fireEvent={() => {}}
    />
  );
const shell = (container) => container.querySelector('.tj-shadcn');
const classes = (el) => (el?.className ?? '').split(/\s+/);
// The shell fills the box and nothing in it draws past the box: the panel is capped at the box and scrolls (a loading
// hero, which has no panel, scrolls in the shell).
const contained = (root) => {
  const panel = root.querySelector('section.sc-hero');
  const capped = panel
    ? classes(panel).includes('max-h-full') &&
      classes(panel).includes('overflow-y-auto') &&
      classes(panel.parentElement).includes('h-full')
    : classes(root).includes('overflow-y-auto');
  return classes(root).includes('h-full') && capped;
};

describe('Hero in its box', () => {
  it('keeps its content inside its box in the editor, where the box does not grow', () => {
    const { container } = mount('edit');
    expect(contained(shell(container))).toBe(true);
  });

  it('keeps its content inside its box in the viewer when dynamic height is turned off', () => {
    const { container } = mount('view', { dynamicHeight: false });
    expect(contained(shell(container))).toBe(true);
  });

  it('is as tall as its content in the viewer, where the box grows and moves the widgets below', () => {
    const { container } = mount('view');
    expect(contained(shell(container))).toBe(false);
    expect(shell(container).className).not.toMatch(/\boverflow-/);
    expect(container.querySelector('section.sc-hero').className).not.toMatch(/\b(overflow-|max-h-)/);
  });

  it('keeps a loading hero inside its box in the editor too', () => {
    const { container } = mount('edit', { loadingState: true, loadingIndicator: 'skeleton' });
    expect(contained(shell(container))).toBe(true);
  });
});
