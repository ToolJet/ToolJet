class GraphqlQueryService
  require "graphql/client"
  require "graphql/client/http"

  attr_accessor :data_query, :options, :source_options, :current_user, :data_source

  def initialize(data_query, data_source, options, source_options, current_user)
    @data_query = data_query
    @options = options
    @source_options = source_options
    @current_user = current_user
    @data_source = data_source
  end

  def process
    url = source_options['url']
    method = options['method'] || 'GET'
    headers = (options['headers'] || []).reject { |header| header[0].empty? }
    headers = headers.to_h
    body = options['body']
    url_params = options['url_params']
    query = options['query']

    http = GraphQL::Client::HTTP.new(url) do
      def headers(context)
        # Optionally set any HTTP headers
        { "User-Agent": "My Client" }
      end
    end)

    schema = GraphQL::Client.load_schema(http)

    client = GraphQL::Client.new(schema: schema, execute: http)

    byebug

    result = client.query(query)

    { code: response.code, data: JSON.parse(response.body) }
  end
end
