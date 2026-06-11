import React from 'react';
import clsx from 'clsx';
import styles from './HomepageFeatures.module.css';

const FeatureList = [
  {
    title: 'Getting Started',
    Svg: require('../../static/img/home/getting-started.svg').default,
    description: (
      <>
        Quickly build an app to query a PostgreSQL database and siaplay the data on a table widget.
      </>
    ),
  },
  {
    title: 'Datasource Reference',
    Svg: require('../../static/img/home/data-source-reference.svg').default,
    description: (
      <>
        Documentation on datasource integrations, their connection methods and query editor usage.
      </>
    ),
  },
  {
    title: 'Widget Reference',
    Svg: require('../../static/img/home/widgets.svg').default,
    description: (
      <>
        Read more about the properties and events of each widgets.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} alt={title} />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
