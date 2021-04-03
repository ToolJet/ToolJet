class DataSourcesController < ApplicationController

    def index
        @data_sources = DataSource.where(app_id: params[:app_id])
    end

    def create
        @data_source = DataSource.create(
            name: params[:name],
            kind: params[:kind],
            options: params[:options],
            app_id: params[:app_id]
        )
    end
end
