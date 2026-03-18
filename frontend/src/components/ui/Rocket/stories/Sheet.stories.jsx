import React from 'react';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '../sheet';
import { Label } from '../label';
import { Input } from '../input';
import { Button } from '../../Button/Button';

export default {
  title: 'UI/Rocket/Sheet',
  component: Sheet,
  tags: ['autodocs'],
};

export const Default = () => (
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="outline">Open</Button>
    </SheetTrigger>
    <SheetContent>
      <SheetHeader>
        <SheetTitle>Edit profile</SheetTitle>
        <SheetDescription>Make changes to your profile here. Click save when you&apos;re done.</SheetDescription>
      </SheetHeader>
      <div className="tw-grid tw-flex-1 tw-auto-rows-min tw-gap-6 tw-px-4">
        <div className="tw-grid tw-gap-3">
          <Label htmlFor="sheet-demo-name">Name</Label>
          <Input id="sheet-demo-name" defaultValue="Pedro Duarte" />
        </div>
        <div className="tw-grid tw-gap-3">
          <Label htmlFor="sheet-demo-username">Username</Label>
          <Input id="sheet-demo-username" defaultValue="@peduarte" />
        </div>
      </div>
      <SheetFooter className="tw-mt-4">
        <Button type="submit">Save changes</Button>
        <SheetClose asChild>
          <Button variant="outline">Close</Button>
        </SheetClose>
      </SheetFooter>
    </SheetContent>
  </Sheet>
);
