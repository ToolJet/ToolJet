import React from 'react';
import EEPageCanvasHeader from '@ee/modules/Appbuilder/components/PageCanvasHeader';

const PageCanvasHeader = () => null;

export default process.env.TOOLJET_EDITION === 'ce' ? PageCanvasHeader : EEPageCanvasHeader;
