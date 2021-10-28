import React from 'react';
import cx from 'classnames';
import toast from 'react-hot-toast';

import { commentsService } from '@/_services';

import { pluralize } from '@/_helpers/utils';

import Spinner from '@/_ui/Spinner';

import UnResolvedIcon from './icons/unresolved.svg';
import ResolvedIcon from './icons/resolved.svg';

const CommentHeader = ({ socket, count = 0, threadId, isResolved, isThreadOwner, fetchThreads, close }) => {
  const [spinning, setSpinning] = React.useState(false);

  const handleResolved = async () => {
    setSpinning(true);
    await commentsService.updateThread(threadId, { isResolved: !isResolved });
    setSpinning(false);
    fetchThreads();
    socket.send(
      JSON.stringify({
        event: 'events',
        data: 'notifications',
      })
    );
    if (!isResolved) {
      toast.success('Thread resolved');
    } else {
      toast('Thread unresolved');
    }
  };

  const handleDelete = async () => {
    await commentsService.deleteThread(threadId);
    toast.success('Thread deleted');
    fetchThreads();
    socket.send(
      JSON.stringify({
        event: 'events',
        data: 'notifications',
      })
    );
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
        <svg
          onClick={handleDelete}
          className="m-1"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
        >
          <rect width="20" height="20" fill="url(#pattern0)" />
          <defs>
            <pattern id="pattern0" patternContentUnits="objectBoundingBox" width="1" height="1">
              <use xlinkHref="#image0_479:24" transform="scale(0.02)" />
            </pattern>
            <image
              id="image0_479:24"
              width="50"
              height="50"
              xlinkHref="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAABmJLR0QA/wD/AP+gvaeTAAABtklEQVRoge2ZPS8EQRjHf4t4qdxpheQiOYXCJfcFJETnI4go9T6DKFQahUZDwUe4aIRCFCRCJUGjJF427hKcYocdm123L88x1vySSf47z+R55p+dyWR2wWKxWP4STpvyDgOLQBnoDIk3gUtgFThr0xwyMwjc4k22VWsAld+ZZmuWiGfio21KFO2SSBKgrOltYDdkTAVYUHpUomgSIw5QiDGuT9MnwE7IGBffSDdQjJH3AXiNMa4lBZItGen27V7qkHBoArkxkgQHby0v47/uLdUn3cJqhJ1HnyTZ7E3gDqhrfQ3VJ03iGrlZWrkxInkgFoGq0nVgX4tNafoAeFa6in+GnAM3aYtLGhkHakpfASUtVtN0ScUBVoAJpeeBjbTFc7O0rBHTsEZMwxoxDWvENKwR07BGTMMaMQ3J+8gL/t36PhDT79xvmn7SYo0sxSWN7AMDEbGo/hmp4rlZWv/aiKvpIamJBNDzupGjNNLskSNNTwJrwHGKPFGMALPa86Fg7i84eJ90fuIL/AXQ2y4j4P1eO22ziWtgLO6EsvwM7QHmgGmgP0OeIC6wB6wDj4J5LRaLxSDeAUc+ozONRVpCAAAAAElFTkSuQmCC"
            />
          </defs>
        </svg>
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
