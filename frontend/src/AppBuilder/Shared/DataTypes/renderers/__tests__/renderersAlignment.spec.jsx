/**
 * Shared data-type renderer alignment spec.
 *
 * These renderers back Table columns and KeyValuePair fields. Neither widget has an approved
 * contract yet (both are `not-started` in widget-testing-manifest.json), so the scenario IDs carry
 * the shared `DataTypeRenderers-` prefix. A future Table or KeyValuePair contract disposes its
 * cell-alignment rows as `shared:<this file>#<ID>` instead of re-testing them.
 *
 * jsdom lays nothing out, so "the first lines are not clipped" cannot be observed here. The
 * consumer-visible decision that causes the clipping is the cell box's `align-items`: plain
 * `center` centres overflowing wrapped content so its top lines sit above the cell and can never
 * be scrolled into view, while `safe center` falls back to `start` on overflow. The real rule from
 * table-component.scss is injected so the oracle reads the computed value, not a class name.
 */
import React from 'react';
import fs from 'fs';
import path from 'path';
import { render, screen } from '@testing-library/react';
import { TextRenderer } from '../TextRenderer';
import { StringRenderer } from '../StringRenderer';
import { HTMLRenderer } from '../HTMLRenderer';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { LinkRenderer } from '../LinkRenderer';
import { SelectRenderer } from '../SelectRenderer';
import { TagsRenderer } from '../TagsRenderer';

// Six lines inside a 40px cell: the shape a wrapped Table cell takes when content wrap is on.
const LINES = Array.from({ length: 6 }, (_, i) => `line ${i + 1}`);
const LONG = LINES.join('\n');
const MAX_HEIGHT = 40;
const OPTIONS = [{ label: 'line 1', value: 'a' }];

const STYLESHEET = path.resolve(__dirname, '../../../../../_styles/table-component.scss');
let styleTag;
beforeAll(() => {
  // The one rule the fix depends on, taken from the real stylesheet rather than restated here.
  const rule = fs.readFileSync(STYLESHEET, 'utf8').match(/\.align-items-safe-center\s*\{[^}]*\}/);
  if (!rule) throw new Error('table-component.scss no longer defines .align-items-safe-center');
  styleTag = document.createElement('style');
  styleTag.textContent = rule[0];
  document.head.appendChild(styleTag);
});
afterAll(() => styleTag.remove());

const cellBoxOf = (text) => screen.getByText(text, { exact: false }).closest('.h-100');
const alignItemsOf = (node) => getComputedStyle(node).alignItems;

describe('Shared data-type renderers: cell alignment', () => {
  const readOnlyCases = [
    ['TextRenderer', () => <TextRenderer value={LONG} maxHeight={MAX_HEIGHT} />],
    ['StringRenderer', () => <StringRenderer value={LONG} maxHeight={MAX_HEIGHT} />],
    ['HTMLRenderer', () => <HTMLRenderer value={LINES.map((l) => `<p>${l}</p>`).join('')} maxHeight={MAX_HEIGHT} />],
    ['MarkdownRenderer', () => <MarkdownRenderer value={LINES.join('\n\n')} maxHeight={MAX_HEIGHT} />],
    ['LinkRenderer', () => <LinkRenderer value="https://example.com" displayText={LONG} />],
    ['SelectRenderer', () => <SelectRenderer options={OPTIONS} value="a" isEditable={false} />],
    ['TagsRenderer', () => <TagsRenderer options={OPTIONS} value={['a']} isMulti isEditable={false} />],
  ];

  test.each(readOnlyCases)(
    '[DataTypeRenderers-ALN-001] %s keeps overflowing wrapped content anchored to the top of the cell',
    (_, ui) => {
      // Break this catches: reverting the cell box to plain `align-items: center`, which centres
      // overflowing wrapped content so its first lines are pushed above the cell edge and clipped.
      render(ui());
      expect(alignItemsOf(cellBoxOf('line 1'))).toBe('safe center');
    }
  );

  test('[DataTypeRenderers-ALN-002] the editable text cell keeps the same anchoring while typing', () => {
    // Break this catches: the contentEditable path drifting back to `center` so a long value being
    // edited scrolls its first lines out of reach.
    const { container } = render(
      <TextRenderer
        value={LONG}
        maxHeight={MAX_HEIGHT}
        isEditable
        isEditing
        setIsEditing={() => {}}
        onChange={() => {}}
      />
    );
    expect(container.querySelector('[contenteditable]')).toHaveStyle({ alignItems: 'safe center' });
  });

  test('[DataTypeRenderers-ALN-002] the editable string cell keeps the same anchoring while typing', () => {
    // Break this catches: the string edit box, the one path the clipping fix touched in
    // StringRenderer, drifting back to `center`.
    const { container } = render(<StringRenderer value={LONG} maxHeight={MAX_HEIGHT} isEditable onChange={() => {}} />);
    expect(alignItemsOf(container.querySelector('.long-text-input'))).toBe('safe center');
  });
});
