import React from 'react';
import { useThemeConfig } from '@docusaurus/theme-common';
import FooterLinks from '@theme/Footer/Links';
import FooterCopyright from '@theme/Footer/Copyright';
import Link from '@docusaurus/Link';
import ThemedImage from '@theme/ThemedImage';

function Footer() {
  const { footer } = useThemeConfig();
  if (!footer) {
    return null;
  }

  const { copyright, links, logo, style } = footer;

  const [firstLinkGroup, ...otherLinkGroups] = links || [];

  return (
    <footer className={`footer ${style ? `footer--${style}` : ''}`}>
      <div className="container">
        <div className="footer__top" style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
          <div className="footer__col" style={{ flex: '1 1 200px' }}>
            {logo && (
              <>
                <ThemedImage
                  alt={logo.alt}
                  sources={{ light: logo.src, dark: logo.srcDark || logo.src }}
                  style={{ width: '160px', height: 'auto', boxShadow: 'none', borderRadius: '0'  }}
                />
                <p className="footer__tagline" style={{ marginTop: '0.5rem' }}>AI-powered apps, built with AI</p>
                <div className="footer__socials" style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                  <a href="https://github.com/ToolJet" target="_blank" rel="noopener noreferrer">
                    <img 
                      src="/img/github-icon.svg"
                      alt="GitHub" 
                      style={{ width: '28px', height: '28px', objectFit: 'contain', boxShadow: 'none', borderRadius: '0' }}
                    />
                  </a>
                  <a href="https://tooljet.ai/slack" target="_blank" rel="noopener noreferrer">
                    <img
                      src="/img/slack-icon.svg"
                      alt="Slack"
                      style={{ width: '28px', height: '28px', objectFit: 'contain', boxShadow: 'none', borderRadius: '0' }}
                    />
                  </a>
                  <a href="https://x.com/ToolJet" target="_blank" rel="noopener noreferrer">
                    <img 
                      src="/img/x-icon.svg" 
                      alt="X" 
                      style={{ width: '28px', height: '28px', objectFit: 'contain', boxShadow: 'none', borderRadius: '0' }}
                    />
                  </a>
                </div>
              </>
            )}
          </div>

          {firstLinkGroup && (
            <div className="footer__col" style={{ flex: '1 1 150px' }}>
              <FooterLinks links={[firstLinkGroup]} />
            </div>
          )}
          {otherLinkGroups.map((linkGroup, idx) => (
            <div className="footer__col" style={{ flex: '1 1 150px' }} key={idx}>
              <FooterLinks links={[linkGroup]} />
            </div>
          ))}
        </div>

        <hr className="footer__divider" style={{ margin: '2rem 0', borderTop: '1px solid var(--ifm-color-emphasis-280)' }} />

        <div className="footer__bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="footer__copyright">
            {copyright && (
              <FooterCopyright copyright={copyright} />
            )}
          </div>
          <div className="footer__policies" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Link to="https://www.tooljet.ai/privacy" style={{color: '#606770'}}>Privacy policy</Link>
            <span></span><span></span><span></span>
            <Link to="https://www.tooljet.ai/terms" style={{color: '#606770'}}>Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default React.memo(Footer);
