import React from 'react';

const GoogleLoginButton = () => {
  const handleGoogleLogin = () => {
    window.location.href = '/auth/google'; // points to backend route
  };

  return (
    <button 
      onClick={handleGoogleLogin} 
      style={{ padding: '10px 20px', background: '#4285F4', color: '#fff', border: 'none', borderRadius: '4px' }}
    >
      Login with Google
    </button>
  );
};

export default GoogleLoginButton;
