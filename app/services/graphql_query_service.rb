# frozen_string_literal: true

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
    url = source_options["url"]
    method = options["method"] || "GET"
    source_headers = (source_options["headers"] || []).reject { |header| header[0].empty? }.to_h
    url_params = source_options["url_params"]
    encoded_url = url_encoded_with_params(url, url_params)
    query = options["query"]
    client = Graphlient::Client.new(encoded_url, headers: source_headers)
    result = client.query(query)
    if result.errors.present?
      { code: 422, data: result.errors }
    else
      { code: 200, data: result.original_hash }
    end
  end
end


def url_encoded_with_params(original_url, url_params)
  if url_params.empty?
    original_url
  else
    uri = URI.parse(original_url)
    params = URI.decode_www_form(uri.query || "") + url_params
    uri.query = URI.encode_www_form(params)
    uri.to_s
  end
end
