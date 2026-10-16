import React from 'react';
import { render } from '@testing-library/react';
import { CodeDiff } from '../CodeDiff';

const before = ['const a = 1;', 'const b = 2;', 'return a + b;'].join('\n');
const after = ['const a = 1;', 'const b = 3;', 'return a + b;'].join('\n');

describe('code diff view', () => {
  it('puts the two versions side by side, read-only', () => {
    const { container } = render(<CodeDiff before={before} after={after} language="javascript" />);
    const editors = container.querySelectorAll('.cm-mergeView .cm-editor');
    expect(editors).toHaveLength(2);
    expect(editors[0].textContent).toContain('const b = 2;');
    expect(editors[1].textContent).toContain('const b = 3;');
    container.querySelectorAll('.cm-content').forEach((content) => {
      expect(content.getAttribute('contenteditable')).toBe('false');
    });
  });

  it('interleaves removed and added lines in the unified view', () => {
    const { container } = render(<CodeDiff before={before} after={after} language="javascript" mode="unified" />);
    expect(container.querySelectorAll('.cm-editor')).toHaveLength(1);
    expect(container.querySelector('.cm-deletedChunk')?.textContent).toContain('const b = 2;');
    expect(container.querySelector('.cm-changedLine')?.textContent).toContain('const b = 3;');
  });

  it('numbers lines from the source', () => {
    const { container } = render(<CodeDiff before={before} after={after} language="javascript" />);
    const numbers = [...container.querySelectorAll('.cm-lineNumbers .cm-gutterElement')].map((el) => el.textContent);
    expect(numbers).toEqual(expect.arrayContaining(['1', '2', '3']));
  });

  it('folds long unchanged stretches', () => {
    const lines = Array.from({ length: 40 }, (_, i) => `line ${i + 1}`);
    const changed = [...lines];
    changed[20] = 'line twenty-one';
    const { container } = render(<CodeDiff before={lines.join('\n')} after={changed.join('\n')} mode="unified" />);
    expect(container.querySelector('.cm-collapsedLines')).not.toBeNull();
  });
});
