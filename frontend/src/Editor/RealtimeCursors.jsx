import React from 'react';
import { useOthers, useSelf } from 'y-presence';
import { Cursor } from './Cursor';
import { Editor } from '@/Editor';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

function hslToHex(h, s, l) {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0'); // convert to Hex and prefix "0" if needed
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function generateRandomHslColor() {
  const h = getRandomInt(1, 360);

  return hslToHex(h, 100, 75);
}

const RealtimeEditor = (props) => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const { updatePresence } = useSelf({
    name: currentUser.first_name?.charAt(0) + currentUser.last_name?.charAt(0),
    image: '', // todo: add image feature for a user avatar
    x: 0,
    y: 0,
    color: generateRandomHslColor(),
  });

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

  const others = useOthers();

  return (
    <div onPointerMove={handlePointerMove}>
      <Editor {...props} ymap={props.ymap} />
      {others.map(({ id, presence }) => {
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
