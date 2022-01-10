import React, { useState } from 'react';
import { ListGroup } from 'react-bootstrap';

const categoryTitles = {
  all: 'All categories',
  sales: 'Sales',
  'product-management': 'Product management',
};

export default function Categories(props) {
  const [selectedCategory, selectCategory] = useState('all');
  return (
    <ListGroup className="mt-2">
      {props.categories.map((category) => (
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
