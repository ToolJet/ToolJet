import React from 'react';

export const BlankPage = function BlankPage({
  createApp
}) {
  return (<div>
    <div class="page-wrapper">
      <div class="container-xl">
      </div>
      <div class="page-body">
        <div class="container-xl d-flex flex-column justify-content-center">
          <div class="empty">
            <div class="empty-img"><img src="/assets/images/blank.svg" height="128" alt="" />
            </div>
            <p class="empty-title">You haven't created any apps yet.</p>
            <div class="empty-action">
              <a onClick={createApp} class="btn btn-primary text-light">
                <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      Create your first app
                    </a>
              <a href="https://docs.tooljet.io" target="_blank" class="btn btn-primary text-light mx-2">
                Read documentation
                    </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>)
}
