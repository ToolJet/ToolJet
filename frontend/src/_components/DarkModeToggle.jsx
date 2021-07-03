import React, { useState, useEffect } from 'react';

export const DarkModeToggle = function DarkModeToggle({
    darkMode, switchDarkMode
}) {

    const [darkModeEnabled, setMode] = useState(darkMode);

    const icon = darkModeEnabled ? 'night.svg' : 'day.svg';
     
    return <div>
        <label className="form-check form-switch my-2">
            <img src={`/assets/images/icons/${icon}`} width="16" height="16" />
            <input
            className="form-check-input"
            type="checkbox"
            onClick={() => { switchDarkMode(!darkModeEnabled); setMode(!darkModeEnabled); } }
            checked={darkModeEnabled}
            />
        </label>
    </div>
}
