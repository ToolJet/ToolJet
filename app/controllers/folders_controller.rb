# frozen_string_literal: true

class FoldersController < ApplicationController
  def index
    @folders = Folder.where(organization: @current_user.organization)
  end

  def create
    Folder.create(name: params[:name], organization: @current_user.organization)
  end
end
