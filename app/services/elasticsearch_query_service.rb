# frozen_string_literal: true

class ElasticsearchQueryService
  include DatasourceUtils
  require "elasticsearch"

  attr_accessor :data_query, :data_source, :options, :source_options, :current_user

  def initialize(data_query, data_source, options, source_options, current_user)
    @data_query = data_query
    @options = options
    @source_options = source_options
    @current_user = current_user
    @data_source = data_source
  end

  def self.connection(options)
    scheme = options.dig("scheme", "value")
    host = options.dig("host", "value")
    port = options.dig("port", "value")
    username = options.dig("username", "value")
    password = options.dig("password", "value")

    unless username.blank? || password.blank?
      url = "#{scheme}://#{username}:#{password}@#{host}:#{port}"
    else
      url = "#{scheme}://#{host}:#{port}"
    end

    client = Elasticsearch::Client.new(
        url: url,
        retry_on_failure: 5,
        request_timeout: 15,
        adapter: :typhoeus
    )

    client.info # Try to fetch cluster info
  end

  def process
    data = {}
    error = nil

    connection = get_cached_connection(data_source)
    connection = create_connection unless connection

    begin
      operation = options["operation"]

      if operation == "search"
        index = options["index"]
        query = JSON.parse(options[:query])
        data = connection.search(index: index, body: query)
      end

      if operation == "index_document"
        index = options["index"]
        body = options["body"]

        data = connection.index(index: index, body: body)
      end

      if operation == "get"
        index = options["index"]
        id = options["id"]

        data = connection.get(index: index, id: id)
      end

      if operation == "update"
        index = options["index"]
        id = options["id"]
        body = options["body"]

        data = connection.update(index: index, id: id, body: body)
      end

    rescue StandardError => e
      puts e
      error = e.message
    end

    { data: data, error: error }
  end

  private
    def create_connection
      scheme = source_options["scheme"]
      host = source_options["host"]
      port = source_options["port"]
      username = source_options["username"]
      password = source_options["password"]

      unless username.blank? || password.blank?
        url = "#{scheme}://#{username}:#{password}@#{host}:#{port}"
      else
        url = "#{scheme}://#{host}:#{port}"
      end

      connection = Elasticsearch::Client.new(
        url: url,
        retry_on_failure: 5,
        request_timeout: 15,
        adapter: :typhoeus
      )

      cache_connection(data_source, connection)
      connection
    end
end
