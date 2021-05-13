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

    connection_type = options.dig('connection_type', 'value')

    if connection_type === "manual"

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
    else
      connection_string = options.dig('connection_string', 'value')
      connection = Mongo::Client.new(connection_string, server_selection_timeout: 5)
    end  

    connection.collections
  end

  def process
    error = nil
    data = []
    operation = options['operation']

    begin
      if $connections.include? data_source.id
        connection = $connections[data_source.id][:connection]
      else
        
        if source_options['connection_type'] === 'manual'
          password = source_options['password']
          password = nil if password.blank?
          user = source_options['username']
          user = nil if user.blank?

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
        else
          connection_string = source_options['connection_string']
          connection = Mongo::Client.new(connection_string, server_selection_timeout: 5)
        end

        $connections[data_source.id] = { connection: connection }
      end

      if operation === 'list_collections'
        connection.collections.each { |coll| data << { name: coll.name }  }
      end

      if operation === 'insert_one'
        collection = connection[options["collection"]]
        doc = JSON.parse(options["document"])
        result = collection.insert_one(doc)
      end

    rescue StandardError => e
      puts e
      error = e.message
    end

    { status: error ? 'failed' : 'success', data: data, error: { message: error } }
  end
end
