import React from 'react';
import PropTypes from 'prop-types';
import { ResourceCard } from '@/components/ui/blocks/ResourceCard/ResourceCard';

/**
 * AppCard is a thin wrapper around ResourceCard that provides app-specific defaults.
 * This maintains backward compatibility while using the generic ResourceCard underneath.
 */
const AppCard = ({
  icon,
  title,
  description,
  variant = 'outline',
  className,
  app, // App-specific prop name for backward compatibility
  actions = {},
  canPlay = true,
  canEdit = true,
  canDelete,
  ...props
}) => {
  return (
    <ResourceCard
      icon={icon}
      title={title}
      description={description}
      variant={variant}
      className={className}
      item={app} // Map 'app' prop to generic 'item' prop
      actions={actions}
      canPlay={canPlay}
      canEdit={canEdit}
      canDelete={canDelete}
      {...props}
    />
  );
};

AppCard.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.string,
  description: PropTypes.string,
  variant: PropTypes.string,
  className: PropTypes.string,
  app: PropTypes.object, // App-specific prop name
  actions: PropTypes.object,
  canPlay: PropTypes.bool,
  canEdit: PropTypes.bool,
  canDelete: PropTypes.oneOfType([PropTypes.bool, PropTypes.func]),
};

export default AppCard;
