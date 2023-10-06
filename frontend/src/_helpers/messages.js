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
