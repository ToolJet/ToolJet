// The native Chat's helpers (Widgets/Chat/utils/helpers.js), typed: that module is JavaScript.
import * as chat from '@/AppBuilder/Widgets/Chat/utils/helpers';

export interface ChatValidation {
  isValid: boolean;
  error?: string;
}

export const formatTimestamp = chat.formatTimestamp as (timestamp: unknown) => string;
export const validateSingleMessageObject = chat.validateSingleMessageObject as (message: unknown) => ChatValidation;
export const validateMessageHistory = chat.validateMessageHistory as (history: unknown) => ChatValidation;
