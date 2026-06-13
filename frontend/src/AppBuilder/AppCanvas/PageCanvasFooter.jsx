import React from 'react';
import EEPageCanvasFooter from '@ee/modules/Appbuilder/components/PageCanvasFooter';

const PageCanvasFooter = () => null;

export default process.env.TOOLJET_EDITION === 'ce' ? PageCanvasFooter : EEPageCanvasFooter;
