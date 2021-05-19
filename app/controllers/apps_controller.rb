class AppsController < ApplicationController
  skip_before_action :authenticate_request, only: [:show]

  def index
    authorize App

    folder_id = params[:folder]

    if folder_id.blank?
      @scope = App.where(organization: @current_user.organization)
    else
      @folder = Folder.find folder_id
      @scope = @folder.apps
    end

    @apps = @scope.order('created_at desc')
    .page(params[:page])
    .per(10)
    .includes(:user)

    @meta = { 
      total_pages: @apps.total_pages,
      folder_count: @scope.count,
      total_count: App.count,
      current_page: @apps.current_page   
    }               
  end

  def create
    authorize App
    @app = App.create({
                        name: 'Untitled app',
                        organization: @current_user.organization,
                        current_version: AppVersion.new(name: 'v0'),
                        user: @current_user
                      })
  end

  def show
      @app = App.find params[:id]

      # Logic to bypass auth for public apps
      unless @app.is_public
          authenticate_request
          authorize @app
      end
  end

  def update
    authorize App
    @app = App.find params[:id]
    @app.update(params['app'].permit('name', 'current_version_id', 'is_public'))
  end

  def users
    @app = App.find params[:app_id]
    @app_users = AppUser.where(app: @app).includes(:user)
  end
end
