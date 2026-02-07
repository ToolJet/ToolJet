import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css'; // Required to fix duplicate text appearing at the bottom from the previous page
import { debounce } from 'lodash';
import { useTranslation } from 'react-i18next';
// Constants for password prompt reasons (react-pdf v10 / pdfjs v4)
const PasswordResponses = {
  NEED_PASSWORD: 1,
  INCORRECT_PASSWORD: 2,
};
// PDF.js v5 worker setup for react-pdf v10: provide a URL string to the worker bundle
// Using new URL keeps this portable across bundlers (Webpack 5, Vite, etc.)
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

const PDF = React.memo(({ styles, properties, width, height, componentName, dataCy }) => {
  const { t } = useTranslation();
  const { visibility, boxShadow, borderColor, borderRadius } = styles;
  const { url, scale, pageControls, showDownloadOption } = properties;
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(null);
  const pageRef = useRef([]);
  const documentRef = useRef(null);
  const hasScrollRef = useRef(false);
  const [error, setError] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [hasButtonClicked, setButtonClick] = useState(false);
  const [isPasswordPromptClosed, setIsPasswordPromptClosed] = useState(false);

  const onDocumentLoadSuccess = async (document) => {
    const { numPages: nextNumPages } = document;
    setNumPages(nextNumPages);
    setPageNumber(1);
    setError(false);
    setPageLoading(false);
  };

  const onDocumentLoadError = () => {
    setError(true);
  };

  useEffect(() => {
    setPageLoading(true);
  }, [url]);

  const options = {
    root: document.querySelector('#pdf-wrapper'),
    rootMargin: '0px',
    threshold: 0.7,
  };

  const trackIntersection = (entries) => {
    let isCaptured = false;
    entries.forEach((entry) => {
      if (entry.isIntersecting && !isCaptured && hasScrollRef.current) {
        isCaptured = true;
        const currentPage = parseInt(entry.target.getAttribute('data-page-number'));
        if (pageNumber !== currentPage) setPageNumber(currentPage);
      }
    });
  };

  useEffect(() => {
    if (numPages === 0 || numPages === null) return;
    const observer = new IntersectionObserver(trackIntersection, options);
    document.querySelectorAll('.react-pdf__Page').forEach((elem) => {
      if (elem) observer.observe(elem);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numPages, options]);

  useEffect(() => {
    setIsPasswordPromptClosed(false);
  }, [url]);

  const updatePage = useCallback(
    (offset) => {
      const { offsetTop } = pageRef.current[pageNumber + offset - 1];
      documentRef.current.scrollTop = offsetTop;
      setButtonClick(true);
      setPageNumber((prevPageNumber) => (prevPageNumber || 1) + offset);
    },
    [pageNumber]
  );

  // styles for download icon
  const downloadIconOuterWrapperStyles = {
    backgroundColor: 'var(--cc-surface1-surface)',
    borderRadius: '4px',
    height: '36px',
    padding: '0.5rem',
    cursor: 'pointer',
  };
  const downloadIconImgStyle = {
    width: '15px',
    height: '15px',
  };

  function onPassword(callback, reason) {
    function callbackProxy(password) {
      setIsPasswordPromptClosed(false);
      if (password === null) {
        setIsPasswordPromptClosed(true);
        return;
      }

      callback(password);
    }

    switch (reason) {
      case PasswordResponses.NEED_PASSWORD: {
        const password = prompt(t('widget.PDF.enterPassword', 'Enter the password to open this PDF file.'));
        callbackProxy(password);
        break;
      }
      case PasswordResponses.INCORRECT_PASSWORD: {
        const password = prompt(t('widget.PDF.invalidPassword', 'Invalid password. Please try again.'));
        callbackProxy(password);
        break;
      }
      default:
    }
  }

  const renderPDF = () => {
    if (isPasswordPromptClosed)
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <p style={{ marginBottom: '6px' }}>
            {t('widget.PDF.passwordPromptClosed', 'Password prompt closed')}
          </p>
          <button
            class="pdf-retry-button"
            data-cy="draggable-widget-button3"
            type="default"
            onClick={() => setIsPasswordPromptClosed(false)}
          >
            <div>
              <div>
                <span>
                  <p class="tj-text-sm">{t('globals.retry', 'Retry')}</p>
                </span>
              </div>
            </div>
          </button>
        </div>
      );
    return (
      <Document
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        onPassword={onPassword}
        className="pdf-document"
      >
        {Array.from(new Array(numPages), (el, index) => (
          <Page
            pageNumber={index + 1}
            width={scale ? width - 12 : undefined}
            height={scale ? undefined : height}
            key={`page_${index + 1}`}
            inputRef={(el) => (pageRef.current[index] = el)}
          />
        ))}
      </Document>
    );
  };
  async function downloadFile(url, pdfName) {
    const pdf = await fetch(url);
    const pdfBlog = await pdf.blob();
    const pdfURL = URL.createObjectURL(pdfBlog);
    const anchor = document.createElement('a');
    anchor.href = pdfURL;
    anchor.download = pdfName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(pdfURL);
  }

  const handleScroll = () => {
    if (hasButtonClicked) return setButtonClick(false);
    if (!hasScrollRef.current) hasScrollRef.current = true;
    debounce(() => {
      if (hasScrollRef.current) hasScrollRef.current = false;
    }, 150);
  };

  return (
    <div style={{ display: visibility ? 'flex' : 'none', width: width - 3, height, boxShadow }} data-cy={dataCy}>
      <div
        className="d-flex position-relative h-100 flex-column"
        style={{
          margin: '0 auto',
          overflow: 'hidden',
          borderRadius: `${borderRadius}px`,
          border: `1px solid ${borderColor}`,
        }}
      >
        <div
          className="scrollable h-100 col position-relative"
          id="pdf-wrapper"
          ref={documentRef}
          onScroll={handleScroll}
        >
          {url === '' ? t('widget.PDF.noFile', 'No PDF file specified') : renderPDF()}
        </div>
        {!error && !pageLoading && (showDownloadOption || pageControls) && (
          <div
            className={`d-flex ${pageControls ? 'justify-content-between' : 'justify-content-end'
              } py-3 px-3 align-items-baseline border-top border-light`}
            style={{ backgroundColor: 'var(--cc-surface1-surface)', color: 'var(--cc-primary-text)' }}
          >
            {pageControls && (
              <>
                <div className="pdf-page-controls">
                  <button
                    disabled={pageNumber <= 1}
                    onClick={() => updatePage(-1)}
                    type="button"
                    aria-label={t('widget.PDF.previousPage', 'Previous page')}
                    style={{ backgroundColor: 'var(--cc-surface1-surface)' }}
                  >
                    ‹
                  </button>
                  <span>
                    {t('widget.PDF.pageOf', '{{page}} of {{total}}', {
                      page: pageNumber,
                      total: numPages,
                    })}
                  </span>
                  <button
                    disabled={pageNumber >= numPages}
                    onClick={() => updatePage(1)}
                    type="button"
                    aria-label={t('widget.PDF.nextPage', 'Next page')}
                    style={{ backgroundColor: 'var(--cc-surface1-surface)' }}
                  >
                    ›
                  </button>
                </div>
              </>
            )}
            {showDownloadOption && (
              <div
                className="download-icon-outer-wrapper text-dark"
                style={downloadIconOuterWrapperStyles}
                onClick={() => downloadFile(url, componentName)}
              >
                <img
                  src="assets/images/icons/download.svg"
                  alt={t('widget.PDF.downloadAlt', 'Download')}
                  style={downloadIconImgStyle}
                  className="mx-1"
                />
                <span className="mx-1" style={{ color: 'var(--cc-primary-text)' }}>
                  {t('widget.PDF.download', 'Download PDF')}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default PDF;
