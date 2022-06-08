/* eslint-disable import/no-unresolved */
import React from 'react';
import { useOthers, useSelf } from 'y-presence';
import { xorWith, isEqual } from 'lodash';
import { Editor } from '@/Editor';
import { USER_COLORS } from '@/_helpers/constants';
import { userService } from '@/_services';

const RealtimeCursors = (props) => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const others = useOthers();

  const unavailableColors = others.map((other) => other?.presence?.color);
  const availableColors = xorWith(USER_COLORS, unavailableColors, isEqual);

  const { self, updatePresence } = useSelf({
    firstName: currentUser.first_name,
    lastName: currentUser.last_name,
    image: '', // todo: add image feature for a user avatar
    editingVersionId: '',
    x: 0,
    y: 0,
    color: availableColors[Math.floor(Math.random() * availableColors.length)],
  });

  React.useEffect(() => {
    async function fetchAvatar() {
      const blob = await userService.getAvatar(currentUser.avatar_id);
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        updatePresence({ image: e.target.result });
      };
      fileReader.readAsDataURL(blob);
    }
    if (currentUser.avatar_id) fetchAvatar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.avatar_id]);

  const othersOnSameVersion = others.filter(
    (other) => other?.presence?.editingVersionId === self?.presence.editingVersionId
  );

  const handlePointerMove = React.useCallback(
    (e) => {
      const element = document.getElementById('real-canvas');
      if (element?.parentNode?.matches(':hover')) {
        const { left: offsetFromLeftOfCanvas, top: offsetFromTopOfCanvas } = document
          .getElementsByClassName('real-canvas')[0]
          .getBoundingClientRect();
        const x = Math.round(e.pageX - offsetFromLeftOfCanvas);
        const y = Math.round(e.pageY - offsetFromTopOfCanvas);

        updatePresence({
          x,
          y,
        });
      }
    },
    [updatePresence]
  );

  return (
    <div onPointerMove={handlePointerMove}>
      <Editor
        {...props}
        othersOnSameVersion={othersOnSameVersion}
        self={self}
        updatePresence={updatePresence}
        ymap={props.ymap}
      />
    </div>
  );
};

export default RealtimeCursors;
