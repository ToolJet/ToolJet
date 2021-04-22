class GooglesheetsQueryService

    attr_accessor :query, :ource, :options, :source_options, :current_user

    def initialize(data_query, options, source_options, current_user)
        @query = data_query
        @source = query.data_source
        @options = options
        @source_options = source_options
        @current_user = current_user
    end

    def process

        operation = query.options["operation"]
        access_token = source_options["access_token"]

        if operation === "read"
            spreadsheet_id = query.options["spreadsheet_id"]
            sheet = query.options["sheet"]

            result = HTTParty.get("https://sheets.googleapis.com/v4/spreadsheets/#{spreadsheet_id}/values/#{sheet}!A1:V101", 
                headers: { 'Content-Type':
                'application/json', "Authorization": "Bearer #{access_token}"})

            headers = result["values"][0]
            values = result["values"][1..]

            parsed_values = []
            values.each do |value|
                row = { }
                headers.each_with_index do |header, index|
                    row[header] = value[index]
                end
                parsed_values << row
            end
        end
        

        { status: 'success', data: parsed_values }
    end
end
