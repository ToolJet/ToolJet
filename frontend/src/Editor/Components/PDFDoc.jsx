import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Document, Page } from 'react-pdf/dist/esm/entry.webpack';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

const PDFDoc = ({ url, onDocumentLoadError, onDocumentLoadSuccess, numPages, width, scale, height, pageRef }) => (
  <Document file={url} onLoadSuccess={onDocumentLoadSuccess} onLoadError={onDocumentLoadError} className="pdf-document">
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

export default PDFDoc;
