# frozen_string_literal: true

# API's to run queries with connection from the respective connection pool.

module DataSourceConnectionPool
  include ::AvailableDataSource

  # The connection_closure should always return the properly initialized client/connection 
  # which can run queries on the respective datasource.
  def get_connection_pool(datasource_type, connection_closure)
    connection_pool_size = ENV.fetch("CONNECTION_POOL_SIZE", 5).to_i
    connection_timeout = ENV.fetch("CONNECTION_TIMEOUT", 5).to_i
    if source_type_supported?(datasource_type)
      $connection_pools.fetch_or_store(
        datasource_type,
        make_connection_pool(connection_pool_size, connection_timeout, connection_closure)
      )
    else
      raise AvailableDataSource::UnSupportedSource.new
    end
  end

  # The connection_closure should always return the properly initialized client/connection 
  # which can run queries on the respective datasource.
  def with_connection(datasource_type, connection_closure)
    conn_pool = get_connection_pool(datasource_type, connection_closure)
    # Checkout a connection from the connection pool and yield it to the calling function's block.
    conn_pool.with do |conn|
      if block_given?
        yield(conn)
      end
    end
  end

  # Resets the connection pool of a particular source for the current process.
  # If no datasource_type is passed, removes all the keys from the global concurrent_map.
  def reset_connection_pool!(datasource_type = nil)
    if datasource_type
      if source_type_supported?(datasource_type)
        $connection_pools.delete(datasource_type)
      else
        raise AvailableDataSource::UnSupportedSource.new
      end
    else
      stored_data_source_keys = $connection_pools.keys
      stored_data_source_keys.each do |key|
        $connection_pools.delete(key)
      end
    end
  end

  private

  def make_connection_pool(connection_pool_size, connection_timeout, connection_closure)
    ConnectionPool.new(size: connection_pool_size,
                       timeout: connection_timeout) { connection_closure.call() }
  end
end
