/* eslint-disable import/no-unresolved */
import React from 'react';
import { useOthers, useSelf, useUpdatePresence } from '@y-presence/react';
import { useEventListener } from '@/_hooks/use-event-listener';
import { xorWith, isEqual } from 'lodash';
import { Cursor } from './Cursor';
import { USER_COLORS } from '@/_helpers/constants';
import { userService } from '@/_services';

const RealtimeCursors = ({ editingVersionId }) => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const others = useOthers();

  const unavailableColors = others.map((other) => other?.presence?.color);
  const availableColors = xorWith(USER_COLORS, unavailableColors, isEqual);

  const self = useSelf();
  const updatePresence = useUpdatePresence();

  React.useEffect(() => {
    updatePresence({ color: availableColors[Math.floor(Math.random() * availableColors.length)] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    updatePresence({ editingVersionId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingVersionId]);

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

  useEventListener('mousemove', handlePointerMove);

  return (
    <>
      {othersOnSameVersion?.map(({ id, presence }) => {
        if (!presence) return null;
        return <Cursor key={id} name={presence.firstName} color={presence.color} x={presence.x} y={presence.y} />;
      })}
    </>
  );
};

export default RealtimeCursors;
