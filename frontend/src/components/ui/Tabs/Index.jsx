import React from 'react';
import PropTypes from 'prop-types';
import { Tabs, TabsList, TabsTrigger } from './Tabs';
import SolidIcon from '@/_ui/Icon/SolidIcons';

const TabsComponent = ({ tabs = {}, onChange, ...props }) => {
  return (
    <Tabs onValueChange={onChange} {...props}>
      <TabsList className="tw-gap-[2px]">
        {props.type === 'text' &&
          Object.keys(tabs).map((key) => (
            <TabsTrigger disabled={props.disabled} key={key} value={tabs[key]}>
              {key}
            </TabsTrigger>
          ))}
        {props.type === 'icon' &&
          Object.keys(tabs).map((key) => (
            <TabsTrigger disabled={props.disabled} key={key} value={tabs[key]}>
              <SolidIcon name={key} className="tw-h-[18px] tw-w-[18px]" />
            </TabsTrigger>
          ))}
      </TabsList>
    </Tabs>
  );
};

export default TabsComponent;

TabsComponent.propTypes = {
  type: PropTypes.oneOf(['text', 'icon']),
  tabs: PropTypes.object,
  defaultValue: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

TabsComponent.defaultProps = {
  type: 'text',
  tabs: {
    option1: 'value 1',
    option2: 'value 2',
    option3: 'value 3',
  },
  defaultValue: '',
  onChange: (value) => {},
  disabled: false,
  className: '',
};
