import React, { useState } from 'react';
import { SearchInput } from './SearchInput';

function Controlled({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <div style={{ width: 208 }}>
      <SearchInput aria-label="Search tables" placeholder="Search tables" value={value} onValueChange={setValue} />
    </div>
  );
}

export default {
  title: 'Rocket/SearchInput',
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  component: SearchInput,
};

export const Default = { render: () => <Controlled /> };

export const WithValue = { render: () => <Controlled initial="releasenotes" /> };
