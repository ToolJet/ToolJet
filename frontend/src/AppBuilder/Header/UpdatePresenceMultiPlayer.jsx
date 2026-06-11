import React, { useEffect } from 'react';
// eslint-disable-next-line import/no-unresolved
import { useUpdatePresence } from '@y-presence/react';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

export default function UpdatePresenceMultiPlayer() {
  const { user } = useStore(
    (state) => ({
      user: state.user,
    }),
    shallow
  );

  const updatePresence = useUpdatePresence();
  useEffect(() => {
    if (user) {
      const initialPresence = {
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        email: user.email ?? '',
        image: '',
        editingVersionId: '',
        x: 0,
        y: 0,
        color: '',
      };
      updatePresence(initialPresence);
    }
  }, [user, updatePresence]);

  return <></>;
}
