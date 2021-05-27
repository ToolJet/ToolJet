import React, { useState, useEffect } from 'react';
import { sampleService } from '@/_services';
import { toast } from 'react-toastify';
import { history } from '@/_helpers';

const SAMPLE_APPS = [
  {
    name: 'GitHub leaderboard',
    description: 'Display the list of contributors of a GitHub repository and display profile details on selection.',
    widgets: ['Table'],
    sources: ['REST API'],
    id: 'github-contributors'
  },
  {
    name: 'Customer dashboard',
    description: 'Display the list of customers on a table and signups on a chart using data from a PostgreSQL database.',
    widgets: ['Table', 'Chart'],
    sources: ['PostgreSQL'],
    id: 'customer-dashboard'
  }
]

export const SampleApps = function SampleApps({
}) {

  const [deployingId, setDeployingId] = useState(null);

  function deployApp(id) { 
    setDeployingId(id);
    sampleService.deploy(id).then((data) => { 
      setDeployingId(null);
      toast.info('App created.', {
        hideProgressBar: true,
        position: 'top-center'
      });
      history.push(`/apps/${data.id}`);
    }).catch(() => {
      setDeployingId(null);
    })
  }

  return <div className="col-md-12">
    <center><h2 className="mb-4">Explore sample applications</h2></center>
    <div className="row">

      <div className="col-md-3">
      </div>

      {SAMPLE_APPS.map((app) => { 
        return (
          <div className="col-md-3">
            <div class="card">
              <div class="empty px-3">
                {/* <div class="empty-img">
                </div> */}
                <p class="empty-title">{app.name}</p>
                <p class="subtitle text-muted">
                  {app.description}
                </p>
                <div className="flex">
                  {app.widgets.map((widget) => (
                    <span class="badge bg-azure-lt mx-2">{widget}</span>
                  ))}
                  
                  {app.sources.map((source) => (
                    <span class="badge bg-green-lt mx-2">{source}</span>
                  ))}
                  
                </div>
                
                <div class="empty-action">
                  <a onClick={() => deployApp(app.id)} class={`btn btn-primary ${deployingId === app.id ?'btn-loading' : ''}`}>
                    {deployingId !== app.id && 
                      <img src="/assets/images/icons/editor/launch.svg" alt="" width="13" height="13" className="mx-2" />
                    }
                    Deploy
                  </a>
                </div>
              </div>
            </div>
          </div>
        )
      })}
      
    </div>
  </div>
}
