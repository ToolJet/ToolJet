class DataQueriesController < ApplicationController

    def index
        @data_queries = DataQuery.where(app_id: params[:app_id])
    end

    def create
        @data_query = DataQuery.create(
            name: params[:name],
            kind: params[:kind],
            options: params[:options],
            app_id: params[:app_id]
        )
    end
end
