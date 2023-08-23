import React from 'react';
import { ToolTip } from '@/_components';
import { appService } from '@/_services';
import { handleHttpErrorMessages, validateName } from '../../_helpers/utils';

function EditAppName({ appId, appName = '', onNameChanged }) {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const [name, setName] = React.useState(appName);

  React.useEffect(() => {
    setName(appName);
  }, [appName]);

  const saveAppName = async (name) => {
    const newName = name.trim();
    if (!validateName(name, 'App name').status) {
      return;
    }
    if (newName === appName) {
      //will set back name without starting and ending spaces
      setName(newName);
      return;
    }
    await appService
      .saveApp(appId, { name: newName })
      .then(() => {
        onNameChanged(newName);
      })
      .catch((error) => {
        handleHttpErrorMessages(error, 'app');
      });
  };

  return (
    <ToolTip
      message={name}
      placement="bottom"
    >
      <div className={`app-name input-icon ${darkMode ? 'dark' : ''}`}>
        <input
          type="text"
          onChange={(e) => {
            //this was quick fix. replace this with actual tooltip props and state later
            if (document.getElementsByClassName('tooltip').length) {
              document.getElementsByClassName('tooltip')[0].style.display = 'none';
            }
            validateName(e.target.value, 'App name', true);
            setName(e.target.value);
          }}
          onBlur={(e) => saveAppName(e.target.value)}
          className="form-control-plaintext form-control-plaintext-sm"
          value={name}
          maxLength={50}
          data-cy="app-name-input"
        />
      </div>
    </ToolTip>
  );
}

export default EditAppName;
