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
      error: 'Invalid input, provided data is not an object',
    };
  } else if (typeof message?.message !== 'string') {
    return {
      isValid: false,
      error: 'Invalid data, message property is not a string',
    };
  } else if (!message.type || typeof message.type !== 'string') {
    return {
      isValid: false,
      error: 'Invalid data, type property is not a string',
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
      error: 'Invalid input, provided data is not an array',
    };
  }
  return {
    isValid: true,
    error: null,
  };
};
