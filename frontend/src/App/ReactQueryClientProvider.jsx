import React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 1000 * 10, // So basically if a query is called within specified time (10s in current case) of the last call, it will return the cached data instead of making a new request. This can be customized per query basis as well if required, else it will default to time mentioned here.
    },
  },
});

export default function ReactQueryClientProvider({ children }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
