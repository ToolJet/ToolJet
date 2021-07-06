# frozen_string_literal: true

class AppsController < ApplicationController
  skip_before_action :authenticate_request, only: %i[slugs]

  def index
    authorize App

    folder_id = params[:folder]

    if folder_id.blank?
      @scope = App.where(organization: @current_user.organization)
    else
      @folder = Folder.find folder_id
      @scope = @folder.apps
    end

    @apps = @scope.order("created_at desc")
                  .page(params[:page])
                  .per(10)
                  .includes(:user)

    @meta = {
      total_pages: @apps.total_pages,
      folder_count: @scope.count,
      total_count: App.where(organization: @current_user.organization).count,
      current_page: @apps.current_page
    }
  end

  def create
    authorize App
    @app = App.create!({
                         name: "Untitled app",
                         organization: @current_user.organization,
                         current_version: AppVersion.new(name: "v0"),
                         user: @current_user
                       })
    AppUser.create(app: @app, user: @current_user, role: "admin")
  end

  def show
    @app = App.find(params[:id])

    authorize @app
  end

  def destroy
    app = App.find params[:id]
    app.update(current_version: nil)
    app.destroy
  end

  def slugs
    @app = App.find_by(slug: params[:slug])

    return render_not_authenticated if !@app.is_public && current_user.blank?

    authorize @app, :show_public?
    render :show
  end

  def update
    @app = App.find params[:id]
    authorize @app

    @app.assign_attributes(params[:app].permit(:name, :current_version_id, :is_public, :slug))

    if @app.valid?
      @app.save # renders default status 204
    else
      render json: { message: @app.errors.full_messages }, status: 422
    end
  end

  def users
    @app = App.find params[:app_id]
    @app_users = AppUser.where(app: @app).includes(:user)
  end
end
