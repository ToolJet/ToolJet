import React from 'react';
import { useOthers, useSelf } from 'y-presence';
import { xorWith, isEqual } from 'lodash';
import { Cursor } from './Cursor';
import { Editor } from '@/Editor';
import { USER_COLORS } from '@/_helpers/constants';

const RealtimeEditor = (props) => {
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

  const othersOnSameVersion = others.filter(
    (other) => other?.presence?.editingVersionId === self?.presence.editingVersionId
  );

  const handlePointerMove = React.useCallback(
    (e) => {
      const element = document.getElementById('real-canvas');
      if (element?.parentNode?.matches(':hover')) {
        updatePresence({
          x: e.pageX / document.documentElement.clientWidth,
          y: e.pageY / document.documentElement.clientHeight,
        });
      }
    },
    [updatePresence]
  );

  return (
    <div onPointerMove={handlePointerMove}>
      <Editor {...props} self={self} updatePresence={updatePresence} ymap={props.ymap} />
      {othersOnSameVersion.map(({ id, presence }) => {
        if (!presence) return null;
        return (
          <Cursor
            key={id}
            color={presence.color}
            x={presence.x * document.documentElement.clientWidth}
            y={presence.y * document.documentElement.clientHeight}
          />
        );
      })}
    </div>
  );
};

export default RealtimeEditor;
