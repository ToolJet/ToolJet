import React from 'react';
import { Tabs, TabsList, TabsTrigger } from './Tabs';
import SolidIcon from '@/_ui/Icon/SolidIcons';

const TabsComponent = (props) => {
  return (
    <Tabs defaultValue={props.defaultValue} className="w-[400px]" onValueChange={(value) => console.log(value)}>
      <TabsList>
        <TabsTrigger value="acc">
          <SolidIcon name={props.leadingIcon} className="tw-h-[18px] tw-w-[18px]" />
        </TabsTrigger>
        <TabsTrigger value="password">
          <SolidIcon name={props.leadingIcon} className="tw-h-[18px] tw-w-[18px]" />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default TabsComponent;
