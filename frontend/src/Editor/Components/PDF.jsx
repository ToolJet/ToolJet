import React, { useState, useCallback, useRef, useEffect } from 'react';
// eslint-disable-next-line import/no-unresolved
import { Document, Page } from 'react-pdf/dist/esm/entry.webpack';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css'; // Required to fix duplicate text appearing at the bottom from the previous page
import { debounce } from 'lodash';
import PasswordResponses from 'react-pdf/dist/cjs/PasswordResponses';
require('pdfjs-dist/build/pdf.worker.entry.js');
// The above line is required to fix the issue of pdf becoming black when resizing

export const PDF = React.memo(({ styles, properties, width, height, componentName, dataCy }) => {
  const { visibility, boxShadow } = styles;
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
        const password = prompt('Enter the password to open this PDF file.');
        callbackProxy(password);
        break;
      }
      case PasswordResponses.INCORRECT_PASSWORD: {
        const password = prompt('Invalid password. Please try again.');
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
          <p style={{ marginBottom: '6px' }}>Password prompt closed</p>
          <button
            class="pdf-retry-button"
            data-cy="draggable-widget-button3"
            type="default"
            onClick={() => setIsPasswordPromptClosed(false)}
          >
            <div>
              <div>
                <span>
                  <p class="tj-text-sm">Retry</p>
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
      <div className="d-flex position-relative h-100 flex-column" style={{ margin: '0 auto', overflow: 'hidden' }}>
        <div
          className="scrollable h-100 col position-relative"
          id="pdf-wrapper"
          ref={documentRef}
          onScroll={handleScroll}
        >
          {url === '' ? 'No PDF file specified' : renderPDF()}
        </div>
        {!error && !pageLoading && (showDownloadOption || pageControls) && (
          <div
            className={`d-flex ${
              pageControls ? 'justify-content-between' : 'justify-content-end'
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
                    aria-label="Previous page"
                    style={{ backgroundColor: 'var(--cc-surface1-surface)' }}
                  >
                    ‹
                  </button>
                  <span>
                    {pageNumber} of {numPages}
                  </span>
                  <button
                    disabled={pageNumber >= numPages}
                    onClick={() => updatePage(1)}
                    type="button"
                    aria-label="Next page"
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
                  alt="download logo"
                  style={downloadIconImgStyle}
                  className="mx-1"
                />
                <span className="mx-1" style={{ color: 'var(--cc-primary-text)' }}>
                  Download PDF
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
