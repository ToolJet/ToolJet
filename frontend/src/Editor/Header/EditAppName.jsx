import React from 'react';
import EditIcon from '../Icons/edit.svg';
import { appService } from '@/_services';
import { toast } from 'react-hot-toast';

function EditAppName({ appId, appName, onNameChanged }) {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const [name, setName] = React.useState(appName);

  React.useEffect(() => {
    setName(appName);
  }, [appName]);

  const saveAppName = async (name) => {
    const newName = name.trim();
    if (!newName) {
      toast("App name can't be empty or whitespace", {
        icon: '🚨',
      });
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
      .catch(({ error }) => {
        toast(error || 'Something went wrong while editing app name', {
          icon: '🚨',
        });
      });
  };

  return (
    <div className={`app-name input-icon ${darkMode ? 'dark' : ''}`}>
      <input
        type="text"
        onChange={(e) => setName(e.target.value)}
        onBlur={(e) => saveAppName(e.target.value)}
        className="form-control-plaintext form-control-plaintext-sm"
        value={name}
        maxLength={40}
        data-cy="app-name-input"
      />
      <span className="input-icon-addon">
        <EditIcon />
      </span>
    </div>
  );
}

export default EditAppName;
