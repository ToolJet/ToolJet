import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  closeSearchPanel,
  SearchQuery,
  setSearchQuery,
  findNext,
  findPrevious,
  replaceNext,
  replaceAll,
  openSearchPanel,
  // eslint-disable-next-line import/no-unresolved
} from '@codemirror/search';
import './SearchBox.scss';
import InputComponent from '@/components/ui/Input/Index.jsx';
import { Button as ButtonComponent } from '@/components/ui/Button/Button.jsx';
import { ToolTip } from '@/_components/ToolTip';

export const handleSearchPanel = (view) => {
  const dom = document.createElement('div');
  createRoot(dom).render(<SearchPanel view={view} />);
  return { dom, top: true };
};

function SearchPanel({ view }) {
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  const handleSearch = (replaceTerm) => {
    const query = new SearchQuery({
      search: searchText,
      caseSensitive: false,
      literal: true,
      regexp: false,
      replace: replaceTerm,
    });
    view.dispatch({ effects: setSearchQuery.of(query) });
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      handleSearch(replaceText);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchText, replaceText]);

  const displaySearchField = () => (
    <div className="search-replace-inputs">
      <InputComponent
        leadingIcon="search01"
        onChange={(e) => setSearchText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && findNext(view)}
        placeholder="Find"
        size="small"
        value={searchText}
        aria-label="Find text"
      />
      <InputComponent
        leadingIcon="arrowreturn01"
        onChange={(e) => setReplaceText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && replaceNext(view)}
        placeholder="Replace"
        size="small"
        value={replaceText}
        aria-label="Replace text"
      />
    </div>
  );

  const displaySearchButtons = () => (
    <div className="search-buttons">
      <ToolTip message={'Previous'}>
        <ButtonComponent
          iconOnly
          leadingIcon="arrowup01"
          onClick={() => findPrevious(view)}
          size="medium"
          variant="ghost"
          aria-label="Previous match"
        />
      </ToolTip>
      <div className="navbar-seperator"></div>
      <ToolTip message={'Next'}>
        <ButtonComponent
          iconOnly
          leadingIcon="arrowdown01"
          onClick={() => findNext(view)}
          size="medium"
          variant="ghost"
          aria-label="Next match"
        />
      </ToolTip>
    </div>
  );

  const displayReplaceButtons = () => (
    <div className="replace-buttons">
      <ToolTip message={'Replace'}>
        <ButtonComponent
          iconOnly
          leadingIcon="replace"
          onClick={() => replaceNext(view)}
          size="medium"
          variant="ghost"
          aria-label="Replace"
        />
      </ToolTip>
      <div className="navbar-seperator"></div>
      <ToolTip message={'Replace all'}>
        <ButtonComponent
          iconOnly
          leadingIcon="replaceall"
          onClick={() => replaceAll(view)}
          size="medium"
          variant="ghost"
          aria-label="Replace all"
        />
      </ToolTip>
      <div className="navbar-seperator"></div>
      <ButtonComponent
        iconOnly
        leadingIcon="remove02"
        onClick={() => closeSearchPanel(view)}
        size="medium"
        variant="ghost"
        aria-label="Close search panel"
        className="!tw-w-[28px]"
      />
    </div>
  );

  return (
    <div className="search-panel-wrapper">
      <div className="search-panel">
        {displaySearchField()}
        {displaySearchButtons()}
      </div>
      {displayReplaceButtons()}
    </div>
  );
}

export const SearchBtn = ({ view }) => {
  return (
    <div
      className="d-flex justify-content-end w-100 position-absolute tw-pt-[3px] tw-pr-[4px] codehinter-search-btn-wrapper"
      style={{ top: 0 }}
    >
      <ButtonComponent
        iconOnly
        trailingIcon="search01"
        size="small"
        variant="outline"
        ariaLabel="Open search panel"
        className="codehinter-search-btn"
        onClick={() => openSearchPanel(view)}
      />
    </div>
  );
};
