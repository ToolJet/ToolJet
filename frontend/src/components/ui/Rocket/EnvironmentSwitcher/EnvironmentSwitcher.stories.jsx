import React, { useState } from 'react';
import { EnvironmentSwitcher } from './EnvironmentSwitcher';

const OPTIONS = [
  { id: 'development', label: 'Development', tone: 'info', meta: '0005' },
  { id: 'staging', label: 'Staging', tone: 'warning', meta: '0002' },
  { id: 'production', label: 'Production', tone: 'warning', meta: '0001' },
];

function Controlled({ initial = 'development', ...props }) {
  const [value, setValue] = useState(initial);
  return <EnvironmentSwitcher options={OPTIONS} value={value} onValueChange={setValue} {...props} />;
}

export default {
  title: 'Rocket/EnvironmentSwitcher',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  component: EnvironmentSwitcher,
};

export const Default = { render: () => <Controlled /> };

export const WithoutMeta = {
  render: () => (
    <Controlled
      options={OPTIONS.map(({ meta, ...option }) => option)}
      tooltip="Choose which environment’s values to see."
    />
  ),
};

export const WithLockedOption = {
  render: () => (
    <EnvironmentSwitcher
      options={OPTIONS.map((option) =>
        option.id === 'development'
          ? option
          : { ...option, disabled: true, disabledReason: 'Upgrade your plan to switch environments.' }
      )}
      value="development"
      onValueChange={() => {}}
    />
  ),
};

export const Disabled = { render: () => <Controlled disabled /> };

export const AllEnvironments = {
  render: () => (
    <div className="tw-flex tw-flex-col tw-gap-3">
      {OPTIONS.map((option) => (
        <Controlled key={option.id} initial={option.id} />
      ))}
    </div>
  ),
};
