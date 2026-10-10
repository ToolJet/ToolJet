import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TemplateCard from '../TemplateCard';

const template = {
  id: 'hvac-service-management',
  name: 'HVAC service management',
  description: 'Dispatch HVAC jobs.',
  category: 'field-services',
};

describe('TemplateCard', () => {
  it('shows the name and description', () => {
    render(<TemplateCard template={template} colorIndex={0} onOpen={jest.fn()} />);
    expect(screen.getByText('HVAC service management')).toBeInTheDocument();
    expect(screen.getByText('Dispatch HVAC jobs.')).toBeInTheDocument();
  });

  it('opens the template on click', async () => {
    const onOpen = jest.fn();
    render(<TemplateCard template={template} colorIndex={0} onOpen={onOpen} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onOpen).toHaveBeenCalledWith(template);
  });

  it('colours the category icon from the palette by colour index', () => {
    const { container } = render(<TemplateCard template={template} colorIndex={1} onOpen={jest.fn()} />);
    expect(container.querySelector('svg')).toHaveStyle({ color: '#7FBF92' });
  });

  it('keeps the data-cy hook the Cypress specs use', () => {
    render(<TemplateCard template={template} colorIndex={0} onOpen={jest.fn()} />);
    expect(screen.getByRole('button')).toHaveAttribute('data-cy', 'hvac-service-management-list-item');
  });
});
