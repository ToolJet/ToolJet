import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RatingColumnProperties from '../RatingColumnProperties';
import { MAX_RATING_COUNT } from '@/AppBuilder/Widgets/NewTable/_utils/helper';
import { toast } from 'react-hot-toast';

jest.mock('react-hot-toast', () => ({ toast: { error: jest.fn() } }));

jest.mock('@/AppBuilder/CodeEditor', () => (props) => (
  <input
    data-testid={`code-hinter-${props.componentName}`}
    defaultValue={props.initialValue}
    onChange={(e) => props.onChange(e.target.value)}
  />
));

beforeEach(() => {
  toast.error.mockClear();
});

const renderRatingColumnProperties = (maxRating, onColumnItemChange = jest.fn()) => ({
  onColumnItemChange,
  ...render(
    <RatingColumnProperties
      column={{ columnType: 'rating', maxRating }}
      index={0}
      darkMode={false}
      currentState={{}}
      onColumnItemChange={onColumnItemChange}
      getPopoverFieldSource={(columnType, field) => field}
      setColumnPopoverRootCloseBlocker={jest.fn()}
      component={{ component: { name: 'table1' } }}
    />
  ),
});

describe('RatingColumnProperties - max rating value is rejected above the limit', () => {
  it('saves the value capped at MAX_RATING_COUNT when the user enters a value above the limit', () => {
    const { onColumnItemChange } = renderRatingColumnProperties(5);

    fireEvent.change(screen.getByTestId('code-hinter-maxRating'), { target: { value: '13' } });

    expect(onColumnItemChange).toHaveBeenCalledWith(0, 'maxRating', String(MAX_RATING_COUNT));
  });

  it('saves the value as entered when it is within the allowed range', () => {
    const { onColumnItemChange } = renderRatingColumnProperties(5);

    fireEvent.change(screen.getByTestId('code-hinter-maxRating'), { target: { value: '7' } });

    expect(onColumnItemChange).toHaveBeenCalledWith(0, 'maxRating', '7');
  });

  it('saves a dynamic binding untouched even if it looks like it could exceed the limit', () => {
    const { onColumnItemChange } = renderRatingColumnProperties(5);

    fireEvent.change(screen.getByTestId('code-hinter-maxRating'), { target: { value: '{{queryValue}}' } });

    expect(onColumnItemChange).toHaveBeenCalledWith(0, 'maxRating', '{{queryValue}}');
  });
});

describe('RatingColumnProperties - max rating limit toast and display correction', () => {
  it('shows a toast error when the entered value is clamped', () => {
    renderRatingColumnProperties(5);

    fireEvent.change(screen.getByTestId('code-hinter-maxRating'), { target: { value: '13' } });

    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining(String(MAX_RATING_COUNT)));
  });

  it('does not show a toast when the entered value is within range', () => {
    renderRatingColumnProperties(5);

    fireEvent.change(screen.getByTestId('code-hinter-maxRating'), { target: { value: '7' } });

    expect(toast.error).not.toHaveBeenCalled();
  });

  it('corrects the displayed value back to the saved column value on every offending entry, not just the first', () => {
    renderRatingColumnProperties(5);
    const getInput = () => screen.getByTestId('code-hinter-maxRating');

    fireEvent.change(getInput(), { target: { value: '13' } });
    expect(getInput().value).toBe('5');

    fireEvent.change(getInput(), { target: { value: '20' } });
    expect(getInput().value).toBe('5');

    expect(toast.error).toHaveBeenCalledTimes(2);
  });
});
