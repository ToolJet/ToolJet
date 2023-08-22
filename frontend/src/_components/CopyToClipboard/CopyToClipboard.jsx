import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { toast } from 'react-hot-toast';
import { ToolTip } from '@/_components/ToolTip';
import SolidIcon from '@/_ui/Icon/SolidIcons';

export const CopyToClipboardComponent = ({ data, callback }) => {
  const [copied, setCopied] = React.useState(false);
  const dataToCopy = callback(data);
  const message = 'Path copied to clipboard';
  const tip = 'Copy path to clipboard';

  //clears the clipboard after 2 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setCopied(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  if (copied) {
    return <center className="color-slate12">Copied</center>;
  }

  return (
    <ToolTip message={tip}>
      <CopyToClipboard
        text={dataToCopy}
        onCopy={() => {
          setCopied(true);
          toast.success(message, { position: 'top-center' });
        }}
      >
        <span style={{ height: '13px', width: '13px', marginBottom: '2px' }} className="mx-1 copy-to-clipboard">
          <SolidIcon width="12" height="12" name="copy" />
        </span>
      </CopyToClipboard>
    </ToolTip>
  );
};
