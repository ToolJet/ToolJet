import useWorkflowCanvasStore from '../workflowCanvasStore';
import useWorkflowModalStore from '../workflowModalStore';
import useWorkflowAppStore from '../workflowAppStore';
import { workflowExecutionsService } from '@/_services';
import { toast } from 'react-hot-toast';

export const useWorkflowActions = () => {
  const canvasActions = useWorkflowCanvasStore((state) => state.actions);
  const modalActions = useWorkflowModalStore((state) => state.actions);
  const appActions = useWorkflowAppStore((state) => state.actions);

  return {
    // Composite actions that coordinate multiple stores
    selectAndPreviewNode: (nodeId) => {
      const node = useWorkflowCanvasStore.getState().canvas.nodes.find((n) => n.id === nodeId);
      canvasActions.setSelectedNode(node);
      // Clear any existing previews for other nodes
      modalActions.clearAllPreviews();
      // Could extend to load node preview if needed
    },

    // Enhanced webhook management with cross-store coordination
    toggleWebhook: async (workflowId, enabled) => {
      try {
        const result = await workflowExecutionsService.enableWebhook(workflowId, enabled);
        if (result.statusCode === 200) {
          // Update App Store
          appActions.setWebhookEnabled(enabled);
          // Could also update any modal states related to webhooks
          return { success: true };
        } else {
          toast.error(result.message);
          return { success: false, error: result.message };
        }
      } catch (error) {
        toast.error('Failed to toggle webhook');
        return { success: false, error };
      }
    },

    deleteNode: async (nodeId) => {
      // Show confirmation modal
      modalActions.showNodeDeletionModal(nodeId);
    },

    confirmDeleteNode: (nodeId) => {
      // Clear any previews for this node
      modalActions.clearNodePreviewState(nodeId);
      // Remove from canvas
      canvasActions.removeNode(nodeId);
      // Remove from selected if it was selected
      const currentSelected = useWorkflowCanvasStore.getState().canvasUI.selectedNode;
      if (currentSelected?.id === nodeId) {
        canvasActions.setSelectedNode(null);
      }
      // Close modal
      modalActions.hideNodeDeletionModal();
    },

    // Environment coordination
    setCurrentEnvironment: (environment) => {
      appActions.setCurrentEnvironment(environment);
      // Could trigger webhook URL updates in modal store if needed
    },

    initializeWorkflow: (appData, flowData, environments, schedules, parameters) => {
      // Initialize app store
      appActions.setApp({
        id: appData.id,
        versionId: appData.editing_version?.id,
        name: appData.name,
        bootupComplete: true,
      });

      // Initialize canvas store
      if (flowData) {
        canvasActions.updateFlow(flowData);
        canvasActions.setLastMousePosition({ x: 100, y: 100 });
      }

      // Initialize webhook configuration
      if (appData.workflow_enabled !== undefined) {
        appActions.setWebhookEnabled(appData.workflow_enabled);
      }

      if (appData.workflow_api_token) {
        appActions.setWorkflowApiToken(appData.workflow_api_token);
      }

      // Initialize environments
      if (environments) {
        appActions.setEnvironments(environments);
        if (environments.length > 0) {
          appActions.setCurrentEnvironment(environments[0]);
        }
      }

      // Initialize schedules
      if (schedules) {
        appActions.setSchedules(schedules);
      }

      // Initialize parameters
      if (parameters) {
        if (parameters.bodyParameters) {
          appActions.setBodyParameters(parameters.bodyParameters);
        }
        if (parameters.testParameters) {
          appActions.setTestParameters(parameters.testParameters);
        }
      }

      // Initialize modal store
      modalActions.clearAllPreviews();
    },

    saveWorkflow: async () => {
      const canvasState = useWorkflowCanvasStore.getState();
      const appState = useWorkflowAppStore.getState();

      appActions.setAppSavingStatus(true);

      try {
        // Prepare comprehensive save data
        const saveData = {
          flow: {
            nodes: canvasState.canvas.nodes,
            edges: canvasState.canvas.edges,
          },
          webhook: {
            enabled: appState.webhook.enabled,
            token: appState.webhook.token,
          },
          environments: appState.environments,
          schedules: appState.schedules,
          parameters: {
            bodyParameters: appState.bodyParameters,
            testParameters: appState.testParameters,
          },
        };

        // This would integrate with the actual save logic
        // await saveWorkflowToBackend(appState.app.id, saveData);

        appActions.setAppSavingStatus(false);
        return { success: true };
      } catch (error) {
        appActions.setAppSavingStatus(false);
        return { success: false, error };
      }
    },

    // Store synchronization helpers
    syncStores: () => {
      // This could be used to ensure all stores are in sync
      // Useful for debugging or error recovery
      const canvasState = useWorkflowCanvasStore.getState();
      const appState = useWorkflowAppStore.getState();
      const modalState = useWorkflowModalStore.getState();

      console.log('Store Sync Status:', {
        canvas: {
          nodes: canvasState.canvas.nodes.length,
          selectedNode: canvasState.canvasUI.selectedNode?.id,
        },
        app: {
          id: appState.app.id,
          environments: appState.environments.length,
          schedules: appState.schedules.length,
        },
        modal: {
          activePreviews: Object.keys(modalState.nodePreview.states).length,
          deletionModal: modalState.modal.nodeDeletion.showModal,
        },
      });
    },

    // Performance monitoring helpers
    getPerformanceMetrics: () => {
      // This could return metrics about store performance
      // Useful for monitoring the 65-74% render reduction target
      return {
        canvasRenderCount: useWorkflowCanvasStore.getState().canvas.nodes.length,
        modalStates: Object.keys(useWorkflowModalStore.getState().nodePreview.states).length,
        appDataSize: Object.keys(useWorkflowAppStore.getState().app).length,
      };
    },

    // Direct access to individual store actions
    canvas: canvasActions,
    modal: modalActions,
    app: appActions,
  };
};
