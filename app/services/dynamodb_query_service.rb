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
    
  end
end
