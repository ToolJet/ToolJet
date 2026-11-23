import React, { useState, useCallback, useRef } from 'react';
import Drawer from '@/_ui/Drawer';
import { toast } from 'react-hot-toast';
import { useTooljetDatabaseContext } from '../../TooljetDatabaseContext';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { linkButtonVariants } from '@/components/ui/Rocket/LinkButton/LinkButton';
import { DrawerShell } from '../TableDrawer/DrawerShell';
import { FileDropzone } from './FileDropzone';

const DOCS = 'https://docs.tooljet.com/docs/tooljet-db/database-editor/#bulk-upload-data';

function BulkUploadDrawer({
  isBulkUploadDrawerOpen,
  setIsBulkUploadDrawerOpen,
  bulkUploadFile,
  handleBulkUploadFileChange,
  handleBulkUpload,
  isBulkUploading,
  errors,
}) {
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [progress, setProgress] = useState(0);
  const { columns, selectedTable } = useTooljetDatabaseContext();
  const hiddenFileInput = useRef(null);

  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (Math.round(file.size / 1024) > 2 * 1024) {
      toast.error('File size cannot exceed more than 2MB');
    } else {
      handleBulkUploadFileChange(file);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTemplateDownload = () => {
    setIsDownloadingTemplate(true);

    return setTimeout(() => {
      // Create a CSV content string with the column names as the header row
      const headerRow = columns.map((col) => col.Header).join(',');
      const csvContent = [headerRow].join('\n');
      // Create a Blob with the CSV content
      const blob = new Blob([csvContent], { type: 'text/csv' });
      // Create a temporary URL for the Blob
      const href = URL.createObjectURL(blob);
      // Create a link element to trigger the download
      const link = document.createElement('a');
      link.href = href;
      link.download = `${selectedTable.table_name}.csv`;
      // Trigger the download
      link.click();

      setIsDownloadingTemplate(false);

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(href);
    }, 500);
  };

  const handleClick = () => {
    hiddenFileInput.current.click();
  };

  const close = () => setIsBulkUploadDrawerOpen(false);

  return (
    <Drawer
      isOpen={isBulkUploadDrawerOpen}
      onClose={close}
      position="right"
      drawerStyle={{ width: '480px' }}
      className="tj-db-drawer"
    >
      <DrawerShell
        title="Bulk upload data"
        data-cy="bulk-upload-data-header"
        onClose={close}
        footerStart={
          <a
            href={DOCS}
            target="_blank"
            rel="noreferrer"
            className={linkButtonVariants()}
            data-cy="bulk-upload-docs-link"
          >
            Read docs
          </a>
        }
        submitLabel="Upload data"
        submitDataCy="upload-data-button"
        submitDisabled={
          !isBulkUploading &&
          (!bulkUploadFile || errors.client.length > 0 || errors.server.length > 0 || progress <= 99)
        }
        isSubmitting={isBulkUploading}
        onSubmit={handleBulkUpload}
      >
        <section className="tw-flex tw-flex-col tw-gap-2">
          <h3 className="tw-m-0 tw-font-title-default tw-text-text-default">Download CSV template</h3>
          <p className="tw-m-0 tw-font-body-small tw-text-text-placeholder" data-cy="helper-text-bulk-upload">
            Start with a blank template to add new rows, or export the current table data, pre-filled, to edit and
            re-upload for updates.
          </p>
          <div>
            <Button
              variant="outline"
              size="medium"
              leadingVisual={<Download />}
              loading={isDownloadingTemplate}
              onClick={handleTemplateDownload}
              data-cy="button-download-template"
            >
              Download template
            </Button>
          </div>
        </section>
        <section className="tw-flex tw-flex-col tw-gap-2">
          <h3 className="tw-m-0 tw-font-title-default tw-text-text-default">Upload CSV</h3>
          <FileDropzone
            handleClick={handleClick}
            hiddenFileInput={hiddenFileInput}
            errors={errors}
            handleFileChange={handleBulkUploadFileChange}
            onDrop={onDrop}
            progress={progress}
            setProgress={setProgress}
          />
        </section>
      </DrawerShell>
    </Drawer>
  );
}
export default BulkUploadDrawer;
