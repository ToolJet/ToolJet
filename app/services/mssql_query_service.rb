class MssqlQueryService
  include DatasourceUtils
  attr_accessor :data_query, :data_source, :options, :source_options, :current_user

  def initialize(data_query, data_source, options, source_options, current_user)
    @data_query = data_query
    @data_source = data_source
    @options = options
    @source_options = source_options
    @current_user = current_user
  end

  def self.connection(options)
    TinyTds::Client.new(
      database: options.dig("database", "value"),
      username: options.dig("username", "value"),
      password: options.dig("password", "value"),
      host: options.dig("host", "value"),
      port: options.dig("port", "value")
    )
  end

  def process
    connection = get_cached_connection(data_source)
    connection = create_connection unless connection
    query_text = options["query"]
    results = connection.execute(query_text)

    { status: "success", data: results.to_a }
  rescue StandardError => e
    if connection&.active?
      connection&.close
      reset_connection(data_source)
    end

    error = { message: e.message, code: 400 }
  end

  private

  def create_connection
    connection =  TinyTds::Client.new(
      database: source_options["database"],
      username: source_options["username"],
      password: source_options["password"],
      host: source_options["host"],
      port: source_options["port"]
    )

    cache_connection(data_source, connection)
    connection
  end
end
