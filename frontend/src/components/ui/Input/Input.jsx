import * as React from 'react';
import { cn } from '@/lib/utils';
import { inputVariants } from './InputUtils/Variants';
import SolidIcon from '@/_ui/Icon/SolidIcons';

const Input = React.forwardRef(({ className, size, type, ...props }, ref) => {
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const isPasswordField = type === 'password';

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  return (
    <>
      <input
        type={isPasswordField && isPasswordVisible ? 'text' : type}
        className={cn(
          inputVariants({ size }),
          `tw-relative tw-peer tw-flex tw-text-[12px]/[18px] tw-w-full tw-rounded-[8px] tw-border-[1px] tw-border-solid tw-bg-background-surface-layer-01 tw-py-[7px] tw-text-text-default focus-visible:tw-ring-[1px] focus-visible:tw-ring-offset-[1px] focus-visible:tw-ring-border-accent-strong focus-visible:tw-ring-offset-border-accent-strong focus-visible:tw-border-transparent disabled:tw-cursor-not-allowed disabled:tw-border-transparent ${props.styles}`,
          className
        )}
        ref={ref}
        {...props}
      />
      {isPasswordField && (
        <div
          className="tw-absolute tw-right-3 tw-top-1/2 tw-transform -tw-translate-y-1/2 tw-cursor-pointer tw-z-50 tw-w-[25px] tw-h-full tw-flex tw-justify-center tw-items-center"
          onClick={togglePasswordVisibility}
        >
          <SolidIcon name="eye1" width="16" height="16" />
        </div>
      )}
    </>
  );
});
Input.displayName = 'Input';

export { Input };