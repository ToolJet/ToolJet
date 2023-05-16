import React from 'react';
import posthog from 'posthog-js';
import { authenticationService } from '@/_services';
import FolderList from '@/_ui/FolderList/FolderList';

const categoryTitles = {
  all: 'All categories',
  sales: 'Sales',
  'product-management': 'Product management',
  operations: 'Operations',
  'data-and-analytics': 'Data and Analytics',
};

export default function Categories(props) {
  const { categories, selectedCategory, selectCategory } = props;
  return (
    <div className="mt-2 template-categories">
      {categories.map((category) => (
        <FolderList
          selectedItem={category.id === selectedCategory.id}
          onClick={() => {
            posthog.capture('click_template_category', {
              workspace_id:
                authenticationService?.currentUserValue?.organization_id ||
                authenticationService?.currentSessionValue?.current_organization_id,
              template_category_id: category.id,
            });
            selectCategory(category);
          }}
          key={category.id}
        >
          <div className="d-flex template-list-items-wrap">
            <p className="tj-text tj-text-sm">{categoryTitles[category.id]}</p>
          </div>
          <p className="tj-text tj-text-sm">{category.count}</p>
        </FolderList>
      ))}
    </div>
  );
}
