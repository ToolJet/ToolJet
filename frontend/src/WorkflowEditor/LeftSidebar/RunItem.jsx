import React, { useMemo } from 'react';
import CheckIcon from './icons/check.svg';
import moment from 'moment';
import { capitalize } from 'lodash';

export default function RunItem({ run, onClick }) {
  const humanizedTime = useMemo(() => {
    const createdAtMoment = moment.utc(run.createdAt, 'YYYY-MM-DDTHH:mm:ssZ');
    const differenceDuration = moment().diff(createdAtMoment);
    return moment.duration(differenceDuration).humanize();
  }, [run.createdAt]);

  return (
    <div className="run-item" onClick={onClick}>
      <div className="check-icon">
        <CheckIcon />
      </div>
      <div className="text">
        <span>
          {capitalize(humanizedTime)}
          {humanizedTime === 'just now' ? '' : ' ago'}
        </span>
      </div>
    </div>
  );
}
