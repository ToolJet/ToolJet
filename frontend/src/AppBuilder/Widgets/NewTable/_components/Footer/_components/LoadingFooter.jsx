import React, { memo } from 'react';
import Loader from '../../Loader';

export const LoadingFooter = memo(() => {
  return (
    <div className="card-footer d-flex align-items-center jet-table-footer justify-content-center">
      <div className={`table-footer row gx-0 d-flex align-items-center h-100`}>
        <div className="col d-flex justify-content-start custom-gap-4">
          <Loader width={83} height={28} />
        </div>
        <div className={'col d-flex justify-content-center h-100 w-100 pagination-loader'}>
          <Loader width={'100%'} height={28} />
        </div>
        <div className="col d-flex justify-content-end ">
          <Loader width={83} height={28} />
        </div>
      </div>
    </div>
  );
});
