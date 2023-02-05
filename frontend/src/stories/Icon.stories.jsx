import React from 'react';
import IconEl from '../_ui/Icon/Icon';

export default {
  title: 'Components/Icon',
  component: IconEl,
  args: {},
  argTypes: {
    name: {
      control: {
        type: 'select',
        options: [
          'apps',
          'diamond',
          'database',
          'direction',
          'cheveronup',
          'cheverodown',
          'cheveronright',
          'cheveronleft',
          'layers',
        ],
      },
      classname: {
        control: { type: 'text' },
      },
    },
  },
};

const Template = (args) => <IconEl {...args} />;

// 👇 Each story then reuses that template
export const Basic = Template.bind();
Basic.args = {
  name: 'bug',
  className: '',
};
