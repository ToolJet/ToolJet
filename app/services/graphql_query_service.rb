class GraphqlQueryService

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


    client = Graphlient::Client.new(url)

    result = client.query(query)
    if result.errors.present?
      { code: 422, data: result.errors }
    else
      { code: 200, data: result.original_hash }
    end
  end
end
