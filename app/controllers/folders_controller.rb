class FoldersController < ApplicationController
    def create
        Folder.create(name: params[:name], organization: @current_user.organization)
    end
end
