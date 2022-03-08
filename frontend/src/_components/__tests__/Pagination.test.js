import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import React from 'react';
import { Pagination } from '../Pagination';
import { fireEvent, render } from '@testing-library/react';

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: jest.fn(),
  useEffect: jest.fn(),
}));

describe('Pagination', () => {
  const props = {
    currentPage: 1,
    count: 100,
    itemsPerPage: 10,
    pageChanged: jest.fn(),
  };

  it('should allow the user to click on previous nav', () => {
    props.currentPage = 2;
    const { getByTestId } = render(<Pagination {...props} />);
    fireEvent.click(getByTestId('previous'));
    expect(props.pageChanged).toHaveBeenCalled();
  });

  it('should allow the user to click on next nav', () => {
    const { getByTestId } = render(<Pagination {...props} />);
    fireEvent.click(getByTestId('next'));
    expect(props.pageChanged).toHaveBeenCalled();
  });

  it('previous nav should be disabled when currentPage=1', () => {
    props.currentPage = 1;
    const { getByTestId } = render(<Pagination {...props} />);
    expect(getByTestId('previous-0')).toHaveClass('disabled');
  });
});
