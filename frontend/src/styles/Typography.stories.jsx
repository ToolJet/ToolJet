import React from 'react';

export default {
  title: 'Design System/Typography',
  component: 'div',
};

const TypographySpecimen = ({ name, className, details }) => (
  <div style={{ padding: '1rem 0', borderBottom: '1px solid #eee' }}>
    <div className={className}>{name}</div>
    <div
      style={{
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#666',
        marginTop: '0.5rem',
      }}
    >
      <p style={{ margin: '0.25rem 0' }}>
        <strong>Class:</strong> .{className}
      </p>
      {Object.entries(details).map(([key, value]) => {
        const propertyName = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
        return (
          <p key={key} style={{ margin: '0.25rem 0' }}>
            <strong>{propertyName}:</strong> {value}
          </p>
        );
      })}
    </div>
  </div>
);

const typographyData = {
  display: [
    {
      name: 'Display Small',
      className: 'tw-font-display-small',
      details: {
        fontFamily: 'var(--font-family-inter)',
        fontWeight: 'var(--font-weight-medium)',
        fontSize: 'var(--font-size-display-small)',
        lineHeight: 'var(--line-height-display-medium)',
        letterSpacing: 'var(--letter-spacing-display-medium)',
      },
    },
  ],
  title: [
    {
      name: 'Title Heavy XX-Large',
      className: 'tw-font-title-heavy-xx-large',
      details: {
        fontFamily: 'var(--font-family-inter)',
        fontWeight: 'var(--font-weight-semi-bold)',
        fontSize: 'var(--font-size-xx-large)',
        lineHeight: 'var(--line-height-xx-large)',
        letterSpacing: 'var(--letter-spacing-xx-large)',
      },
    },
    {
      name: 'Title XX-Large',
      className: 'tw-font-title-xx-large',
      details: {
        fontFamily: 'var(--font-family-inter)',
        fontWeight: 'var(--font-weight-medium)',
        fontSize: 'var(--font-size-xx-large)',
        lineHeight: 'var(--line-height-xx-large)',
        letterSpacing: 'var(--letter-spacing-xx-large)',
      },
    },
    {
      name: 'Title Heavy X-Large',
      className: 'tw-font-title-heavy-x-large',
      details: {
        fontFamily: 'var(--font-family-inter)',
        fontWeight: 'var(--font-weight-semi-bold)',
        fontSize: 'var(--font-size-x-large)',
        lineHeight: 'var(--line-height-x-large)',
        letterSpacing: 'var(--letter-spacing-x-large)',
      },
    },
    {
      name: 'Title X-Large',
      className: 'tw-font-title-x-large',
      details: {
        fontFamily: 'var(--font-family-inter)',
        fontWeight: 'var(--font-weight-medium)',
        fontSize: 'var(--font-size-x-large)',
        lineHeight: 'var(--line-height-x-large)',
        letterSpacing: 'var(--letter-spacing-x-large)',
      },
    },
    {
      name: 'Title Heavy Large',
      className: 'tw-font-title-heavy-large',
      details: {
        fontFamily: 'var(--font-family-inter)',
        fontWeight: 'var(--font-weight-semi-bold)',
        fontSize: 'var(--font-size-large)',
        lineHeight: 'var(--line-height-large)',
        letterSpacing: 'var(--letter-spacing-large)',
      },
    },
    {
      name: 'Title Large',
      className: 'tw-font-title-large',
      details: {
        fontFamily: 'var(--font-family-inter)',
        fontWeight: 'var(--font-weight-medium)',
        fontSize: 'var(--font-size-large)',
        lineHeight: 'var(--line-height-large)',
        letterSpacing: 'var(--letter-spacing-large)',
      },
    },
    {
      name: 'Title Heavy Medium',
      className: 'tw-font-title-heavy-medium',
      details: {
        fontFamily: 'var(--font-family-inter)',
        fontWeight: 'var(--font-weight-semi-bold)',
        fontSize: 'var(--font-size-default)',
        lineHeight: 'var(--line-height-default)',
        letterSpacing: 'var(--letter-spacing-default)',
      },
    },
    {
      name: 'Title Default',
      className: 'tw-font-title-default',
      details: {
        fontFamily: 'var(--font-family-inter)',
        fontWeight: 'var(--font-weight-medium)',
        fontSize: 'var(--font-size-default)',
        lineHeight: 'var(--line-height-default)',
        letterSpacing: 'var(--letter-spacing-default)',
      },
    },
    {
      name: 'Title Heavy Small',
      className: 'tw-font-title-heavy-small',
      details: {
        fontFamily: 'var(--font-family-inter)',
        fontWeight: 'var(--font-weight-semi-bold)',
        fontSize: 'var(--font-size-small)',
        lineHeight: 'var(--line-height-small)',
        letterSpacing: 'var(--letter-spacing-small)',
      },
    },
    {
      name: 'Title Small',
      className: 'tw-font-title-small',
      details: {
        fontFamily: 'var(--font-family-inter)',
        fontWeight: 'var(--font-weight-medium)',
        fontSize: 'var(--font-size-small)',
        lineHeight: 'var(--line-height-small)',
        letterSpacing: 'var(--letter-spacing-small)',
      },
    },
    {
      name: 'Section Title',
      className: 'tw-font-title-section-title',
      details: {
        fontFamily: 'var(--font-family-inter)',
        fontWeight: 'var(--font-weight-semi-bold)',
        fontSize: 'var(--font-size-small)',
        lineHeight: 'var(--line-height-small)',
        letterSpacing: 'var(--letter-spacing-small)',
      },
    },
  ],
  body: [
    {
      name: 'Body XX-Large',
      className: 'tw-font-body-xx-large',
      details: {
        fontFamily: 'var(--font-family-inter)',
        fontWeight: 'var(--font-weight-regular)',
        fontSize: 'var(--font-size-xx-large)',
        lineHeight: 'var(--line-height-xx-large)',
        letterSpacing: 'var(--letter-spacing-xx-large)',
      },
    },
    {
      name: 'Body X-Large',
      className: 'tw-font-body-x-large',
      details: {
        fontFamily: 'var(--font-family-inter)',
        fontWeight: 'var(--font-weight-regular)',
        fontSize: 'var(--font-size-x-large)',
        lineHeight: 'var(--line-height-x-large)',
        letterSpacing: 'var(--letter-spacing-x-large)',
      },
    },
    {
      name: 'Body Large',
      className: 'tw-font-body-large',
      details: {
        fontFamily: 'var(--font-family-inter)',
        fontWeight: 'var(--font-weight-regular)',
        fontSize: 'var(--font-size-large)',
        lineHeight: 'var(--line-height-large)',
        letterSpacing: 'var(--letter-spacing-large)',
      },
    },
    {
      name: 'Body Default',
      className: 'tw-font-body-default',
      details: {
        fontFamily: 'var(--font-family-inter)',
        fontWeight: 'var(--font-weight-regular)',
        fontSize: 'var(--font-size-default)',
        lineHeight: 'var(--line-height-default)',
        letterSpacing: 'var(--letter-spacing-default)',
      },
    },
    {
      name: 'Body Small',
      className: 'tw-font-body-small',
      details: {
        fontFamily: 'var(--font-family-inter)',
        fontWeight: 'var(--font-weight-regular)',
        fontSize: 'var(--font-size-small)',
        lineHeight: 'var(--line-height-small)',
        letterSpacing: 'var(--letter-spacing-small)',
      },
    },
  ],
  code: [
    {
      name: 'Code Regular',
      className: 'tw-font-code-regular',
      details: {
        fontFamily: 'var(--font-family-geist-mono)',
        fontWeight: 'var(--font-weight-regular)',
        fontSize: 'var(--font-size-default)',
        lineHeight: 'var(--line-height-default)',
      },
    },
  ],
};

const Template = () => (
  <>
    <h1>Typography</h1>
    <p>This document showcases the typographic scale and font styles used throughout the application.</p>

    <h2>Display</h2>
    {typographyData.display.map((font) => (
      <TypographySpecimen key={font.className} {...font} />
    ))}

    <hr />

    <h2>Titles</h2>
    {typographyData.title.map((font) => (
      <TypographySpecimen key={font.className} {...font} />
    ))}

    <hr />

    <h2>Body</h2>
    {typographyData.body.map((font) => (
      <TypographySpecimen key={font.className} {...font} />
    ))}

    <hr />

    <h2>Code</h2>
    {typographyData.code.map((font) => (
      <TypographySpecimen key={font.className} {...font} />
    ))}
  </>
);

export const Typography = Template.bind({});
