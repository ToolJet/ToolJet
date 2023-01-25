import React from 'react';
import { ListGroup } from 'react-bootstrap';

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
    <ListGroup className="mt-2 template-categories">
      {categories.map((category) => (
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
      ))}
    </ListGroup>
  );
}
