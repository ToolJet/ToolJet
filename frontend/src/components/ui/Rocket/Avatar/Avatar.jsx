import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import {
  Avatar as ShadcnAvatar,
  AvatarImage as ShadcnAvatarImage,
  AvatarFallback as ShadcnAvatarFallback,
} from '@/components/ui/Rocket/shadcn/avatar';

const avatarVariants = cva(
  'tw-rounded-full tw-overflow-hidden tw-shrink-0',
  {
    variants: {
      size: {
        xs: 'tw-h-5 tw-w-5',
        sm: 'tw-h-6 tw-w-6',
        default: 'tw-h-8 tw-w-8',
        md: 'tw-h-10 tw-w-10',
        lg: 'tw-h-12 tw-w-12',
        xl: 'tw-h-14 tw-w-14',
        '2xl': 'tw-h-16 tw-w-16',
      },
    },
    defaultVariants: { size: 'default' },
  }
);

const fallbackSizeClasses = {
  xs: 'tw-text-[8px]',
  sm: 'tw-text-[9px]',
  default: 'tw-text-xs',
  md: 'tw-text-sm',
  lg: 'tw-text-base',
  xl: 'tw-text-lg',
  '2xl': 'tw-text-xl',
};

const Avatar = forwardRef(function Avatar(
  { className, size = 'default', src, alt, fallback, ...props },
  ref
) {
  return (
    <ShadcnAvatar
      ref={ref}
      className={cn(avatarVariants({ size }), className)}
      {...props}
    >
      {src && (
        <ShadcnAvatarImage
          src={src}
          alt={alt}
          className="tw-object-cover"
        />
      )}
      {fallback && (
        <ShadcnAvatarFallback
          className={cn(
            'tw-bg-background-surface-layer-02 tw-text-text-medium tw-font-medium',
            fallbackSizeClasses[size]
          )}
        >
          {fallback}
        </ShadcnAvatarFallback>
      )}
    </ShadcnAvatar>
  );
});

Avatar.displayName = 'Avatar';

Avatar.propTypes = {
  size: PropTypes.oneOf(['xs', 'sm', 'default', 'md', 'lg', 'xl', '2xl']),
  src: PropTypes.string,
  alt: PropTypes.string,
  fallback: PropTypes.node,
  className: PropTypes.string,
};

export { Avatar, avatarVariants };
