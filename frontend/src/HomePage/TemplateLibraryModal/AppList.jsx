import React, { useState } from 'react';
import { ListGroup } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import FolderList from '@/_ui/FolderList/FolderList';

export default function AppList(props) {
  const { apps, selectedApp, selectApp } = props;
  const [searchText, searchFor] = useState('');
  const filteredApps = apps.filter((app) => app.name.toLowerCase().includes(searchText.toLowerCase()));

  return (
    <div className="template-list">
      <div className="mt-2">
        <SearchBoxContainer onChange={searchFor} queryString={searchText} />
      </div>
      <ListGroup className="mt-2 template-app-list">
        {filteredApps.length === 0 ? (
          <ListGroup.Item variant="light" className="no-results-item">
            No results
          </ListGroup.Item>
        ) : (
          <div></div>
        )}
        {filteredApps.map((app) => (
          <FolderList key={app.id} action selectedItem={app.id === selectedApp?.id} onClick={() => selectApp(app)}>
            {app.name}
          </FolderList>
        ))}
      </ListGroup>
    </div>
  );
}

const SearchBoxContainer = ({ onChange, queryString }) => {
  const [searchText, setSearchText] = React.useState(queryString ?? '');
  const { t } = useTranslation();

  const handleChange = (e) => {
    setSearchText(e.target.value);
    onChange(e.target.value);
  };

  const clearSearch = () => {
    setSearchText('');
    onChange('');
  };

  React.useEffect(() => {
    if (queryString === null) {
      setSearchText('');
    }
  }, [queryString]);

  React.useEffect(() => {
    if (searchText) {
      document.querySelector('.template-search-box .input-icon .form-control:not(:first-child)').style.paddingLeft =
        '0.5rem';
    }

    return () => {
      if (document.querySelector('.template-search-box .input-icon .form-control:not(:first-child)')) {
        document.querySelector('.template-search-box .input-icon .form-control:not(:first-child)').style.paddingLeft =
          '2.5rem';
      }
    };
  }, [searchText]);

  return (
    <div className="template-search-box">
      <div style={{ height: '36px' }} className="input-icon d-flex">
        {searchText.length === 0 && (
          <span className="search-icon mt-2 mx-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <circle cx="10" cy="10" r="7" />
              <line x1="21" y1="21" x2="15" y2="15" />
            </svg>
          </span>
        )}
        {searchText.length > 0 && (
          <span className="clear-icon mt-2" onClick={clearSearch}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="icon icon-tabler icon-tabler-circle-x"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
              <circle cx="12" cy="12" r="9"></circle>
              <path d="M10 10l4 4m0 -4l-4 4"></path>
            </svg>
          </span>
        )}
        <input
          type="text"
          value={searchText}
          onChange={handleChange}
          className="form-control"
          placeholder={t('globals.search', 'Search')}
        />
      </div>
    </div>
  );
};
