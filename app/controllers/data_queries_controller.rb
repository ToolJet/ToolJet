# frozen_string_literal: true

class DataQueriesController < ApplicationController
  skip_before_action :authenticate_request, only: [:run]

  def index
    app = App.find(params[:app_id])
    authorize app, :show_public?

    @data_queries = app.data_queries
  end

  def create
    @data_query = DataQuery.create(
      name: params[:name],
      kind: params[:kind],
      options: params[:options],
      app_id: params[:app_id],
      data_source_id: params[:data_source_id]
    )

    if @data_query.errors.present?
      render json: { message: "Query could not be created" }, status: :internal_server_error
    else
      render json: { message: "success" }
    end
  end

  def update
    @data_query = DataQuery.find params[:id]
    @data_query.update(options: params[:options], name: params[:name])

    if @data_query.errors.present?
      render json: { message: "Query could not be updated" }, status: :internal_server_error
    else
      render json: { message: "success" }
    end
  end

  def run
    @data_query = DataQuery.find params[:data_query_id]

    unless @data_query.app.is_public
      authenticate_request
    end

    query_service = QueryService.new @data_query, params[:options], @current_user
    result = query_service.process
    render json: result, status: result[:code] || 200
  end

  def preview
    query = params[:query]
    options = params[:options]

    query_service = QueryService.new query, params[:options], @current_user
    result = query_service.process

    render json: result, status: result[:code] || 200
  end
end
