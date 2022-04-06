import React from 'react';
import { MentionsInput, Mention } from 'react-mentions';

const Mentions = ({ users, value, setValue, placeholder, darkMode }) => {
  return (
    <MentionsInput
      style={{
        control: {
          fontSize: 16,
          lineHeight: 1.2,
          minHeight: 40,
          color: '#f8f8f2',
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
          color: darkMode ? 'white' : 'black',
        },
        suggestions: {
          list: {
            backgroundColor: 'white',
            boxShadow: '0px 2px 12px rgba(41, 45, 55, 0.156863)',
            borderRadius: '4',
            marginTop: '-100px',
            height: '100%',
            width: '270px',
            fontSize: '14px',
            color: '#282D37',
          },
          item: {
            padding: '10px 16px',
            height: '56px',

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
        renderSuggestion={(suggestion) => (
          <div
            style={{
              display: 'flex',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '100%',
                backgroundColor: '#4D72FA',
                display: 'flex',
                textAlign: 'center',
                justifyContent: 'center',
                marginRight: '12px',
                alignItems: 'center',
                color: 'white',
                textTransform: 'uppercase',
              }}
            >
              {suggestion.first_name.slice(0, 1) + suggestion.last_name.slice(0, 1)}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <p
                style={{
                  marginBottom: '0px',
                }}
              >
                {suggestion.display}
              </p>
              <p>{suggestion.email}</p>
            </div>
          </div>
        )}
      />
    </MentionsInput>
  );
};

export default Mentions;
