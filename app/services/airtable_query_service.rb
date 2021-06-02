class AirtableQueryService
  attr_accessor :query, :source, :options, :source_options, :current_user

  def initialize(data_query, data_source, options, source_options, current_user)
    @query = data_query
    @source = data_source
    @options = options
    @source_options = source_options
    @current_user = current_user
  end

  def process
    operation = options['operation']
    api_key = source_options['api_key']
    error = false

    if operation === 'list_records'
      
      base_id = options['base_id']
      table_name = options['table_name']
      page_size = options['page_size']
      offset = options['offset']

      result = list_records(api_key, base_id, table_name, page_size, offset)

      data = result
      error = result.code != 200
    end

    if operation === 'retrieve_record'
      
      base_id = options['base_id']
      table_name = options['table_name']
      record_id = options['record_id']

      result = retrieve_record(api_key, base_id, table_name, record_id)

      data = result
      error = result.code != 200
    end

    if error
      { status: 'error', code: 500, message: data["message"], data: data }
    else
      { status: 'success', data: data }
    end
  end

  private

    def list_records(api_key, base_id, table_name, page_size, offset)

      result = HTTParty.get(URI.encode("https://api.airtable.com/v0/#{base_id}/#{table_name}"),
        headers: { 'Content-Type':
        'application/json', "Authorization": "Bearer #{api_key}" })

      result
    end

    def retrieve_record(api_key, base_id, table_name, record_id)

      result = HTTParty.get(URI.encode("https://api.airtable.com/v0/#{base_id}/#{table_name}/#{record_id}"),
        headers: { 'Content-Type':
        'application/json', "Authorization": "Bearer #{api_key}" })

      result
    end
end
