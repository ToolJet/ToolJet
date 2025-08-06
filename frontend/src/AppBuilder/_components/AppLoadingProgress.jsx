import React, { useState, useEffect } from 'react';

/**
 * Loading Progress Component for Large App Loading
 * Shows detailed progress during app initialization
 */
export const AppLoadingProgress = ({ isVisible = false, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Initializing...');
  const [steps, setSteps] = useState([]);

  useEffect(() => {
    if (!isVisible) return;

    // Monitor performance events for progress
    const handlePerformanceEvent = (event) => {
      if (event.detail) {
        const { step, progress: stepProgress, total } = event.detail;

        setCurrentStep(step);
        setProgress(Math.round((stepProgress / total) * 100));

        setSteps(prev => {
          const newSteps = [...prev];
          const existingIndex = newSteps.findIndex(s => s.name === step);

          if (existingIndex >= 0) {
            newSteps[existingIndex] = { name: step, progress: stepProgress, total, completed: stepProgress === total };
          } else {
            newSteps.push({ name: step, progress: stepProgress, total, completed: stepProgress === total });
          }

          return newSteps;
        });

        // Check if all steps are complete
        if (stepProgress === total && step === 'Dependency Graph Init') {
          setTimeout(() => {
            onComplete?.();
          }, 500);
        }
      }
    };

    window.addEventListener('tooljet-load-progress', handlePerformanceEvent);

    // Simulate progress updates based on known performance markers
    const progressInterval = setInterval(() => {
      // Listen for performance console logs and update progress
      const perfReport = window.perfMonitor?.getReport();
      if (perfReport) {
        const completedOperations = Object.keys(perfReport.measures || {}).length;
        const totalOperations = 5; // AppDataFetch, ComponentMapping, DependencyGraphInit, etc.
        setProgress(Math.min(90, (completedOperations / totalOperations) * 100));
      }
    }, 500);

    return () => {
      window.removeEventListener('tooljet-load-progress', handlePerformanceEvent);
      clearInterval(progressInterval);
    };
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-6 border">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 mx-auto mb-4 relative">
              <div className="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin border-t-blue-600"></div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Loading Large App</h2>
            <p className="text-gray-600 text-sm mt-1">Optimizing performance for better experience...</p>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{currentStep}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Step Details */}
          <div className="space-y-2 text-sm">
            {steps.map((step, index) => (
              <div key={step.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${step.completed ? 'bg-green-500' : 'bg-blue-500'
                    }`}></div>
                  <span className={step.completed ? 'text-green-700' : 'text-gray-700'}>
                    {step.name}
                  </span>
                </div>
                <span className="text-gray-500">
                  {step.completed ? '✓' : `${step.progress}/${step.total}`}
                </span>
              </div>
            ))}
          </div>

          {/* Performance Tips */}
          <div className="mt-6 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
            <p className="text-blue-800 text-xs">
              <strong>💡 Performance Tip:</strong> Large apps load faster with component virtualization.
              This optimization is automatic for apps with 200+ components.
            </p>
          </div>

          {/* Time Estimate */}
          <div className="mt-4 text-center text-xs text-gray-500">
            Estimated time remaining: {Math.max(0, Math.round((100 - progress) * 0.2))}s
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook to manage app loading progress
 */
export const useAppLoadingProgress = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const startLoading = () => {
    setIsLoading(true);
    setProgress(0);
  };

  const updateProgress = (step, current, total) => {
    const percentage = Math.round((current / total) * 100);
    setProgress(percentage);

    // Dispatch custom event for progress component
    window.dispatchEvent(new CustomEvent('tooljet-load-progress', {
      detail: { step, progress: current, total }
    }));
  };

  const completeLoading = () => {
    setProgress(100);
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  return {
    isLoading,
    progress,
    startLoading,
    updateProgress,
    completeLoading
  };
};

export default AppLoadingProgress;
