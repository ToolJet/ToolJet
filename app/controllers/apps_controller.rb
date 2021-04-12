class AppsController < ApplicationController

    def index
        @apps = App.where(organization: @current_user.organization).order("created_at desc")
    end
    
    def create
        @app = App.create({ 
            name: 'Untitled app', 
            organization: @current_user.organization,
            current_version: AppVersion.new(name: 'v0')
        })
    end

    def show 
        @app = App.find params[:id]
    end

    def update
        @app = App.find params[:id]
        @app.update(definition: params[:definition], name: params[:name], current_version_id: params['currentVersion'])
    end

    def users
        @app = App.find params[:app_id]
        @app_users = AppUser.where(app: @app).includes(:user)
    end
end
