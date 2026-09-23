/**
 * [Table-RENDERER-001] Shared DataTypes renderer contract (frontend/ee/test/app-builder/widgets/Table/TESTING.md).
 *
 * Each renderer under Shared/DataTypes/renderers/* is pure and context-independent —
 * given a value and config, it renders the documented presentation and, where
 * editable, calls back with the documented shape. This holds regardless of which
 * widget wraps it (Table today; KeyValuePair references this suite via `shared:`
 * per D-08 once its own contract exists). DatePickerRenderer already has its own
 * dedicated suite (DatePickerRenderer.spec.jsx) and is not repeated here.
 *
 * Pure Jest/RTL against each renderer directly — no store, no widget, nothing mocked.
 * Lives in this shared cross-widget directory (not a widget-specific one) because
 * it is genuinely shared infrastructure, not a Table-only concern.
 */
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { StringRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/StringRenderer';
import { NumberRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/NumberRenderer';
import { BooleanRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/BooleanRenderer';
import { LinkRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/LinkRenderer';
import { ImageRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/ImageRenderer';
import { JSONRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/JSONRenderer';
import { HTMLRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/HTMLRenderer';
import { MarkdownRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/MarkdownRenderer';
import { SelectRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/SelectRenderer';
import { TagsRenderer } from '@/AppBuilder/Shared/DataTypes/renderers/TagsRenderer';

describe('[Table-RENDERER-001] StringRenderer', () => {
  test('[Table-RENDERER-001] renders the idle value as text, and committing an edit calls onChange with the new text', () => {
    const onChange = jest.fn();
    render(
      <StringRenderer value="Ada" isEditable={true} isEditing={false} setIsEditing={() => {}} onChange={onChange} />
    );
    expect(screen.getByText('Ada')).toBeInTheDocument();

    render(
      <StringRenderer value="Ada" isEditable={true} isEditing={true} setIsEditing={() => {}} onChange={onChange} />
    );
    const editable = document.querySelector('[contenteditable="true"]');
    editable.textContent = 'Adaline';
    fireEvent.blur(editable);
    expect(onChange).toHaveBeenCalledWith('Adaline');
  });

  test('[Table-RENDERER-001] treats a value containing markup as literal text, not as HTML, while editing', () => {
    render(
      <StringRenderer
        value="<b>text here</b>"
        isEditable={true}
        isEditing={true}
        setIsEditing={() => {}}
        onChange={() => {}}
      />
    );
    const editable = document.querySelector('[contenteditable="true"]');
    expect(editable.querySelector('b')).toBeNull();
    expect(editable.textContent).toBe('<b>text here</b>');
  });
});

describe('[Table-RENDERER-001] NumberRenderer', () => {
  test('[Table-RENDERER-001] renders the idle value rounded to decimalPlaces, and an editable input commits a parsed number on blur', () => {
    // removingExcessDecimalPlaces truncates rather than rounds.
    const { unmount } = render(<NumberRenderer value={1.987} isEditable={false} decimalPlaces={2} />);
    expect(screen.getByText('1.98')).toBeInTheDocument();
    unmount();

    const onChange = jest.fn();
    render(<NumberRenderer value={5} isEditable={true} onChange={onChange} />);
    const input = document.querySelector('input[type="number"]');
    fireEvent.change(input, { target: { value: '42' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(42);
  });

  test('[Table-RENDERER-001] clearing the input commits null, not an empty string', () => {
    const onChange = jest.fn();
    render(<NumberRenderer value={5} isEditable={true} onChange={onChange} />);
    const input = document.querySelector('input[type="number"]');
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(null);
  });
});

describe('[Table-RENDERER-001] BooleanRenderer', () => {
  test('[Table-RENDERER-001] read-only shows a tick/remove icon by value; editable renders a real checkbox that calls onChange with the flipped value', () => {
    const { container, unmount } = render(<BooleanRenderer value={true} isEditable={false} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
    unmount();

    const onChange = jest.fn();
    render(<BooleanRenderer value={false} isEditable={true} onChange={onChange} />);
    fireEvent.click(document.querySelector('input[type="checkbox"]'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('[Table-RENDERER-001] LinkRenderer', () => {
  test('[Table-RENDERER-001] renders displayText as a hyperlink to value, honoring linkTarget', () => {
    render(<LinkRenderer value="https://example.com" displayText="Visit" linkTarget="_blank" />);
    const link = screen.getByText('Visit');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
  });
});

describe('[Table-RENDERER-001] ImageRenderer', () => {
  test('[Table-RENDERER-001] renders an <img> for a configured value, and nothing at all when the value is empty', () => {
    const { container, unmount } = render(<ImageRenderer value="https://example.com/a.png" />);
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.com/a.png');
    unmount();

    const { container: emptyContainer } = render(<ImageRenderer value="" />);
    expect(emptyContainer).toBeEmptyDOMElement();
  });
});

describe('[Table-RENDERER-001] JSONRenderer', () => {
  test('[Table-RENDERER-001] renders a formatted representation of an object value', () => {
    render(<JSONRenderer value={{ a: 1 }} isEditable={false} />);
    expect(document.body.textContent).toContain('a');
    expect(document.body.textContent).toContain('1');
  });
});

describe('[Table-RENDERER-001] HTMLRenderer and MarkdownRenderer', () => {
  test('[Table-RENDERER-001] HTMLRenderer sanitizes a script tag out of the bound value via DOMPurify', () => {
    const { container } = render(<HTMLRenderer value={'<script>window.__xssA = true</script>Hi'} isEditable={false} />);
    expect(container.querySelector('script')).not.toBeInTheDocument();
    expect(window.__xssA).toBeUndefined();
    expect(container.textContent).toContain('Hi');
  });

  test('[Table-RENDERER-001] HTMLRenderer sanitizes an inline event-handler attribute out of the bound value', () => {
    const { container } = render(
      <HTMLRenderer value={'<img src=x onerror="window.__xssB=true">Hi'} isEditable={false} />
    );
    expect(container.querySelector('img')?.getAttribute('onerror')).toBeFalsy();
    expect(window.__xssB).toBeUndefined();
  });

  test('[Table-RENDERER-001] MarkdownRenderer sanitizes a script tag out of the bound value via DOMPurify', () => {
    const { container } = render(
      <MarkdownRenderer value={'<script>window.__xssC = true</script>Hello'} isEditable={false} />
    );
    expect(container.querySelector('script')).not.toBeInTheDocument();
    expect(window.__xssC).toBeUndefined();
    expect(container.textContent).toContain('Hello');
  });
});

describe('[Table-RENDERER-001] SelectRenderer and TagsRenderer', () => {
  test('[Table-RENDERER-001] SelectRenderer renders the label matching the current value from the configured options', () => {
    render(
      <SelectRenderer
        options={[
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ]}
        value="inactive"
        isEditable={false}
      />
    );
    expect(document.body.textContent).toContain('Inactive');
  });

  test('[Table-RENDERER-001] TagsRenderer renders every selected value from a multi-value binding', () => {
    render(
      <TagsRenderer
        options={[
          { label: 'Reading', value: 'Reading' },
          { label: 'Music', value: 'Music' },
        ]}
        value={['Reading', 'Music']}
        isMulti={true}
        isEditable={false}
      />
    );
    expect(document.body.textContent).toContain('Reading');
    expect(document.body.textContent).toContain('Music');
  });
});
