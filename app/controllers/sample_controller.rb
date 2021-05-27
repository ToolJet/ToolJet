class SampleController < ApplicationController

    APP_MAPPING = {
        'github-contributors': '47283446-3c9b-4fbb-b2f3-75540664df8c',
        'customer-dashboard': 'd0565c26-3169-4ca2-a4a8-af5f622139d6'
    }

    def deploy
        identifier = params[:identifier]
        app_id = APP_MAPPING[identifier.to_sym]
        app = App.find app_id

        new_app = App.new(
            name: app.name,
            organization: @current_user.organization
        )

        new_app.save

        version = AppVersion.create(
            app: new_app,
            definition: app.current_version.definition,
            name: 'v0'
        )

        new_app.update(current_version: version)


        AppUser.create(app: new_app, user: @current_user, role: 'admin')

        # clone data queries 

        source_mapping = { }

        DataSource.where(app: app).each do |source|
            new_source = DataSource.create(
                app_id: new_app.id, 
                name: source.name, 
                options: source.options, 
                kind: source.kind
            )

            source_mapping[source.id] = new_source.id
        end

        DataQuery.where(app: app).each do |query|
            DataQuery.create(
                app_id: new_app.id, 
                name: query.name, 
                options: query.options, 
                kind: query.kind,
                data_source_id: source_mapping[query.data_source_id]
            )
        end

        render json: new_app

    end
end
