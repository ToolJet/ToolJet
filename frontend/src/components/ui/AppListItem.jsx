import React from 'react';
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';

const AppListItem = ({ icon, title, description, actions, ...props }) => {
  return (
    <Item {...props}>
      {icon && <ItemMedia>{icon}</ItemMedia>}
      <ItemContent>
        {title && <ItemTitle>{title}</ItemTitle>}
        {description && <ItemDescription>{description}</ItemDescription>}
      </ItemContent>
      {actions && <ItemActions>{actions}</ItemActions>}
    </Item>
  );
};

export default AppListItem;
