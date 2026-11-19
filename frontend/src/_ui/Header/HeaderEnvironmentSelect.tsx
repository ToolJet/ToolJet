import React from 'react';

import { useHeaderEnvironmentStore } from '@/_stores/headerEnvironmentStore';
import { environmentTone } from '@/_helpers/environmentTone';
import { EnvironmentSwitcher } from '@/components/ui/Rocket';

// Shows the environment select the current page set through `useHeaderEnvironmentSelect`; nothing otherwise.
export default function HeaderEnvironmentSelect() {
  const select = useHeaderEnvironmentStore((state) => state.select);
  if (!select) return null;

  const { environments, environmentId, onChange, footerAction, tooltip } = select;

  return (
    <EnvironmentSwitcher
      options={environments.map(({ name, ...environment }) => ({
        ...environment,
        label: name,
        tone: environmentTone(name),
      }))}
      value={environmentId}
      onValueChange={onChange}
      footerAction={footerAction}
      tooltip={tooltip}
    />
  );
}
