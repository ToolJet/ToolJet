import * as React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/Rocket/sheet';

export function CommonDatasourceSheet({ open, onOpenChange, title, children }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="tw-w-full sm:tw-max-w-2xl tw-overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="tw-mt-6">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
