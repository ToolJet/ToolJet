import React from 'react';
import { Link } from 'react-router-dom';
import LogoLightMode from '@assets/images/Logomark.svg';
import LogoDarkMode from '@assets/images/Logomark-dark-mode.svg';

function OnboardingNavbar({ darkMode }) {
  const Logo = darkMode ? LogoDarkMode : LogoLightMode;
  const navbarStyle = {
    // Your existing styles for the navbar
  };

  const linkStyle = {
    color: '#000', // Default link color
    textDecoration: 'none',
    transition: 'color 0.3s ease-in-out', // Transition effect for color change
  };

  const logoStyle = {
    height: '23px',
    width: '92px',
    transition: 'transform 0.3s ease-in-out', // Transition effect for transform
  };

  const handleHover = () => {
    linkStyle.color = '#ff6600'; // Change link color on hover
    logoStyle.transform = 'scale(1.1)'; // Increase logo size on hover
  };

  const handleHoverOut = () => {
    linkStyle.color = '#000'; // Reset link color on hover out
    logoStyle.transform = 'scale(1)'; // Reset logo size on hover out
  };

  return (
    <div className="onboarding-navbar container-xl" style={navbarStyle}>
      <Link
        to="/"
        onMouseOver={handleHover}
        onMouseOut={handleHoverOut}
        style={linkStyle}
      >
        <Logo alt="tooljet logo" data-cy="page-logo" style={logoStyle} />
      </Link>
    </div>
  );
}

export default OnboardingNavbar;
