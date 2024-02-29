import React from 'react';
import FolderList from '@/_ui/FolderList/FolderList';

const categoryTitles = {
  all: 'All categories',
  'human-resources': 'Human resources',
  'business-analytics': 'Business analytics',
  'customer-relationship-management': 'Customer relationship management (CRM)',
  'financial-management': 'Financial management',
  'data-management': 'Data management',
  operations: 'Operations',
  'application-development': 'Application development',
  marketing: 'Marketing',
  utilities: 'Utilities',
  'license-management': 'License management',
};

export default function Categories(props) {
  const { categories, selectedCategory, selectCategory } = props;
  return (
    <div className="mt-2 template-categories">
      {categories.map((category) => (
        <FolderList
          selectedItem={category.id === selectedCategory.id}
          onClick={() => selectCategory(category)}
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
