class MysqlQueryService
  include DatasourceUtils
  attr_accessor :data_query, :data_source, :options, :source_options, :current_user

  def initialize(data_query, options, source_options, current_user)
    @data_query = data_query
    @data_source = data_query.data_source
    @options = options
    @source_options = source_options
    @current_user = current_user
  end
  
  def self.connection options
    connection = Mysql2::Client.new(
        database: options.dig('database', 'value'),
        user: options.dig('username', 'value'),
        password: options.dig('password', 'value'),
        host: options.dig('host', 'value'),
        port: options.dig('port', 'value'),
    )
  end

  def process

    connection = get_cached_connection(data_source)
    connection = create_connection unless connection

    query_text = options['query']

    results = connection.query(query_text)

    { status: 'success', data: results.to_a }
  end

  private
    def create_connection
      connection = Mysql2::Client.new(
        host: source_options['host'],
        username: source_options['username'],
        password: source_options['password'],
        port: source_options['port'],
        database: source_options['database']
      )

      cache_connection(data_source, connection)
      connection
    end
end
