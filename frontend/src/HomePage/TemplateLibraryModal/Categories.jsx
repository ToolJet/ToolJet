import React from 'react';
import FolderList from '@/_ui/FolderList/FolderList';
import posthogHelper from '@/modules/common/helpers/posthogHelper';
import { authenticationService } from '@/_services';
export const categoryTitles = {
  all: 'All categories',
  'it-operations': 'IT operations',
  'it-assets-and-access': 'IT assets & access',
  'status-pages': 'Status pages',
  'risk-and-compliance': 'Risk & compliance',
  contracts: 'Contracts',
  'finance-and-accounting': 'Finance & accounting',
  'procurement-and-suppliers': 'Procurement & suppliers',
  'people-and-hr': 'People & HR',
  'projects-and-resourcing': 'Projects & resourcing',
  'customer-service': 'Customer service',
  'sales-and-bids': 'Sales & bids',
  'field-services': 'Field services',
  'property-and-facilities': 'Property & facilities',
  'construction-and-installation': 'Construction & installation',
  'manufacturing-and-production': 'Manufacturing & production',
  'inventory-orders-and-fleet': 'Inventory, orders & fleet',
  rentals: 'Rentals',
  'local-services': 'Local services',
  'education-and-training': 'Education & training',
  'hospitality-and-events': 'Hospitality & events',
  'productivity-and-community': 'Productivity & community',
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
