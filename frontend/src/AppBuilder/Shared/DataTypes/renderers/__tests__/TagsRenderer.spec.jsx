import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagsRenderer } from '../TagsRenderer';

const baseProps = {
  options: [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
  ],
  value: null,
  onChange: () => {},
  disabled: false,
  darkMode: false,
  horizontalAlignment: 'left',
  isNewRow: false,
  isFocused: false,
  setIsFocused: () => {},
  isValid: true,
  validationError: '',
  menuIsOpen: undefined,
};

describe('[Table-BUG] TagsRenderer: non-editable empty cell', () => {
  it('renders nothing (no dropdown, no placeholder) for a non-editable single-tag cell with no value', () => {
    const { container } = render(<TagsRenderer {...baseProps} isEditable={false} isMulti={false} value={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing (no dropdown, no placeholder) for a non-editable multi-tag cell with no value', () => {
    const { container } = render(<TagsRenderer {...baseProps} isEditable={false} isMulti={true} value={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('still renders the interactive dropdown with its placeholder when the column is editable and has no value', () => {
    const { container } = render(<TagsRenderer {...baseProps} isEditable={true} isMulti={false} value={null} />);

    expect(container.querySelector('.react-select__control')).toBeInTheDocument();
  });

  it('still renders the selected value when the column is not editable but has a value', () => {
    const { container } = render(<TagsRenderer {...baseProps} isEditable={false} isMulti={false} value="a" />);

    expect(container.textContent).toContain('A');
  });
});

describe('[Table-BUG] TagsRenderer: customRule validation error tooltip', () => {
  it('shows the full error message in a tooltip on hover, regardless of row height', async () => {
    const { container } = render(
      <TagsRenderer
        {...baseProps}
        isEditable={true}
        isMulti={false}
        value="a"
        isValid={false}
        validationError="Always invalid"
      />
    );

    const control = container.querySelector('.is-invalid');
    expect(control).toBeInTheDocument();

    await userEvent.hover(control);

    const tooltip = await screen.findByText('Always invalid', { selector: '.overlay-cell-table' });
    expect(tooltip).toBeInTheDocument();
  });

  it("renders a presence-only .invalid-feedback marker so the table cell's own `:has(.invalid-feedback):hover` border rule activates, and omits it when valid", () => {
    const { container: validContainer } = render(
      <TagsRenderer {...baseProps} isEditable={true} isMulti={false} value="a" isValid={true} />
    );
    expect(validContainer.querySelector('.invalid-feedback')).not.toBeInTheDocument();

    const { container: invalidContainer } = render(
      <TagsRenderer
        {...baseProps}
        isEditable={true}
        isMulti={false}
        value="a"
        isValid={false}
        validationError="Always invalid"
      />
    );
    expect(invalidContainer.querySelector('.invalid-feedback')).toBeInTheDocument();
  });
});

describe('[Table-BUG] TagsRenderer: multi-select dropdown stays open after picking an option', () => {
  beforeAll(() => {
    // jsdom doesn't implement scrollIntoView, which the open menu calls once an option is selected.
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('does not close the menu when an option is picked in a multi-select cell', async () => {
    // Break this catches: handleChange calls setIsFocused(false) for every selection, so a multi-select
    // menu closes after each pick instead of staying open until the user clicks outside.
    const setIsFocused = jest.fn();
    const onChange = jest.fn();
    const ui = (
      <TagsRenderer
        {...baseProps}
        isEditable={true}
        isMulti={true}
        value={[]}
        onChange={onChange}
        setIsFocused={setIsFocused}
      />
    );
    const { container } = render(ui);
    await userEvent.click(container.querySelector('.react-select__control'));

    await userEvent.click(await screen.findByText('A'));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(setIsFocused).not.toHaveBeenCalledWith(false);
  });

  it('still closes the menu when an option is picked in a single-select cell', async () => {
    const setIsFocused = jest.fn();
    const ui = (
      <TagsRenderer {...baseProps} isEditable={true} isMulti={false} value={null} setIsFocused={setIsFocused} />
    );
    const { container } = render(ui);
    await userEvent.click(container.querySelector('.react-select__control'));

    await userEvent.click(await screen.findByText('A'));

    expect(setIsFocused).toHaveBeenCalledWith(false);
  });
});
