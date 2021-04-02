class AppsController < ApplicationController
    
    def create
        @app = App.create({ name: 'Untitled app', organization: @current_user.organization })
    end

    def show 
        @app = App.find params[:id]
    end

    def update
        @app = App.update(definition: params[:definition])
    end
end
