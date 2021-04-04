class DataQueriesController < ApplicationController

    def index
        @data_queries = DataQuery.where(app_id: params[:app_id])
    end

    def create
        @data_query = DataQuery.create(
            name: params[:name],
            kind: params[:kind],
            options: params[:options],
            app_id: params[:app_id],
            data_source_id: params[:data_source_id]
        )
    end

    def run
        @data_query = DataQuery.find params[:data_query_id]
        query_service = QueryService.new @data_query
        result = query_service.process

        render json: result
    end
end
