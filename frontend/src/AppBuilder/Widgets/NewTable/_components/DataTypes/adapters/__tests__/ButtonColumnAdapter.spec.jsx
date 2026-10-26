import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { ButtonColumn } from '../ButtonColumnAdapter';

const renderButton = (props) =>
  render(
    <ButtonColumn
      buttonLabel="Button"
      buttonType="solid"
      iconName="IconHome2"
      iconVisibility={true}
      iconAlignment="left"
      {...props}
    />
  );

describe('ButtonColumn icon color', () => {
  it('[Table-BUG-013] respects an explicitly selected icon color on a solid button instead of forcing it to a different one', async () => {
    const { container } = renderButton({ iconColor: '#ffffff' });

    await waitFor(() => expect(container.querySelector('svg')).toBeInTheDocument());
    expect(container.querySelector('svg')).toHaveStyle({ color: 'rgb(255, 255, 255)' });
  });
});
