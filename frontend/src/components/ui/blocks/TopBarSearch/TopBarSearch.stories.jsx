import React, { useState } from 'react';
import { TopBarSearch } from './TopBarSearch';

export default {
  title: 'UI/Blocks/TopBarSearch',
  component: TopBarSearch,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the search input',
    },
    value: {
      control: 'text',
      description: 'Current search value',
    },
    onChange: {
      action: 'changed',
      description: 'Called when search value changes',
    },
  },
};

const Template = (args) => {
  const [value, setValue] = useState(args.value || '');

  return (
    <div className="tw-w-full tw-max-w-md">
      <TopBarSearch
        {...args}
        value={value}
        onChange={(newValue) => {
          setValue(newValue);
          args.onChange?.(newValue);
        }}
      />
    </div>
  );
};

export const Default = Template.bind({});
Default.args = {
  placeholder: 'Search',
  value: '',
};

export const WithPlaceholder = Template.bind({});
WithPlaceholder.args = {
  placeholder: 'Search apps...',
  value: '',
};

export const WithValue = Template.bind({});
WithValue.args = {
  placeholder: 'Search',
  value: 'My search query',
};

export const Controlled = () => {
  const [searchValue, setSearchValue] = useState('');

  return (
    <div className="tw-w-full tw-max-w-md tw-space-y-4">
      <TopBarSearch
        placeholder="Search apps..."
        value={searchValue}
        onChange={(value) => {
          setSearchValue(value);
          console.log('Search changed:', value);
        }}
      />
      <div className="tw-p-4 tw-bg-background-surface-layer-02 tw-rounded-lg">
        <p className="tw-text-sm tw-text-text-medium">
          <span className="tw-font-medium">Current search:</span> "{searchValue || '(empty)'}"
        </p>
      </div>
    </div>
  );
};

export const DifferentPlaceholders = () => {
  const [search1, setSearch1] = useState('');
  const [search2, setSearch2] = useState('');
  const [search3, setSearch3] = useState('');

  return (
    <div className="tw-w-full tw-max-w-md tw-space-y-6">
      <div>
        <label className="tw-text-sm tw-font-medium tw-text-text-default tw-mb-2 tw-block">
          Apps Search
        </label>
        <TopBarSearch
          placeholder="Search apps..."
          value={search1}
          onChange={setSearch1}
        />
      </div>
      <div>
        <label className="tw-text-sm tw-font-medium tw-text-text-default tw-mb-2 tw-block">
          Modules Search
        </label>
        <TopBarSearch
          placeholder="Search modules..."
          value={search2}
          onChange={setSearch2}
        />
      </div>
      <div>
        <label className="tw-text-sm tw-font-medium tw-text-text-default tw-mb-2 tw-block">
          General Search
        </label>
        <TopBarSearch
          placeholder="Search"
          value={search3}
          onChange={setSearch3}
        />
      </div>
    </div>
  );
};

