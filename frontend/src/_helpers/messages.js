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
 * Decode that back into the object the handler sent, or null when the error is an ordinary plain
 * string (the common case). Non-object JSON (`42`, `null`, an array) is null too, so callers can
 * reach for a field with `?.` and not have to re-check the type.
 */
export const extractErrorPayload = (error) => {
  try {
    const parsed = JSON.parse(error);
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

/**
 * The displayable half of an encoded error payload: just the message, with the extra fields
 * dropped. Falls back to the raw string when there is nothing encoded to unwrap.
 */
export const extractErrorMessage = (error) => extractErrorPayload(error)?.message || error;
