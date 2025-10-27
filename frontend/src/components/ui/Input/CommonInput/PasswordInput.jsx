import React, { useState, useEffect } from 'react';
import { Input } from '../Input';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { inputPositionVariants, inputIconSizeVariants } from '../InputUtils/Variants';
import { getButtonSizeForInput } from '../InputUtils/InputUtils';

const PasswordInput = ({ size, disabled, response, isWorkspaceConstant, ...restProps }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  useEffect(() => {
    if (isWorkspaceConstant) {
      setIsPasswordVisible(true);
    }
  }, [isWorkspaceConstant]);

  const togglePasswordVisibility = () => {
    if (!disabled) {
      setIsPasswordVisible((prev) => !prev);
    }
  };

  return (
    <div className="tw-relative">
      <Input
        type={isPasswordVisible ? 'text' : 'password'}
        size={size}
        disabled={disabled}
        response={response}
        {...restProps}
      />
      <Button
        type="button"
        variant="ghost"
        size={getButtonSizeForInput(size)}
        iconOnly
        className={cn('tw-absolute tw-scale-[.85]', inputPositionVariants({ trailingIconPosition: size }))}
        onClick={togglePasswordVisibility}
        disabled={disabled}
        aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
      >
        {isPasswordVisible ? (
          <EyeOff className={inputIconSizeVariants({ iconSize: size })} />
        ) : (
          <Eye className={inputIconSizeVariants({ iconSize: size })} />
        )}
      </Button>
    </div>
  );
};

export default PasswordInput;
