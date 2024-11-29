import { useEffect, useState } from 'react';
import { marketplaceService } from '@/_services';
import toast from 'react-hot-toast';

export function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const useTagsByPluginId = (id) => {
  const [tags, setTags] = useState([]);

  useEffect(() => {
    marketplaceService
      .findAll()
      .then(({ data = [] }) => {
        const plugin = data.find((plugin) => plugin.id === id);
        setTags(plugin?.tags || []);
      })
      .catch((error) => {
        toast.error(error?.message || 'Failed to fetch plugins');
      });
  }, [id]);

  return { tags };
};
