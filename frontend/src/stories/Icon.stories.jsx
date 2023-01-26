// import { glyphs } from '../_ui/Icon/allIcons/index';
// import Icon from '../_ui/Icon/Icon';
// import React from 'react';

// export default  Single = (args) => {
//   if (!args.glyph) {
//     args = {
//       ...args,
//       glyph: 'QuestionMarkWithCircle',
//     };
//   }

//   return <Icon {...args} />;
// };

// Single.argTypes = {
//   glyph: {
//     control: 'select',
//     options: Object.keys(glyphs),
//   },
// };
// const Template = (args) => <SplitButton {...args} />;

// // 👇 Each story then reuses that template
// export const Basic = Template.bind();

// export const AllIcons = (args) => (
//   <div>
//     {Object.keys(glyphs).map((glyph) => {
//       return (
//         <div key={glyph} className={containerStyle}>
//           <Icon {...args} glyph={glyph} />
//           <div className={textStyle}>{glyph}</div>
//         </div>
//       );
//     })}
//   </div>
// );

import React from 'react';
import Icon from '../_ui/Icon/Icon';

export default {
  title: 'Components/Icon',
  component: Icon,
  args: {
    children: 'Section name',
  },
  argTypes: {
    backgroundColor: { control: 'color' },
    onClick: {
      control: 'none',
    },
    className: {
      control: 'text',
    },
    width: {
      control: 'text',
    },
    height: {
      control: 'text',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

const Template = (args) => <Icon {...args} icon={'Apps'} />;

// 👇 Each story then reuses that template
export const Basic = Template.bind();
