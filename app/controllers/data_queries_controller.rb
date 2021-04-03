class DataQueriesController < ApplicationController

    def create
        @data_query = DataQuery.create(
            name: params[:name],
            kind: params[:kind],
            options: params[:options],
            app_id: params[:app_id]
        )
    end
end
