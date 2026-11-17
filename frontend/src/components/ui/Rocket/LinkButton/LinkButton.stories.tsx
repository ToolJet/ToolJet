import React from 'react';
import { LinkButton } from './LinkButton';

export default {
  title: 'Rocket/LinkButton',
  component: LinkButton,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

export const Default = { args: { children: 'Clear all filters' } };

export const States = {
  render: () => (
    <div className="tw-flex tw-items-center tw-gap-4">
      <LinkButton>Default</LinkButton>
      <LinkButton danger>Danger</LinkButton>
      <LinkButton disabled>Disabled</LinkButton>
    </div>
  ),
};
