export const isDarkMode = () => typeof localStorage !== 'undefined' && localStorage.getItem('darkMode') === 'true';
