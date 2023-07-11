import React from 'react';
import cx from 'classnames';
import data from '@emoji-mart/data/sets/14/apple.json';
import Picker from '@emoji-mart/react';

import TextareaMentions from '@/_ui/Mentions';
import Button from '@/_ui/Button';
import usePopover from '@/_hooks/use-popover';
import { useHotkeys } from 'react-hotkeys-hook';
// eslint-disable-next-line import/no-unresolved
import { useTranslation } from 'react-i18next';

function CommentFooter({
  searchUser,
  editComment = '',
  setMentionedUsers,
  editCommentId,
  setEditCommentId,
  handleSubmit,
}) {
  const [comment, setComment] = React.useState(editComment);
  const [loading, setLoading] = React.useState(false);
  const [open, trigger, content, setOpen] = usePopover(false);
  const { t } = useTranslation();

  React.useEffect(() => {
    setComment(editComment);
  }, [editComment]);

  const handleClick = async () => {
    setLoading(true);
    await handleSubmit(comment, editCommentId);
    setComment('');
    setEditCommentId('');
    setLoading(false);
  };

  const addEmoji = (emoji) => {
    setComment(comment + ' ' + emoji.native);
    setOpen(false);
  };

  useHotkeys('meta+enter, control+enter', () => handleClick());
  const darkMode = localStorage.getItem('darkMode') === 'true';
  return (
    <>
      <div {...content} className={open ? 'show' : 'hide'}>
        <Picker
          data={data}
          theme={darkMode ? 'dark' : 'light'}
          style={{ width: 320 }}
          set="apple"
          onEmojiSelect={addEmoji}
        />
      </div>
      <div className="card-footer">
        <div className="row align-items-center">
          <div className="col-9">
            <TextareaMentions
              searchUser={searchUser}
              setMentionedUsers={setMentionedUsers}
              value={comment}
              setValue={setComment}
              placeholder={t('leftSidebar.Comments.typeComment', 'Type your comment here')}
              darkMode={darkMode}
            />
          </div>
          <div className="col-1 cursor-pointer">
            <svg {...trigger} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M6.6665 11.6667C6.6665 11.6667 7.9165 13.3334 9.99984 13.3334C12.0832 13.3334 13.3332 11.6667 13.3332 11.6667M7.5 7.5H7.51M12.5 7.5H12.51M18.3332 10.0001C18.3332 14.6025 14.6022 18.3334 9.99984 18.3334C5.39746 18.3334 1.6665 14.6025 1.6665 10.0001C1.6665 5.39771 5.39746 1.66675 9.99984 1.66675C14.6022 1.66675 18.3332 5.39771 18.3332 10.0001Z"
                stroke="#5E5E5E"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div
            className={cx('col-2', {
              'cursor-pointer': !!comment,
              'cursor-not-allowed': !comment,
            })}
          >
            <Button loading={loading} disabled={!comment} className={`m2 btn-sm rounded-2`} onClick={handleClick}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M18.0884 1.91109C18.3169 2.13956 18.3927 2.4795 18.283 2.78339L12.8663 17.7834C12.8584 17.8051 12.8497 17.8265 12.8401 17.8475C12.737 18.0724 12.5716 18.2629 12.3635 18.3965C12.1553 18.5301 11.9132 18.6011 11.6658 18.6011C11.4185 18.6011 11.1764 18.5301 10.9682 18.3965C10.765 18.2661 10.6026 18.0815 10.4991 17.8636L7.71137 12.2881L2.13593 9.50043C1.91807 9.39695 1.73342 9.23448 1.60303 9.0313C1.46945 8.82315 1.39844 8.58102 1.39844 8.33368C1.39844 8.08635 1.46945 7.84422 1.60303 7.63606C1.73661 7.42791 1.92715 7.26248 2.152 7.15944C2.173 7.14982 2.1944 7.14107 2.21613 7.13322L17.2161 1.71655C17.52 1.60682 17.86 1.68263 18.0884 1.91109ZM9.34646 11.8316L11.6093 16.3572L15.4463 5.73176L9.34646 11.8316ZM14.2677 4.55325L3.6423 8.39022L8.16795 10.653L14.2677 4.55325Z"
                  fill="#FDFDFE"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default CommentFooter;
