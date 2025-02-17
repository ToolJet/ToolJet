import React, { memo } from 'react';
import Popover from 'react-bootstrap/Popover';
import { exportToCSV, exportToExcel, exportToPDF } from '@/AppBuilder/Widgets/NewTable/_utils/exportData';

export const DownloadPopover = memo(({ table, darkMode, componentName }) => {
  return (
    <Popover
      id="popover-basic"
      data-cy="popover-card"
      className={`${darkMode && 'dark-theme'} shadow table-widget-download-popup`}
      placement="top-end"
    >
      <Popover.Body className="p-0">
        <div className="table-download-option cursor-pointer">
          <span
            data-cy={`option-download-CSV`}
            className="cursor-pointer"
            onClick={() => exportToCSV(table, componentName)}
          >
            Download as CSV
          </span>
          <span
            data-cy={`option-download-execel`}
            className="pt-2 cursor-pointer"
            onClick={() => exportToExcel(table, componentName)}
          >
            Download as Excel
          </span>
          <span
            data-cy={`option-download-pdf`}
            className="pt-2 cursor-pointer"
            onClick={() => exportToPDF(table, componentName)}
          >
            Download as PDF
          </span>
        </div>
      </Popover.Body>
    </Popover>
  );
});
