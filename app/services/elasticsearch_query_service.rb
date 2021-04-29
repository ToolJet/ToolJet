class ElasticsearchQueryService
  require 'elasticsearch'

  attr_accessor :data_query, :data_source, :options, :source_options, :current_user

  def initialize(data_query, options, source_options, current_user)
    @data_query = data_query
    @options = options
    @source_options = source_options
    @current_user = current_user
    @data_source = data_query.data_source
  end

  def process
    data = {}
    error = nil

    if $connections.include? data_source.id
      connection = $connections[data_source.id][:connection]
    else
      connection = Elasticsearch::Client.new(
        url: "#{source_options['host']}:#{source_options['port']}",
        retry_on_failure: 5,
        request_timeout: 30,
        adapter: :typhoeus
      )

      $connections[data_source.id] = { connection: connection }
    end

    begin
      operation = options['operation']

      if operation == 'search'
        index = options['index']
        query = options[:query].to_unsafe_h
        data = connection.search(index: index, body: query)
      end
    rescue StandardError => e
      puts e
      error = e.message
    end

    { data: data, error: error }
  end
end
