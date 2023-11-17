import React, { useState, useCallback, useRef, useEffect } from 'react';
// eslint-disable-next-line import/no-unresolved
import { Document, Page } from 'react-pdf/dist/esm/entry.webpack';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import { debounce } from 'lodash';

export const PDF = React.memo(({ styles, properties, width, height, component, dataCy }) => {
  const pdfName = component.name;
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
    backgroundColor: 'white',
    borderRadius: '4px',
    height: '36px',
    padding: '0.5rem',
    cursor: 'pointer',
  };
  const downloadIconImgStyle = {
    width: '15px',
    height: '15px',
  };
  const renderPDF = () => (
    <Document
      file={url}
      onLoadSuccess={onDocumentLoadSuccess}
      onLoadError={onDocumentLoadError}
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
            } py-3 px-3 align-items-baseline bg-white border-top border-light`}
          >
            {pageControls && (
              <>
                <div className="pdf-page-controls">
                  <button
                    disabled={pageNumber <= 1}
                    onClick={() => updatePage(-1)}
                    type="button"
                    aria-label="Previous page"
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
                onClick={() => downloadFile(url, pdfName)}
              >
                <img
                  src="assets/images/icons/download.svg"
                  alt="download logo"
                  style={downloadIconImgStyle}
                  className="mx-1"
                />
                <span className="mx-1">Download PDF</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
