const toLocaleDateString = (timestamp) => {
  const date = new Date(timestamp);
  const today = new Date();

  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTimestamp = (timestamp) => {
  if (timestamp === 'new Date().toISOString()') {
    return toLocaleDateString(new Date().toISOString());
  }

  if (!timestamp || isNaN(new Date(timestamp).getTime())) {
    return '--/--';
  }
  return toLocaleDateString(timestamp);
};

export const validateSingleMessageObject = (message) => {
  if (!message || typeof message !== 'object' || message === null || Array.isArray(message)) {
    return {
      isValid: false,
      error: 'Invalid input: Data must be an object.',
    };
  } else if (typeof message?.message !== 'string') {
    return {
      isValid: false,
      error: `Invalid input: 'Message' property must be a string.`,
    };
  } else if (!message.type || typeof message.type !== 'string') {
    return {
      isValid: false,
      error: `Invalid input: 'Type' property must be a string.`,
    };
  } else if (!['response', 'error', 'message'].includes(message.type)) {
    return {
      isValid: false,
      error: `Invalid input: 'Type' property must be one of the following: 'response', 'error', 'message'.`,
    };
  }
  return {
    isValid: true,
    error: null,
  };
};

export const validateMessageHistory = (history) => {
  if (!history || !Array.isArray(history)) {
    return {
      isValid: false,
      error: 'Invalid input: History data must be an array.',
    };
  }
  return {
    isValid: true,
    error: null,
  };
};
