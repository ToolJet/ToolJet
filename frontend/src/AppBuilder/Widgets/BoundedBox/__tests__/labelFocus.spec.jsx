import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RenderEditor } from '../RenderEditor';
import { RenderHighlight } from '../RenderHighlight';

const labels = [
  { name: 'Alice', value: 'Alice' },
  { name: 'Morgan', value: 'Morgan' },
];
const geometry = { type: 'RECTANGLE', x: 10, y: 10, width: 20, height: 30 };
const styles = () => ({});

// After a label is picked for a new annotation, keyboard focus must stay on that annotation.
describe('[BoundedBox-ACC-002] focus after picking a label', () => {
  // Break this catches: the editor unmounting on commit with nothing taking focus, so it drops to the page body.
  test('[BoundedBox-ACC-002] the editor reports the id of the annotation it adds', async () => {
    const onLabelCommitted = jest.fn();
    let added;
    render(
      <RenderEditor
        annotation={{ geometry }}
        labels={labels}
        setAnnotation={() => {}}
        setAnnotations={(update) => {
          added = update([]);
        }}
        setExposedVariable={() => {}}
        fireEvent={() => {}}
        darkMode={false}
        selectElementStyles={styles}
        getExposedAnnotations={(a) => a}
        onLabelCommitted={onLabelCommitted}
      />
    );

    await userEvent.click(screen.getByRole('combobox', { name: 'Label for new annotation' }));
    await userEvent.click(await screen.findByText('Alice'));

    expect(onLabelCommitted).toHaveBeenCalledWith(added[0].data.id);
  });

  test('[BoundedBox-ACC-002] the new annotation’s label control takes focus', () => {
    render(
      <RenderHighlight
        annotation={{ geometry, data: { id: 'a1', text: 'Alice' } }}
        labels={labels}
        setExposedVariable={() => {}}
        darkMode={false}
        selectElementStyles={styles}
        setAnnotations={() => {}}
        fireEvent={() => {}}
        getExposedAnnotations={(a) => a}
        autoFocusLabel
      />
    );

    expect(document.activeElement).toBe(screen.getByRole('combobox', { name: 'Label for annotation Alice' }));
  });
});
