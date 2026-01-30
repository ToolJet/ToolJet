import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsCapturing, useLogCaptureActions } from '@/_stores/logCaptureStore';
import { toast } from 'react-hot-toast';
import './LogCaptureFloatingButton.scss';

export const LogCaptureFloatingButton = () => {
  const isCapturing = useIsCapturing();
  const { stopCapture } = useLogCaptureActions();
  const navigate = useNavigate();
  const [isStopping, setIsStopping] = useState(false);

  // Don't render if not capturing
  if (!isCapturing) {
    return null;
  }

  const handleStopCapture = async () => {
    setIsStopping(true);
    try {
      await stopCapture();
      toast.success('Log capture stopped successfully', {
        position: 'top-center',
      });
      // Navigate to support logs page
      navigate('/settings/support-logs');
    } catch (error) {
      toast.error('Failed to stop log capture', {
        position: 'top-center',
      });
      console.error('Error stopping capture:', error);
    } finally {
      setIsStopping(false);
    }
  };

  return (
    <div className="log-capture-floating-button" data-cy="log-capture-floating-button">
      <button
        className="log-capture-button"
        onClick={handleStopCapture}
        disabled={isStopping}
        aria-label="Stop log capture"
        title="Stop log capture and view logs"
      >
        {/* Pulsing red dot indicator */}
        <div className="recording-indicator">
          <div className="recording-dot"></div>
          <div className="recording-pulse"></div>
        </div>

        {/* Button text */}
        <span className="button-text">
          {isStopping ? 'Stopping...' : 'Stop Recording'}
        </span>
      </button>
    </div>
  );
};

export default LogCaptureFloatingButton;
