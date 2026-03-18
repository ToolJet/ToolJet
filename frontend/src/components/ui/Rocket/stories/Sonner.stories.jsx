import React from 'react';
import { Toaster } from '../sonner';
import { toast } from 'sonner';

export default {
  title: 'UI/Rocket/Sonner',
  component: Toaster,
  tags: ['autodocs'],
};

export const Default = () => {
  React.useEffect(() => {
    toast('Hello from Sonner!');
  }, []);
  
  return <Toaster />;
};







