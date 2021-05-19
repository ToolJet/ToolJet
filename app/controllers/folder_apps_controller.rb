class FolderAppsController < ApplicationController

    def create
        app_id = params[:app_id]
        folder_id = params[:folder_id]

        @app = App.find app_id

        unless AppPolicy.new(@current_user, @app).update?
            render json: { message: 'Could not add app to folder due to insufficient permissions' }, status: 500
        end

        folder_app = FolderApp.new(app_id: app_id, folder_id: folder_id)

        if folder_app.save
            render json: {}
        else
            render json: { message: 'App already in folder' }, status: 500
        end
    end
end
