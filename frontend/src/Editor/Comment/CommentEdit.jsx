import React from 'react';
import cx from 'classnames';
import { useTranslation } from 'react-i18next';
import TextareaMentions from '@/_ui/Mentions';
import Button from '@/_ui/Button';
import usePopover from '@/_hooks/use-popover';

const CommentEdit = ({
  searchUser,
  setMentionedUsers,
  editComment,
  setEditComment,
  editCommentId,
  setEditCommentId,
  handleEdit,
}) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const { t } = useTranslation();

  const handleClick = async () => {
    await handleEdit(editComment, editCommentId);
    setEditComment('');
    setEditCommentId('');
  };
  return (
    <div className="row align-items-center">
      <div className="col-8">
        <TextareaMentions
          searchUser={searchUser}
          setMentionedUsers={setMentionedUsers}
          value={editComment}
          setValue={setEditComment}
          darkMode={darkMode}
        />
      </div>
      <div
        className={cx('col-3', {
          'cursor-pointer': !!editComment,
          'cursor-not-allowed': !editComment,
        })}
      >
        <Button className={`m2 btn-sm rounded-2`} onClick={handleClick}>
          {t('globals.update', 'Update')}
        </Button>
      </div>
    </div>
  );
};

export default CommentEdit;
