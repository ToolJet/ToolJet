class RedisQueryService
  require 'redis'

  attr_accessor :data_query, :data_source, :options, :source_options, :current_user

  def initialize(data_query, data_source, options, source_options, current_user)
    @data_query = data_query
    @data_source = data_source
    @options = options
    @source_options = source_options
    @current_user = current_user
  end

  def self.connection options

    password = options.dig('password', 'value')
    password = nil if password.blank?

    connection = Redis.new(
      host: options.dig('host', 'value'),
      port: options.dig('port', 'value'),
      user: options.dig('username', 'value'),
      password: password
    )

    connection.ping
  end

  def process
    error = nil
    password = source_options['password']
    password = nil if password.blank?

    begin
      if $connections.include? data_source.id
        connection = $connections[data_source.id][:connection]
      else
        connection = Redis.new(
          host: source_options['host'],
          port: source_options['port'],
          user: source_options['username'],
          password: password
        )

        $connections[data_source.id] = { connection: connection }
      end

      query_text = options['query']

      result = connection.call(query_text.split(' '))
    rescue StandardError => e
      puts e
      error = e.message
    end

    { status: error ? 'failed' : 'success', data: result, error: { message: error } }
  end
end
