class FolderAppsController < ApplicationController

    def create
        sleep(2)
        app_id = params[:app_id]
        folder_id = params[:folder_id]

        FolderApp.create(app_id: app_id, folder_id: folder_id)
    end
end
