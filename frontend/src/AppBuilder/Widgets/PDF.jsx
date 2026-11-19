import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css'; // Required to fix duplicate text appearing at the bottom from the previous page
import { debounce } from 'lodash';
// Constants for password prompt reasons (react-pdf v10 / pdfjs v4)
const PasswordResponses = {
  NEED_PASSWORD: 1,
  INCORRECT_PASSWORD: 2,
};
// PDF.js v5 worker setup for react-pdf v10: provide a URL string to the worker bundle
// Using new URL keeps this portable across bundlers (Webpack 5, Vite, etc.)
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

const PDF = React.memo(({ styles, properties, width, height, componentName, dataCy }) => {
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

  // pdfjs getUrlProp runs `new URL(url, window.location)` and THROWS synchronously
  // out of react-pdf's un-guarded loadDocument effect on a string it cannot parse
  // ("https:" mid-typing kills the widget subtree). Mirror its check before
  // mounting <Document> and fall back to the load-error message instead.
  const isLoadableUrl = useMemo(() => {
    if (typeof url !== 'string' || url === '') return false;
    try {
      new URL(url, window.location.href);
      return true;
    } catch {
      return false;
    }
  }, [url]);

  // Tracks how many pixels of each page are visible inside THIS instance's
  // wrapper; the most-visible page wins the "N of M" counter. A ratio ladder
  // (not a single 0.7 threshold) keeps updates flowing even when a page is
  // taller than the viewport and can never reach 70% visibility.
  const visiblePageHeightsRef = useRef(new Map());

  useEffect(() => {
    if (!numPages || !documentRef.current) return undefined;
    const wrapper = documentRef.current;
    const visibleHeights = visiblePageHeightsRef.current;
    visibleHeights.clear();

    const observer = new IntersectionObserver(
      (entries) => {
        if (!hasScrollRef.current) return;
        entries.forEach((entry) => {
          const page = parseInt(entry.target.getAttribute('data-page-number'), 10);
          if (Number.isNaN(page)) return;
          visibleHeights.set(page, entry.isIntersecting ? entry.intersectionRect.height : 0);
        });
        let bestPage = null;
        let bestHeight = 0;
        visibleHeights.forEach((visibleHeight, page) => {
          if (visibleHeight <= 0) return;
          if (visibleHeight > bestHeight || (visibleHeight === bestHeight && page < bestPage)) {
            bestPage = page;
            bestHeight = visibleHeight;
          }
        });
        if (bestPage !== null) setPageNumber((prev) => (prev === bestPage ? prev : bestPage));
      },
      // Rooted at THIS instance's wrapper — never a document-wide #pdf-wrapper
      // lookup, which resolves to the FIRST PDF on the page and lets one
      // widget's scrolling drive another widget's counter.
      { root: wrapper, rootMargin: '0px', threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] }
    );
    // Observe only THIS instance's pages for the same cross-talk reason.
    wrapper.querySelectorAll('.react-pdf__Page').forEach((elem) => observer.observe(elem));
    return () => observer.disconnect();
  }, [numPages, url]);

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
    <div style={{ display: visibility ? 'flex' : 'none', width: width - 3, height }} data-cy={dataCy}>
      <div
        className="d-flex position-relative h-100 flex-column"
        style={{
          margin: '0 auto',
          overflow: 'hidden',
          borderRadius: `${borderRadius}px`,
          border: `1px solid ${borderColor}`,
          // The shadow lives on the SAME node as the radius so it follows the
          // rounded corner instead of drawing a square halo around it.
          boxShadow,
        }}
      >
        <div
          className="scrollable h-100 col position-relative"
          id="pdf-wrapper"
          ref={documentRef}
          onScroll={handleScroll}
          // .scrollable hard-codes overflow-x:hidden, which makes a fit-to-height
          // page (scale=false) wider than the widget unreachable.
          style={{ overflowX: 'auto' }}
        >
          {url === '' ? 'No PDF file specified' : !isLoadableUrl ? 'Failed to load PDF file.' : renderPDF()}
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

export default PDF;
