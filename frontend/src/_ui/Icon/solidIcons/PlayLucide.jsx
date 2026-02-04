import React from 'react';
import { Play } from 'lucide-react';

const PlayLucide = ({ fill = '#6A727C', width = '24', className = '', viewBox = '0 0 24 24' }) => {

    return (
        <Play size={width} color={fill} />
    );
};

export default PlayLucide;
