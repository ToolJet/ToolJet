class AppsController < ApplicationController

    def index
        @apps = policy_scope(App).order("created_at desc")
    end

    def create
        @app = App.new
        authorize @app, :create?
        @app = App.create({
            name: 'Untitled app',
            organization: @current_user.organization,
            current_version: AppVersion.new(name: 'v0')
        })
    end

    def show
        @app = authorize App.find params[:id]
    end

    def update
        @app = authorize App.find params[:id]
        authorize @app
        @app.update(definition: params[:definition], name: params[:name], current_version_id: params['currentVersion'])
    end

    def users
        @app = authorize App.find params[:app_id]
        @app_users = policy_scope(AppUser).where(app: @app).includes(:user)
    end
end
