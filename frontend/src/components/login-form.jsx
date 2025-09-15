import * as React from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Logo from '@/modules/common/resources/images/Logo';

export function LoginForm({ className, ...props }) {
  return (
    <form className={cn('tw-flex tw-flex-col tw-gap-6', className)} {...props}>
      <div className="tw-flex tw-flex-col tw-items-center tw-gap-2 tw-text-center">
        <h1 className="tw-text-2xl tw-font-bold">Login to your account</h1>
        <p className="tw-text-balance tw-text-sm tw-text-muted-foreground">
          Enter your email below to login to your account
        </p>
      </div>
      <div className="tw-grid tw-gap-6">
        <div className="tw-grid tw-gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="m@example.com" required />
        </div>
        <div className="tw-grid tw-gap-2">
          <div className="tw-flex tw-items-center">
            <Label htmlFor="password">Password</Label>
            <a href="#" className="tw-ml-auto tw-text-sm tw-underline-offset-4 hover:tw-underline">
              Forgot your password?
            </a>
          </div>
          <Input id="password" type="password" required />
        </div>
        <Button type="submit" className="tw-w-full">
          Login
        </Button>
        <div className="tw-relative tw-text-center tw-text-sm after:tw-absolute after:tw-inset-0 after:tw-top-1/2 after:tw-z-0 after:tw-flex after:tw-items-center after:tw-border-t after:tw-border-border">
          <span className="tw-relative tw-z-10 tw-bg-background tw-px-2 tw-text-muted-foreground">
            Or continue with
          </span>
        </div>
        <Button variant="outline" className="tw-w-full">
          
          Login with GitHub
        </Button>
      </div>
      <div className="tw-text-center tw-text-sm">
        Don&apos;t have an account?{' '}
        <a href="#" className="tw-underline tw-underline-offset-4">
          Sign up
        </a>
      </div>
    </form>
  );
}
