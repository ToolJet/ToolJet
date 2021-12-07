import React, { useState, useEffect } from "react";
import { libraryAppService } from "@/_services";
import { toast } from "react-toastify";
import { history } from "@/_helpers";

export const LibraryApps = function LibraryApps({}) {
  const [deployingId, setDeployingId] = useState(null);
  const [libraryApps, setLibraryApps] = useState([]);

  function deployApp(id) {
    setDeployingId(id);
    libraryAppService
      .deploy(id)
      .then((data) => {
        setDeployingId(null);
        toast.info("App created.", {
          hideProgressBar: true,
          position: "top-center",
        });
        history.push(`/apps/${data.id}`);
      })
      .catch((e) => {
        toast.error(e.error, {
          hideProgressBar: true,
          position: "top-center",
        });
        setDeployingId(null);
      });
  }

  useEffect(() => {
    libraryAppService
      .templateManifests()
      .then((data) => {
        if (data["template_app_manifests"]) {
          setLibraryApps(data["template_app_manifests"]);
        }
      })
      .catch(() => {
        toast.error("Could not fetch library apps", {
          hideProgressBar: true,
          position: "top-center",
        });
        setLibraryApps([]);
        history.push(`/`);
      });
  }, []);

  return (
    <div className="col-md-12">
      <h2 className="mb-4">ToolJet app library</h2>
      <div className="row">
        {libraryApps.map((app) => {
          return (
            <div className="col-md-3">
              <div class="card">
                <div class="empty px-3 py-3">
                  {/* <div class="empty-img">
                </div> */}
                  <h3>{app.name}</h3>
                  <p class="text-muted">{app.description}</p>
                  <div className="flex">
                    {app.widgets.map((widget) => (
                      <span class="badge bg-azure-lt mx-2">{widget}</span>
                    ))}

                    {app.sources.map((source) => (
                      <span class="badge bg-green-lt mx-2">{source}</span>
                    ))}
                  </div>

                  <div class="empty-action">
                    <a
                      onClick={() => deployApp(app.id)}
                      class={`btn btn-primary ${
                        deployingId === app.id ? "btn-loading" : ""
                      }`}
                    >
                      {deployingId !== app.id && (
                        <img
                          src="/assets/images/icons/editor/launch.svg"
                          alt=""
                          width="13"
                          height="13"
                          className="mx-2"
                        />
                      )}
                      Deploy
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
