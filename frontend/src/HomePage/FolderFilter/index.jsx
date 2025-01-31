import React, { useEffect, useRef, useState } from 'react';
import { isEmpty } from 'lodash';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { getWorkspaceId } from '@/_helpers/utils';

export default function FolderFilter({ disabled, options, onChange, value }) {
  const navigate = useNavigate();
  const [currentFolder, setCurrentFolder] = useState({});
  const defaultFolder = { name: 'All apps', label: 'All apps', value: '', id: '' };
  let selectRef = useRef();

  const handleFolderChange = (folder) => {
    onChange(folder);
    updateFolderQuery(folder?.name, folder?.id);
  };

  const updateFolderQuery = (name, id) => {
    const path = `${id ? `?folder=${name}` : ''}`;
    navigate({ pathname: `/${getWorkspaceId()}`, search: path }, { replace: true });
  };

  useEffect(() => {
    if (isEmpty(value)) {
      setCurrentFolder(defaultFolder);
    } else {
      setCurrentFolder({ ...value, value: value?.id });
      handleFolderChange(value);
    }
  }, [value]);

  return (
    <div className="folder-filter">
      <Select
        ref={selectRef}
        value={currentFolder}
        onChange={handleFolderChange}
        options={[defaultFolder, ...options]}
        isDisabled={disabled}
        classNamePrefix="react-select"
        placeholder="Select a folder"
      />
    </div>
  );
}
