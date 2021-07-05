# frozen_string_literal: true

module DatasourceUtils
  extend ActiveSupport::Concern

  def get_cached_connection(data_source)
    connection = nil
    if $connections.include? data_source.id
      data = $connections[data_source.id]
      if data[:updated_at] === data_source.updated_at
        connection = $connections[data_source.id][:connection]
      end
    end
    connection
  end

  def cache_connection(data_source, connection)
    $connections[data_source.id] = { connection: connection, updated_at: data_source.updated_at }
  end

  def reset_connection(data_source)
    $connections.delete @data_source.id
  end
end
