import React from 'react';
import FolderList from '@/_ui/FolderList/FolderList';
import posthogHelper from '@/modules/common/helpers/posthogHelper';
import { authenticationService } from '@/_services';
const categoryTitles = {
  all: 'All categories',
  'customer-support': 'Customer support',
  'data-and-analytics': 'Data and analytics',
  'developer-utilities': 'Developer utilities',
  'educational-technology': 'Educational technology',
  'financial-services': 'Financial services',
  'human-resources': 'Human resources',
  operations: 'Operations',
  'product-management': 'Product management',
  'sales-and-marketing': 'Sales and marketing',
};

export default function Categories(props) {
  const { categories, selectedCategory, selectCategory } = props;
  return (
    <div className="mt-2 template-categories">
      {categories.map((category) => (
        <FolderList
          selectedItem={category.id === selectedCategory.id}
          onClick={() => {
            posthogHelper.captureEvent('click_template_category', {
              workspace_id:
                authenticationService?.currentUserValue?.organization_id ||
                authenticationService?.currentSessionValue?.current_organization_id,
              template_category_id: category.id,
            });
            selectCategory(category);
          }}
          key={category.id}
          dataCy={`${String(categoryTitles[category.id]).toLowerCase().replace(/\s+/g, '-')}`}
        >
          <div className="d-flex template-list-items-wrap">
            <p
              className="tj-text tj-text-sm"
              data-cy={`${String(categoryTitles[category.id]).toLowerCase().replace(/\s+/g, '-')}-category-title`}
            >
              {categoryTitles[category.id]}
            </p>
          </div>
          <p
            className="tj-text tj-text-sm"
            data-cy={`${String(categoryTitles[category.id]).toLowerCase().replace(/\s+/g, '-')}-category-count`}
          >
            {category.count}
          </p>
        </FolderList>
      ))}
    </div>
  );
}
