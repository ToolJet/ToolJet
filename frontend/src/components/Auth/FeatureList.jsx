import React from 'react';
import { DynamicIcon } from 'lucide-react/dynamic';

const FeatureList = () => {
  const features = [
    {
      icon: 'zap',
      title: 'Build apps, fast',
      description: 'Turn ideas into production-ready business\napplications in minutes with AI and low-code.',
      className: 'tw-text-[#FBCA73]',
    },
    {
      icon: 'workflow',
      title: 'Automate business processes',
      description: 'Use workflows and AI agents to streamline\nprocesses and drive real outcomes.',
      className: 'tw-text-[#486AE1]',
    },
    {
      icon: 'puzzle',
      title: 'Connect your data',
      description: 'Integrate with 70+ data sources instantly.',
      className: 'tw-text-[#9D78E7]',
    },
    {
      icon: 'key-round',
      title: 'Secure by default',
      description: 'Enterprise-grade compliance: authentication,\nauthorization, CI/CD, audit logs, and more.',
      className: 'tw-text-[#33B480]',
    },
  ];

  return (
    <div className="tw-flex tw-flex-col tw-gap-16 tw-items-start tw-relative tw-w-full tw-max-w-md">
      {features.map((feature) => (
        <div key={feature.icon} className="tw-flex tw-gap-5 tw-items-start tw-relative tw-shrink-0 tw-w-full">
          <div className="tw-overflow-clip tw-relative tw-shrink-0 tw-w-16 tw-h-16 tw-flex tw-items-center tw-justify-center">
            <DynamicIcon name={feature.icon} size={30} className={feature.className} />
          </div>
          <div className="tw-flex tw-flex-col tw-gap-1.5 tw-items-start tw-relative tw-shrink-0 tw-flex-1">
            <div className="tw-flex tw-flex-col tw-items-start tw-relative tw-shrink-0 tw-w-full">
              <div className="tw-flex tw-gap-3 tw-items-center tw-relative tw-shrink-0">
                <h3 className="tw-font-medium tw-leading-8 tw-not-italic tw-relative tw-shrink-0 tw-text-text-default tw-text-xl tw-tracking-[-0.4px] tw-m-0">
                  {feature.title}
                </h3>
              </div>
            </div>
            <p className="tw-font-normal tw-leading-6 tw-not-italic tw-relative tw-shrink-0 tw-text-text-placeholder tw-text-[15px] tw-tracking-[-0.3px] tw-w-full tw-whitespace-pre-line tw-m-0">
              {feature.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FeatureList;
