class VersionsController < ApplicationController
    def index 
        @versions = AppVersion.where(app_id: params['app_id'])
    end
end
