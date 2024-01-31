import React, { useEffect } from 'react';
// eslint-disable-next-line import/no-unresolved
import { useUpdatePresence } from '@y-presence/react';

export default function UpdatePresence({ currentUser }) {
  const updatePresence = useUpdatePresence();
  useEffect(() => {
    const initialPresence = {
      firstName: currentUser?.first_name ?? '',
      lastName: currentUser?.last_name ?? '',
      email: currentUser?.email ?? '',
      image: '',
      editingVersionId: '',
      x: 0,
      y: 0,
      color: '',
    };
    updatePresence(initialPresence);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  return <></>;
}
