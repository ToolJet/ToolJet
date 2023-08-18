import React, { useState, useEffect, useRef } from 'react';
import Modal from 'react-bootstrap/Modal';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { SearchBox } from './SearchBox';
import { ListGroup } from 'react-bootstrap';
// eslint-disable-next-line import/no-unresolved
import i18n from 'i18next';
import { isEqual } from 'lodash';
import { useTranslation } from 'react-i18next';

export const LanguageSelection = ({ darkMode = false, tooltipPlacement = 'bottom' }) => {
  const [showModal, setShow] = useState(false);
  const [selectedLang, setLanguage] = useState({});
  const [filteredLang, setFilteredLang] = useState([]);
  const languageRef = useRef(null);
  const { t } = useTranslation();

  useEffect(() => {
    const lang = i18n.language || 'es';
    (async () => {
      languageRef.current = await fetch('/assets/translations/languages.json')
        .then((response) => response.json())
        .then((data) => data.languageList);
      const filteredLanguage = languageRef.current.find((ln) => ln.code === lang);
      if (filteredLanguage === undefined) {
        setLanguage(languageRef.current.find((ln) => ln.code === 'es'));
      } else {
        setLanguage(filteredLanguage);
      }
      setFilteredLang(languageRef.current);
    })();
  }, []);

  const handleClose = () => {
    setShow(false);
  };

  const handleOpen = () => {
    setShow(true);
  };

  const onLanguageSelection = (lang) => {
    setLanguage(lang);
    i18n.changeLanguage(lang.code);
    handleClose();
  };

  const searchLanguage = (searchText) => {
    const lowerCaseSearchText = searchText.toLowerCase();
    const filteredLanguages = languageRef.current.filter(
      (ln) =>
        ln.lang.toLowerCase().startsWith(lowerCaseSearchText) ||
        ln.nativeLang.toLowerCase().startsWith(lowerCaseSearchText) ||
        ln.code.toLowerCase().startsWith(lowerCaseSearchText)
    );
    if (!isEqual(filteredLanguages, filteredLang)) {
      setFilteredLang(filteredLanguages);
    }
  };

  const renderLanguageList = () => {
    return (
      <>
        {filteredLang.length === 0 ? (
          <ListGroup.Item
            variant="light"
            className="no-results-item"
          >
            No results
          </ListGroup.Item>
        ) : (
          <>
            <ListGroup.Item
              key={selectedLang.code}
              action
              active
              onClick={() => onLanguageSelection(selectedLang)}
            >
              <div className="row align-items-center">
                <div className="col-auto">
                  {selectedLang.lang}
                  <p>{selectedLang.nativeLang}</p>
                </div>
                <div className="col-auto ms-auto">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="icon icon-tabler icon-tabler-check"
                    width="44"
                    height="44"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="#4d72fa"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path
                      stroke="none"
                      d="M0 0h24v24H0z"
                      fill="none"
                    />{' '}
                    <path d="M5 12l5 5l10 -10" />
                  </svg>
                </div>
              </div>
            </ListGroup.Item>
            {filteredLang.map((ln) => {
              if (ln.code === selectedLang.code) return;
              return (
                <ListGroup.Item
                  key={ln.code}
                  action
                  onClick={() => onLanguageSelection(ln)}
                >
                  <div className="row align-items-center">
                    <div className="col-auto">
                      {ln.lang}
                      <p>{ln.nativeLang}</p>
                    </div>
                  </div>
                </ListGroup.Item>
              );
            })}
          </>
        )}
      </>
    );
  };

  const renderModal = () => {
    return (
      <Modal
        show={showModal}
        onHide={handleClose}
        size="sm"
        centered={true}
        contentClassName={`lang-selection-modal ${darkMode && 'dark'}`}
      >
        <Modal.Header>
          <Modal.Title>{t('header.languageSelection.changeLanguage', 'Change language')}</Modal.Title>
          <span
            className={`close-btn mx-4 mt-3 ${darkMode ? 'dark' : ''}`}
            onClick={handleClose}
          >
            <img
              src="assets/images/icons/close.svg"
              width="12"
              height="12"
            />
          </span>
        </Modal.Header>
        <Modal.Body>
          <div className="lang-list">
            <div className="search-box">
              <SearchBox
                onSubmit={searchLanguage}
                width="100%"
                placeholder={t('header.languageSelection.searchLanguage', 'Search language')}
              />
            </div>
            <ListGroup>{renderLanguageList()}</ListGroup>
          </div>
        </Modal.Body>
      </Modal>
    );
  };

  return (
    <>
      <OverlayTrigger
        placement={tooltipPlacement}
        delay={{ show: 250, hide: 400 }}
        overlay={
          <Tooltip id="button-tooltip">{t('header.languageSelection.changeLanguage', 'Change language')}</Tooltip>
        }
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="icon icon-tabler icon-tabler-world"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke={darkMode ? '#fff' : '#808080'}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          onClick={handleOpen}
          style={{ cursor: 'pointer' }}
        >
          <path
            stroke="none"
            d="M0 0h24v24H0z"
            fill="none"
          />
          <circle
            cx="12"
            cy="12"
            r="9"
          />
          <line
            x1="3.6"
            y1="9"
            x2="20.4"
            y2="9"
          />
          <line
            x1="3.6"
            y1="15"
            x2="20.4"
            y2="15"
          />
          <path d="M11.5 3a17 17 0 0 0 0 18" />
          <path d="M12.5 3a17 17 0 0 1 0 18" />
        </svg>
      </OverlayTrigger>
      {showModal && renderModal()}
    </>
  );
};
