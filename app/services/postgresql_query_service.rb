class PostgresqlQueryService
  include DatasourceUtils
  attr_accessor :data_query, :data_source, :options, :source_options, :current_user

  def initialize(data_query, data_source, options, source_options, current_user)
    @data_query = data_query
    @data_source = data_source
    @options = options
    @source_options = source_options
    @current_user = current_user
  end

  def self.connection options
    PG.connect( 
        dbname: options.dig('database', 'value'),
        user: options.dig('username', 'value'),
        password: options.dig('password', 'value'),
        host: options.dig('host', 'value'),
        port: options.dig('port', 'value'),
    )
  end

  def process

    error = false

    begin
      connection = get_cached_connection(data_source)
      connection = create_connection unless connection


      query_text = ''
      query_text = if options['mode'] === 'gui'
                    send("generate_#{options['operation']}_query", options)
                  else
                    options['query']
                  end

      result = connection.exec(query_text)

    rescue StandardError => e
      if connection&.status === PG::Constants::CONNECTION_BAD
        connection&.finish
        reset_connection(data_source)
      end

      puts e
      error = { message: e.message } 
    end

    if error
      { status: 'error', code: 500, message: error[:message] }
    else
      { status: 'success', data: result.to_a }
    end
  end

  private

  def generate_bulk_update_pkey_query(options)
    query_text = ''

    table_name = options['table']
    primary_key = options['primary_key_column']
    records = options['records']

    records.each do |record|
      query_text = "#{query_text} UPDATE #{table_name} SET"

      record.each do |field, value|
        query_text = " #{query_text} #{field} = '#{value}', "
      end

      query_text = query_text.rstrip.chop
      query_text = "#{query_text} WHERE #{primary_key} = #{record[primary_key]};"
    end

    query_text
  end

  def create_connection 
    connection = PG.connect(
      dbname: source_options['database'],
      user: source_options['username'],
      password: source_options['password'],
      host: source_options['host'],
      port: source_options['port']
    )

    connection.type_map_for_results = PG::BasicTypeMapForResults.new connection
    
    cache_connection(data_source, connection)

    connection
  end
end
