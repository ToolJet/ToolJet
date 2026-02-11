import { create, zustandDevTools } from './utils';
import { customDomainService } from '@/_services/custom-domain.service';

const initialState = {
  domain: null,
  status: null,
  sslStatus: null,
  cnameTarget: null,
  verificationErrors: null,
  isLoading: false,
  isSaving: false,
};

export const useCustomDomainStore = create(
  zustandDevTools(
    (set) => ({
      ...initialState,
      actions: {
        fetchCustomDomain: () => {
          set({ isLoading: true });
          return customDomainService
            .getCustomDomain()
            .then((data) => {
              set({
                domain: data.domain || null,
                status: data.status || null,
                sslStatus: data.sslStatus || null,
                cnameTarget: data.cnameTarget || null,
                verificationErrors: data.verificationErrors || null,
                isLoading: false,
              });
              return data;
            })
            .catch((error) => {
              console.error('Error fetching custom domain:', error);
              set({ isLoading: false });
              throw error;
            });
        },
        saveCustomDomain: (domain) => {
          set({ isSaving: true });
          return customDomainService
            .createCustomDomain(domain)
            .then((data) => {
              set({
                domain: data.domain || domain,
                status: data.status || null,
                sslStatus: data.sslStatus || null,
                cnameTarget: data.cnameTarget || null,
                verificationErrors: null,
                isSaving: false,
              });
              return data;
            })
            .catch((error) => {
              console.error('Error saving custom domain:', error);
              set({ isSaving: false });
              throw error;
            });
        },
        verifyCustomDomain: () => {
          return customDomainService
            .verifyCustomDomain()
            .then((data) => {
              set({
                status: data.status || null,
                sslStatus: data.sslStatus || null,
                verificationErrors: data.verificationErrors || null,
              });
              return data;
            })
            .catch((error) => {
              console.error('Error verifying custom domain:', error);
              throw error;
            });
        },
        deleteCustomDomain: () => {
          return customDomainService
            .deleteCustomDomain()
            .then(() => {
              set({ ...initialState });
            })
            .catch((error) => {
              console.error('Error deleting custom domain:', error);
              throw error;
            });
        },
        resetStore: () => {
          set({ ...initialState });
        },
      },
    }),
    { name: 'Custom Domain Store' }
  )
);

// Selectors
export const useCustomDomainActions = () => useCustomDomainStore((state) => state.actions);
