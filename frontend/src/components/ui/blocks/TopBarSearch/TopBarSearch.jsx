import React from 'react';
import PropTypes from 'prop-types';
import { Input } from '@/components/ui/Rocket/input';
import { Search } from 'lucide-react';

/**
 * TopBarSearch - Reusable search component for the topbar
 * 
 * @param {Object} props
 * @param {string} props.placeholder - Placeholder text for the search input
 * @param {string} props.value - Current search value
 * @param {Function} props.onChange - Change handler: (value: string) => void
 * @param {string} [props.className] - Additional CSS classes
 */
export function TopBarSearch({ placeholder = 'Search', value = '', onChange, className = '' }) {
  const handleChange = (e) => {
    onChange?.(e.target.value);
  };

  return (
    <div className={`tw-flex tw-items-center tw-flex-1 tw-justify-center tw-max-w-md ${className}`}>
      <div className="tw-group tw-relative tw-w-[180px]">
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          className="tw-pl-[60px] tw-pr-4 tw-py-1 tw-h-8 tw-text-xs tw-bg-background-surface-layer-01 tw-border-transparent hover:tw-bg-interactive-hover focus:tw-border-border-accent-strong focus:tw-pl-[34px] tw-transition-all tw-duration-200"
          size="small"
        />
        <Search
          width={16}
          height={16}
          className="tw-absolute tw-left-[38px] group-focus-within:!tw-left-3 tw-top-1/2 tw-transform -tw-translate-y-1/2 tw-text-icon-default tw-pointer-events-none tw-transition-all tw-duration-200"
        />
      </div>
    </div>
  );
}

TopBarSearch.propTypes = {
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  className: PropTypes.string,
};

TopBarSearch.defaultProps = {
  placeholder: 'Search',
  value: '',
  onChange: undefined,
  className: '',
};

export default TopBarSearch;

