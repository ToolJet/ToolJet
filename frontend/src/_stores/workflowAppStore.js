import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';

export const useWorkflowAppStore = create(
  devtools(
    immer((set, get) => ({
      // App metadata
      app: {
        id: null,
        versionId: null,
        name: 'Untitled workflow',
        bootupComplete: false,
        savingStatus: { status: false, lastSavedTime: Date.now() },
        isMaintenanceOn: false,
      },

      // Data sources
      dataSources: [],
      staticDataSources: [],

      // Environment
      environments: [],
      currentEnvironment: undefined,
      environmentsFetchingStatus: 'NotFetched',

      // Webhooks
      webhook: {
        enabled: false,
        token: '',
        currentEnvironment: 'development',
      },

      // Parameters
      parameters: [],
      bodyParameters: [],
      testParameters: '',

      // Schedules
      schedules: [],
      scheduleOperations: {
        adding: false,
        updating: false,
        deleting: false,
      },

      // Suggestions for CodeEditor
      suggestions: [],

      // Actions
      actions: {
        setApp: (appData) =>
          set((state) => {
            Object.assign(state.app, appData);
          }),

        setAppName: (name) =>
          set((state) => {
            state.app.name = name;
          }),

        setAppSavingStatus: (status) =>
          set((state) => {
            state.app.savingStatus = {
              status,
              lastSavedTime: Date.now(),
            };
          }),

        setBootupComplete: (complete) =>
          set((state) => {
            state.app.bootupComplete = complete;
          }),

        setMaintenanceStatus: (isOn) =>
          set((state) => {
            state.app.isMaintenanceOn = isOn;
          }),

        setDataSources: (sources) =>
          set((state) => {
            state.dataSources = sources;
          }),

        setStaticDataSources: (sources) =>
          set((state) => {
            state.staticDataSources = sources;
          }),

        setEnvironments: (environments) =>
          set((state) => {
            state.environments = environments;
          }),

        setCurrentEnvironment: (environment) =>
          set((state) => {
            state.currentEnvironment = environment;
          }),

        setEnvironmentsFetchingStatus: (status) =>
          set((state) => {
            state.environmentsFetchingStatus = status;
          }),

        setWebhookEnabled: (enabled) =>
          set((state) => {
            state.webhook.enabled = enabled;
          }),

        setWorkflowApiToken: (token) =>
          set((state) => {
            state.webhook.token = token;
          }),

        setParameters: (params) =>
          set((state) => {
            state.parameters = params;
          }),

        setBodyParameters: (params) =>
          set((state) => {
            state.bodyParameters = params;
          }),

        setTestParameters: (params) =>
          set((state) => {
            state.testParameters = params;
          }),

        setSchedules: (schedules) =>
          set((state) => {
            state.schedules = schedules;
          }),

        addSchedule: (schedule) =>
          set((state) => {
            state.schedules.push(schedule);
          }),

        updateSchedule: (updatedSchedule) =>
          set((state) => {
            const index = state.schedules.findIndex((s) => s.id === updatedSchedule.id);
            if (index !== -1) {
              state.schedules[index] = updatedSchedule;
            }
          }),

        deleteSchedule: (scheduleId) =>
          set((state) => {
            state.schedules = state.schedules.filter((s) => s.id !== scheduleId);
          }),

        setScheduleAdditionInProgress: (inProgress) =>
          set((state) => {
            state.scheduleOperations.adding = inProgress;
          }),

        setScheduleUpdationInProgress: (inProgress) =>
          set((state) => {
            state.scheduleOperations.updating = inProgress;
          }),

        setScheduleDeletionInProgress: (inProgress) =>
          set((state) => {
            state.scheduleOperations.deleting = inProgress;
          }),

        setSchedulesLoadingStatus: (status) =>
          set((state) => {
            state.schedulesLoadingStatus = status;
          }),

        setSuggestions: (suggestions) =>
          set((state) => {
            state.suggestions = suggestions;
          }),

        initSuggestions: () =>
          set((state) => {
            // Initialize suggestions for CodeEditor
            state.suggestions = [];
          }),

        updateSuggestions: () =>
          set((state) => {
            // Update suggestions based on current state
            // This would be implemented based on the existing logic
          }),
      },
    })),
    { name: 'WorkflowAppStore' }
  )
);

export default useWorkflowAppStore;
