import React, { useState, useCallback, useRef, useEffect } from 'react';
// eslint-disable-next-line import/no-unresolved
import { Document, Page } from 'react-pdf/dist/esm/entry.webpack';

export const PDF = React.memo(({ styles, properties, width, height }) => {
  const { visibility } = styles;
  const { url, scale, pageControls } = properties;
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(null);
  const pageRef = useRef([]);

  const onDocumentLoadSuccess = (document) => {
    const { numPages: nextNumPages } = document;
    setNumPages(nextNumPages);
    setPageNumber(1);
  };

  const options = {
    root: document.querySelector('#pdf-wrapper'),
    rootMargin: '0px',
    threshold: 0.5,
  };

  const trackIntersection = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
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
      pageRef.current[pageNumber + offset - 1].scrollIntoView({ block: 'nearest' });
      setPageNumber((prevPageNumber) => (prevPageNumber || 1) + offset);
    },
    [pageNumber]
  );

  const renderPDF = () => (
    <Document file={url} onLoadSuccess={onDocumentLoadSuccess} className="pdf-document">
      {Array.from(new Array(numPages), (el, index) => (
        <Page
          pageNumber={index + 1}
          width={scale ? width - 12 : undefined}
          height={scale ? undefined : height}
          key={`page_${index + 1}`}
          inputRef={(el) => (pageRef.current[index] = el)}
        />
      ))}
      {pageControls && (
        <>
          <div className="pdf-page-controls">
            <button disabled={pageNumber <= 1} onClick={() => updatePage(-1)} type="button" aria-label="Previous page">
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
    </Document>
  );

  return (
    <div style={{ display: visibility ? 'flex' : 'none', width: width - 3, height }}>
      <div className="d-flex position-relative h-100" style={{ margin: '0 auto', overflow: 'hidden' }}>
        <div className="scrollable h-100 col position-relative" id="pdf-wrapper">
          {url === '' ? 'No PDF file specified' : renderPDF()}
        </div>
      </div>
    </div>
  );
});
