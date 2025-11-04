import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../tabs';

export default {
  title: 'UI/Rocket/Tabs',
  component: Tabs,
  tags: ['autodocs'],
};

export const Default = () => (
  <Tabs defaultValue="tab1" className="tw-w-[400px]">
    <TabsList>
      <TabsTrigger value="tab1">Tab 1</TabsTrigger>
      <TabsTrigger value="tab2">Tab 2</TabsTrigger>
      <TabsTrigger value="tab3">Tab 3</TabsTrigger>
    </TabsList>
    <TabsContent value="tab1">Content for Tab 1</TabsContent>
    <TabsContent value="tab2">Content for Tab 2</TabsContent>
    <TabsContent value="tab3">Content for Tab 3</TabsContent>
  </Tabs>
);





