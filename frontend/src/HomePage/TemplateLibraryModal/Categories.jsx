import React from 'react';
import { ListGroup } from 'react-bootstrap';

const categoryTitles = {
  all: 'All categories',
  sales: 'Sales',
  'product-management': 'Product management',
};

export default function Categories(props) {
  const { categories, selectedCategory, selectCategory } = props;
  return (
    <ListGroup className="mt-2 template-categories">
      {categories.map((category) => (
        <ListGroup.Item
          action
          active={category === selectedCategory}
          key={category}
          onClick={() => selectCategory(category)}
        >
          {categoryTitles[category]}
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
}
