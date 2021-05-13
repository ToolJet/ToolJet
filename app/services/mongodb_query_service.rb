class MongodbQueryService
  attr_accessor :data_query, :data_source, :options, :source_options, :current_user

  def initialize(data_query, options, source_options, current_user)
    @data_query = data_query
    @data_source = data_query.data_source
    @options = options
    @source_options = source_options
    @current_user = current_user
  end

  def self.connection options
    host = options.dig('host', 'value')
    port = options.dig('port', 'value')
    user = options.dig('username', 'value')
    password = options.dig('password', 'value')
    database = options.dig('database', 'value')

    user = nil if user.blank?
    password = nil if password.blank?

    connection = Mongo::Client.new(
      [ "#{host}:#{port}" ],
      database: database,
      server_selection_timeout: 5,
      user: user,
      password: password
    )
     
    connection.collections
  end

  def process
    error = nil
    data = []
    operation = options['operation']
    password = source_options['password']
    password = nil if password.blank?
    user = source_options['username']
    user = nil if user.blank?

    begin
      if $connections.include? data_source.id
        connection = $connections[data_source.id][:connection]
      else
        host = source_options['host']
        port = source_options['port']
        database = source_options['database']

        connection = Mongo::Client.new(
          [ "#{host}:#{port}" ],
          database: database,
          server_selection_timeout: 5,
          user: user,
          password: password
        )

        $connections[data_source.id] = { connection: connection }
      end

      if operation === 'list_collections'
        connection.collections.each { |coll| data << { name: coll.name }  }
      end

    rescue StandardError => e
      puts e
      error = e.message
    end

    { status: error ? 'failed' : 'success', data: data, error: { message: error } }
  end
end
