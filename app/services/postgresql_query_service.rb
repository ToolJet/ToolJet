class PostgresqlQueryService
  attr_accessor :data_query, :data_source, :options, :source_options, :current_user

  def initialize(data_query, options, source_options, current_user)
    @data_query = data_query
    @data_source = data_query.data_source
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
    query_text = ''
    query_text = if options['mode'] === 'gui'
                   send("generate_#{options['operation']}_query", options)
                 else
                   options['query']
                 end

    if $connections.include? data_source.id
      connection = $connections[data_source.id][:connection]
    else
      connection = PG.connect(
        dbname: source_options['database'],
        user: source_options['username'],
        password: source_options['password'],
        host: source_options['host'],
        port: source_options['port']
      )

      $connections[data_source.id] = { connection: connection }
    end

    result = connection.exec(query_text)
    { status: 'success', data: result.to_a }
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
end
