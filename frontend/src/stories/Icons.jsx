// import { glyphs } from '../_ui/Icon/allIcons/index';
// import Icon from '../_ui/Icon/Icon';

// export const Single = (args) => {
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
