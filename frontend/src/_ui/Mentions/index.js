import React from 'react';
import { MentionsInput, Mention } from 'react-mentions';
import { uniqBy, debounce } from 'lodash';

const Mentions = ({ searchUser, value = '', setValue, setMentionedUsers, placeholder, darkMode }) => {
  const [mentionsInputValue, setMentionsInputValue] = React.useState(value);

  React.useEffect(() => {
    setMentionsInputValue(value);
  }, [value]);

  const debouncedResults = React.useMemo(() => {
    return debounce(searchUser, 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    return () => {
      debouncedResults.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      value={mentionsInputValue}
      onChange={(e, newValue, newPlainTextValue, mentions) => {
        const unique = uniqBy(mentions, 'id');
        setMentionedUsers(unique.map((item) => item.id));
        setMentionsInputValue(newValue);
        setValue(newPlainTextValue);
      }}
      placeholder={placeholder}
    >
      <Mention
        trigger="@"
        displayTransform={(_, display) => `(@${display})`}
        markup="(@__display__){__id__}"
        data={debouncedResults}
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
              {suggestion?.first_name?.slice(0, 1) ?? '' + suggestion?.last_name?.slice(0, 1) ?? ''}
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
