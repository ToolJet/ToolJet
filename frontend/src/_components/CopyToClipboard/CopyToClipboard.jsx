import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { toast } from 'react-hot-toast';
import { ToolTip } from '@/_components/ToolTip';

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
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            data-cy="copy-path-to-clipboard"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M19.3113 4.68871C18.5834 3.9609 17.4034 3.9609 16.6757 4.68871L15.8421 5.5223C15.4237 5.94071 14.7453 5.94071 14.3269 5.5223C13.9084 5.10389 13.9084 4.42549 14.3269 4.00707L15.1605 3.17348C16.7251 1.60884 19.2619 1.60884 20.8266 3.17348C22.3911 4.73811 22.3911 7.2749 20.8266 8.83954L19.9929 9.67313C19.5746 10.0916 18.8961 10.0916 18.4777 9.67313C18.0593 9.25471 18.0593 8.57633 18.4777 8.1579L19.3113 7.32431C20.0391 6.59651 20.0391 5.41651 19.3113 4.68871ZM17.406 6.59394C17.8244 7.01236 17.8244 7.69074 17.406 8.10917L15.1982 10.317C14.7798 10.7354 14.1014 10.7354 13.683 10.317C13.2645 9.89856 13.2645 9.22017 13.683 8.80174L15.8908 6.59394C16.3091 6.17551 16.9876 6.17551 17.406 6.59394ZM12.6651 7.184C13.0835 7.60241 13.0835 8.28081 12.6651 8.69923L11.8315 9.53283C11.1037 10.2606 11.1037 11.4406 11.8315 12.1684C12.5593 12.8962 13.7393 12.8962 14.4671 12.1684L15.3007 11.3348C15.7191 10.9164 16.3974 10.9164 16.8159 11.3348C17.2343 11.7533 17.2343 12.4316 16.8159 12.8501L15.9823 13.6837C14.4177 15.2483 11.8809 15.2483 10.3162 13.6837C8.75161 12.119 8.75161 9.58223 10.3162 8.0176L11.1498 7.184C11.5683 6.76559 12.2467 6.76559 12.6651 7.184ZM17.245 14.9463C14.983 17.2083 11.3156 17.2083 9.05356 14.9463C6.79156 12.6843 6.79156 9.01691 9.05356 6.7549L9.52276 6.28571H4.14286C2.95939 6.28571 2 7.2451 2 8.42857V19.8571C2 21.0406 2.95939 22 4.14286 22H15.5714C16.7549 22 17.7143 21.0406 17.7143 19.8571V14.4771L17.245 14.9463Z"
              fill={'#C1C8CD'}
            />
          </svg>
        </span>
      </CopyToClipboard>
    </ToolTip>
  );
};
