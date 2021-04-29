class VersionsController < ApplicationController
  def create
    @app = App.find params[:app_id]
    name = params[:version]['versionName']
    AppVersion.create(app: @app, name: name)
  end

  def index
    @versions = AppVersion.where(app_id: params['app_id']).order('created_at desc')
  end

  def update
    @version = AppVersion.find params[:id]
    @version.update(definition: params[:definition])
  end
end
