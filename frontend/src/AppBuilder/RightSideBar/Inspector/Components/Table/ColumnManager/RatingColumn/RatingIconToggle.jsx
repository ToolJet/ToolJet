import ToggleGroup from '@/ToolJetUI/SwitchGroup/ToggleGroup';
import ToggleGroupItem from '@/ToolJetUI/SwitchGroup/ToggleGroupItem';
import React from 'react';
import StarIcon from '@/AppBuilder/Widgets/Rating/icons/star';
import HeartIcon from '@/AppBuilder/Widgets/Rating/icons/heart';
import './ratingColumn.scss';

const RatingIconToggle = ({ value, onChange }) => {
  const handleChange = (_value) => {
    onChange(_value);
  };

  return (
    <div className="table-rating-column-inspector-toggle">
      <ToggleGroup onValueChange={handleChange} defaultValue={value || 'stars'}>
        <ToggleGroupItem key={'stars'} value={'stars'}>
          <StarIcon width={18} height={18} fill={'#CCD1D5'} />
        </ToggleGroupItem>
        <ToggleGroupItem key={'hearts'} value={'hearts'}>
          <HeartIcon width={18} height={18} fill={'#CCD1D5'} />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

export default RatingIconToggle;
