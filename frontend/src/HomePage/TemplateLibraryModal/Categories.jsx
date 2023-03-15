import React from 'react';
import { ListGroup } from 'react-bootstrap';
import FolderList from '../../_ui/FolderList/FolderList';

const categoryTitles = {
  all: 'All categories',
  sales: 'Sales',
  'product-management': 'Product management',
  operations: 'Operations',
  'data-and-analytics': 'Data and Analytics',
};

export default function Categories(props) {
  const { categories, selectedCategory, selectCategory } = props;
  console.log('check', selectedCategory);
  return (
    <div className="mt-2 template-categories">
      {/* {categories.map((category) => (
        <ListGroup.Item
          action
          active={category.id === selectedCategory.id}
          key={category.id}
          onClick={() => selectCategory(category)}
          className="d-flex justify-content-between align-items-start"
        >
          <span>{categoryTitles[category.id]}</span>
          <span>{category.count}</span>
        </ListGroup.Item>
      ))} */}
      {categories.map((category) => (
        <FolderList
          selectedItem={category.id === selectedCategory.id}
          onClick={() => selectCategory(category)}
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
