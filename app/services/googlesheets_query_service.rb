class GooglesheetsQueryService
  attr_accessor :query, :source, :options, :source_options, :current_user

  def initialize(data_query, options, source_options, current_user)
    @query = data_query
    @source = query.data_source
    @options = options
    @source_options = source_options
    @current_user = current_user
  end

  def process
    operation = query.options['operation']
    access_token = source_options['access_token']
    error = false

    if operation === 'read'
      result = read_data(access_token)

      if result.code === 401
        access_token = refresh_access_token
        result = read_data(access_token)
      end

      if result.code === 200

        headers = result['values'][0]
        values = result['values'][1..]

        data = []
        values.each do |value|
          row = {}
          headers.each_with_index do |header, index|
            row[header] = value[index]
          end
          data << row
        end
      
      else 
        error = true
        data = result["error"]
      end
    end

    if error
      { status: 'error', code: 500, message: data["message"], data: data }
    else
      { status: 'success', data: data }
    end
  end

  private
    def read_data(access_token)
      spreadsheet_id = query.options['spreadsheet_id']
      sheet = query.options['sheet']

      result = HTTParty.get("https://sheets.googleapis.com/v4/spreadsheets/#{spreadsheet_id}/values/#{sheet}!A1:V101",
        headers: { 'Content-Type':
        'application/json', "Authorization": "Bearer #{access_token}" })

      result
    end

    def refresh_access_token
      GoogleOauthService.refresh_access_token(source_options['refresh_token'], @source )
    end
end
