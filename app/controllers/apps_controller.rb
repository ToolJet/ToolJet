class AppsController < ApplicationController

    def index
        authorize App
        @apps = App.where(organization: @current_user.organization).order("created_at desc")
    end
    
    def create
        authorize App
        @app = App.create({ 
            name: 'Untitled app', 
            organization: @current_user.organization,
            current_version: AppVersion.new(name: 'v0')
        })
    end

    def show
        @app = App.find params[:id]
        authorize @app
    end

    def update
        authorize App
        @app = App.find params[:id]
        @app.update(params["app"].permit("name", "current_version_id"))
    end

    def users
        @app = App.find params[:app_id]
        @app_users = AppUser.where(app: @app).includes(:user)
    end
end
