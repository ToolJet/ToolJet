import React from 'react';
import PropTypes from 'prop-types';
import { MainLayout } from '@/components/layouts/MainLayout';
import { TopBarSearch } from '@/components/ui/blocks/TopBarSearch';

/**
 * @deprecated Use MainLayout from '@/components/layouts/MainLayout' instead.
 * This component is kept for backward compatibility and wraps MainLayout.
 * 
 * Migration:
 * - Replace AppsPageLayout with MainLayout
 * - Pass search as topbarLeftSlot prop
 * - Pass any buttons/actions as topbarRightSlot prop
 */
export function AppsPageLayout({ children, logo, searchPlaceholder, onSearch, searchValue }) {
  // Create search slot for backward compatibility
  const searchSlot = onSearch ? (
    <TopBarSearch
      placeholder={searchPlaceholder || 'Search'}
      value={searchValue || ''}
      onChange={onSearch}
    />
  ) : null;

  return (
    <MainLayout logo={logo} topbarLeftSlot={searchSlot}>
      {children}
    </MainLayout>
  );
}

AppsPageLayout.propTypes = {
  children: PropTypes.node,
  logo: PropTypes.node,
  searchPlaceholder: PropTypes.string,
  onSearch: PropTypes.func,
  searchValue: PropTypes.string,
};

AppsPageLayout.defaultProps = {
  searchPlaceholder: 'Search',
  searchValue: '',
};
