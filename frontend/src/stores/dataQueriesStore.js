import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { dataqueryService } from '@/_services';

let useDataQueriesStore = create((set) => ({
  dataQueries: [],
  loadingDataQueries: true,
  actions: {
    fetchDataQueries: (appId) => {
      set({ loadingDataQueries: true });
      dataqueryService.getAll(appId).then((data) => {
        set({
          dataQueries: data.data_queries,
          loadingDataQueries: false,
        });
      });
    },
  },
}));
