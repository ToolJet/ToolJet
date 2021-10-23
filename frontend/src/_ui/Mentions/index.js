import React from 'react';
import { capitalize } from 'lodash';
import { organizationService } from '@/_services';

import { MentionsInput, Mention } from 'react-mentions';

// const { emojis } = require('./emojis.json');

const Mentions = ({ value, setValue, placeholder }) => {
  const [users, setUsers] = React.useState([]);

  // TODO: move this to context etc, this loads the users x number to imports
  React.useEffect(() => {
    organizationService.getUsers(null).then((data) => {
      const _users = data.users.map((u) => ({
        id: u.id,
        display: `${capitalize(u.first_name)} ${capitalize(u.last_name)}`,
      }));
      setUsers(_users);
    });
  }, []);

  const queryEmojis = (query) => {
    if (query.length === 0) return;

    return;
    // const matches = emojis
    //   .filter((emoji) => {
    //     return emoji.name.indexOf(query.toLowerCase()) > -1;
    //   })
    //   .slice(0, 10);
    // return matches.map(({ emoji }) => ({ id: emoji }));
  };
  return (
    <MentionsInput
      style={{
        control: {
          fontSize: 16,
          lineHeight: 1.2,
          minHeight: 40,
        },
        highlighter: {
          padding: 9,
          border: '1px solid transparent',
        },
        input: {
          fontSize: 12,
          lineHeight: 1.5,
          padding: 9,
          paddingLeft: 0,
          border: 0,
          outline: 0,
        },
        suggestions: {
          list: {
            backgroundColor: 'white',
            boxShadow: '0px 2px 12px rgba(41, 45, 55, 0.156863)',
            borderRadius: '4',
          },
          item: {
            padding: '10px 16px',

            '&focused': {
              background: '#EEF3F9',
            },
          },
        },
      }}
      value={value}
      onChange={(e, newValue) => setValue(newValue)}
      placeholder={placeholder}
    >
      <Mention
        trigger="@"
        regex={/@(\S+)/}
        displayTransform={(display) => `@${display}`}
        markup="(@__display__)"
        data={users}
        // style={{
        //   backgroundColor: '#218DE3',
        // }}
        appendSpaceOnAdd
      />
      <Mention trigger=":" markup="__id__" regex={/($a)/} data={queryEmojis} appendSpaceOnAdd />
    </MentionsInput>
  );
};

// const Mentions = ({ value, setValue, placeholder }) => {
//   const [open, trigger, content, setOpen] = usePopover(false);
//   const handleChange = (e) => {
//     e.stopPropagation();
//     if (e.target.value.includes('@')) {
//       setOpen(true);
//     }
//     setValue(e.target.value);
//   };

//   let conditionalProps = {};

//   if (open) {
//     conditionalProps = { ...trigger };
//   }
//   return (
//     <>
//       <Textarea
//         {...conditionalProps}
//         value={value}
//         onChange={handleChange}
//         rows="1"
//         className="w-full form-control"
//         placeholder={placeholder}
//       />
//       <div
//         {...content}
//         className={cx('card popover mentions-popover', {
//           show: open,
//           hide: !open,
//         })}
//       >
//         <div className="list-group list-group-flush list-group-hoverable">
//           <div className="list-group-item">
//             <div className="row align-items-center">
//               <div className="col-auto">
//                 <a href="#">
//                   <span className="avatar">JL</span>
//                 </a>
//               </div>
//               <div className="col text-truncate">
//                 <a href="#" className="text-body d-block">
//                   Jeffie Lewzey
//                 </a>
//                 <small className="d-block text-muted text-truncate mt-n1">
//                   justify-content:between ⇒ justify-content:space-between (#29734)
//                 </small>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

export default Mentions;
