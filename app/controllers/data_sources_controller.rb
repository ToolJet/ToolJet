class DataSourcesController < ApplicationController

    def index
        @data_sources = DataSource.where(app_id: params[:app_id])
    end

    def create
        options = params[:options]

        options_to_save = {}
        options.each do |option|

            if option["encrypted"]
                credential = Credential.create(value: option["value"])

                options_to_save[option["key"]] = {
                    credential_id: credential.id,
                    encrypted: option["encrypted"]
                }
            else
                options_to_save[option["key"]] = {
                    value: option["value"],
                    encrypted: option["encrypted"]
                }
            end
        end

        @data_source = DataSource.create(
            name: params[:name],
            kind: params[:kind],
            options: options_to_save,
            app_id: params[:app_id]
        )
    end
    
    def test_connection
        service = DataSourceConnectionService.new params[:kind], params[:options]
        service.process
        render json: { status: 200 }
    rescue StandardError => error
        render json: { error: error }, status: 500
    end
end
