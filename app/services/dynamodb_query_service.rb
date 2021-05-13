class DynamodbQueryService
  attr_accessor :data_query, :data_source, :options, :source_options, :current_user

  def initialize(data_query, options, source_options, current_user)
    @data_query = data_query
    @data_source = data_query.data_source
    @options = options
    @source_options = source_options
    @current_user = current_user
  end

  def self.connection options
    
    region = options.dig('region', 'value')
    access_key = options.dig('access_key', 'value')
    secret_key = options.dig('secret_key', 'value')

    credentials = Aws::Credentials.new(access_key, secret_key)
    dynamodb = Aws::DynamoDB::Client.new(region: region, credentials: credentials)
    
    dynamodb.list_tables 
  end

  def process
    error = nil
    data = []
    operation = options["operation"]

    begin
      connection = get_connection
      
      if operation === 'list_tables'
        tables = connection.list_tables 
        data = tables.to_h
      end

    rescue StandardError => e
      puts e
      error = e.message
    end

    { status: error ? 'failed' : 'success', data: data, error: { message: error } }
  end

  private 
    def get_connection
      if $connections.include? data_source.id
        connection = $connections[data_source.id][:connection]
      else
        region = source_options['region']
        access_key = source_options['access_key']
        secret_key = source_options['secret_key']

        credentials = Aws::Credentials.new(access_key, secret_key)
        connection = Aws::DynamoDB::Client.new(region: region, credentials: credentials)

        $connections[data_source.id] = { connection: connection }
      end

      connection
    end
end
