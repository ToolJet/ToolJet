class AppsController < ApplicationController
    def create
        @app = App.create({ name: 'Untitled app', organization: @current_user.organization })
    end
end
