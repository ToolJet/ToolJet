/* file for adding text related util functions (text messagess) */
import _ from 'lodash';

export const ssoConfMessages = (sso, action, dynamic_parts) => {
  const manageSsoMessages = {
    sso_updated: '{{sso}} configuration updated \n successfully',
    sso_update_failed: '{{sso}} configuration update failed. Please \n double-check your settings and try again',
  };
  let message = manageSsoMessages[action];
  message = message.replace('{{sso}}', sso);
  if (!_.isEmpty(dynamic_parts)) {
    Object.keys(dynamic_parts).map((placeholder) => {
      message = message.replace(`{{${placeholder}}}`, dynamic_parts[placeholder]);
    });
  }
  return message;
};

/**
 * The global exception filter collapses every error response down to `{ message, ... }`, dropping
 * any other fields on the exception body — so a handler that needs to carry extra detail (e.g. the
 * branch list in FoldersService.deleteFolder) JSON-encodes it into the message string itself.
 * Unwrap that back to the plain message for display; falls back to the raw string when it isn't
 * JSON (the common case — most error messages are plain strings, not an encoded payload).
 */
export const extractErrorMessage = (error) => {
  try {
    const parsed = JSON.parse(error);
    return parsed?.message || error;
  } catch {
    return error;
  }
};
