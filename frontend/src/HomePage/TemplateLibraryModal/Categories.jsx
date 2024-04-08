import React from 'react';
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
