class DataSourcesController < ApplicationController

    def create
        @data_source = DataSource.create(
            name: params[:name],
            kind: params[:kind],
            options: params[:options],
            app_id: params[:app_id]
        )
    end
end
