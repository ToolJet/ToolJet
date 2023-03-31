import React from 'react';
import { ListGroup } from 'react-bootstrap';
import posthog from 'posthog-js';
import { authenticationService } from '@/_services';

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
          onClick={() => {
            posthog.capture('click_template_category', {
              user_id:
                authenticationService?.currentUserValue?.id ||
                authenticationService?.currentSessionValue?.current_user?.id,
              workspace_id:
                authenticationService?.currentUserValue?.organization_id ||
                authenticationService?.currentSessionValue?.current_organization_id,
              template_category_id: category.id,
            });
            selectCategory(category);
          }}
          className="d-flex justify-content-between align-items-start"
        >
          <span>{categoryTitles[category.id]}</span>
          <span>{category.count}</span>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
}
