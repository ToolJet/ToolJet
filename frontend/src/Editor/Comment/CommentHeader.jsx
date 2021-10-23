import React from 'react';
import cx from 'classnames';
import toast from 'react-hot-toast';

import { commentsService } from '@/_services';

import { pluralize } from '@/_helpers/utils';

import Spinner from '@/_ui/Spinner';

import UnResolvedIcon from './icons/unresolved.svg';
import ResolvedIcon from './icons/resolved.svg';

const CommentHeader = ({ count = 0, threadId, isResolved, isThreadOwner, fetchThreads, close }) => {
  const [spinning, setSpinning] = React.useState(false);

  const handleResolved = async () => {
    setSpinning(true);
    await commentsService.updateThread(threadId, { isResolved: !isResolved });
    setSpinning(false);
    fetchThreads();
    if (!isResolved) {
      toast.success('Thread resolved');
    } else {
      toast('Thread unresolved');
    }
  };

  const getResolveIcon = () => {
    if (spinning) return <Spinner />;

    if (isResolved) return <ResolvedIcon />;

    return <UnResolvedIcon />;
  };

  const getIcon = () => {
    if (isResolved)
      return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="6" cy="6" r="6" fill="#8991A0" />
        </svg>
      );

    return (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="6" cy="6" r="6" fill="#FCAA0D" />
      </svg>
    );
  };

  return (
    <div className="card-header">
      <div className="card-subtitle mt-1">
        {getIcon()} {pluralize(count, 'comment')}
      </div>
      <div className="ms-auto d-flex">
        <span
          title={isThreadOwner ? 'toggle resolved' : 'only creator of thread can resolve'}
          className={cx('m-1', { disabled: !isThreadOwner })}
          onClick={handleResolved}
        >
          {getResolveIcon()}
        </span>
        <div onClick={close} className="m-1 cursor-pointer">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M6.64628 7.62107L11.6712 12.6474L12.647 11.673L7.62067 6.64669L12.647 1.62176L11.6726 0.645996L6.64628 5.6723L1.62136 0.645996L0.646973 1.62176L5.6719 6.64669L0.646973 11.6716L1.62136 12.6474L6.64628 7.62107Z"
              fill="black"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default CommentHeader;
